require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const requestLogger = require('./middleware/requestLogger');
const performanceMonitor = require('./middleware/performanceMonitor');
const errorHandler = require('./middleware/errorHandler');
const loggerRoutes = require('./routes/loggerRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { initProducer, sendMessage } = require('./kafka/producer');
const { initConsumer } = require('./kafka/consumer');
const kafka = require('./kafka/config');

const app = express();
const PORT = process.env.PORT || 3000;
const executionTimeLogger = require('./middleware/executionTimeLogger');

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Phone Shop API with Kafka Integration',
            version: '1.0.0',
            description: 'API документация для магазина телефонов с интеграцией Kafka',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Local server',
            },
        ],
        tags: [
            {
                name: 'Phones',
                description: 'Операции с телефонами'
            },
            {
                name: 'Kafka',
                description: 'Операции с Kafka messaging'
            }
        ]
    },
    apis: ['./server.js'], // путь к файлам с комментариями JSDoc
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(performanceMonitor);
app.use(executionTimeLogger);

// Маршруты для управления логированием
app.use('/api/logger', loggerRoutes);

// Данные для хранения в памяти
let phones = [
    {
        id: 1,
        brand: "Apple",
        model: "iPhone 13",
        price: 999.99,
        stock: 50
    }
];

/**
 * @swagger
 * /api/phones:
 *   get:
 *     summary: Получить список всех телефонов
 *     tags: [Phones]
 *     responses:
 *       200:
 *         description: Список телефонов успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   brand:
 *                     type: string
 *                   model:
 *                     type: string
 *                   price:
 *                     type: number
 *                   stock:
 *                     type: integer
 */
// GET - получить все телефоны
app.get('/api/phones', (req, res) => {
    res.json(phones);
});

/**
 * @swagger
 * /api/phones/{id}:
 *   get:
 *     summary: Получить телефон по ID
 *     tags: [Phones]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID телефона
 *     responses:
 *       200:
 *         description: Телефон успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 brand:
 *                   type: string
 *                 model:
 *                   type: string
 *                 price:
 *                   type: number
 *                 stock:
 *                   type: integer
 *       404:
 *         description: Телефон не найден
 */
// GET - получить телефон по ID
app.get('/api/phones/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const phone = phones.find(p => p.id === id);
    
    if (!phone) {
        return res.status(404).json({ message: 'Телефон не найден' });
    }
    
    res.json(phone);
});

/**
 * @swagger
 * /api/phones:
 *   post:
 *     summary: Добавить новый телефон
 *     tags: [Phones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Телефон успешно добавлен
 *       400:
 *         description: Неверные данные запроса
 */
// POST - создать новый телефон
app.post('/api/phones', async (req, res) => {
    const newPhone = {
        id: phones.length + 1,
        brand: req.body.brand,
        model: req.body.model,
        price: req.body.price,
        stock: req.body.stock
    };
    
    phones.push(newPhone);
    
    // Отправляем событие в Kafka
    try {
        await sendMessage('phone-events', {
            type: 'PHONE_CREATED',
            payload: newPhone
        });
    } catch (error) {
        logger.error('Failed to send Kafka message:', error);
    }
    
    res.status(201).json(newPhone);
});

/**
 * @swagger
 * /api/phones/{id}:
 *   put:
 *     summary: Обновить телефон
 *     tags: [Phones]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID телефона
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Телефон успешно обновлен
 *       404:
 *         description: Телефон не найден
 */
// PUT - обновить телефон
app.put('/api/phones/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = phones.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ message: 'Телефон не найден' });
    }
    
    phones[index] = {
        id: id,
        brand: req.body.brand || phones[index].brand,
        model: req.body.model || phones[index].model,
        price: req.body.price || phones[index].price,
        stock: req.body.stock || phones[index].stock
    };
    
    res.json(phones[index]);
});

/**
 * @swagger
 * /api/phones/{id}:
 *   delete:
 *     summary: Удалить телефон
 *     tags: [Phones]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID телефона
 *     responses:
 *       204:
 *         description: Телефон успешно удален
 *       404:
 *         description: Телефон не найден
 */
// DELETE - удалить телефон
app.delete('/api/phones/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = phones.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ message: 'Телефон не найден' });
    }
    
    phones.splice(index, 1);
    res.status(204).send();
});

// Пример использования пользовательского уровня логирования
app.get('/api/debug-test', (req, res) => {
  logger.debug('Это тестовое сообщение debug уровня');
  logger.info('Это тестовое сообщение info уровня');
  logger.warn('Это тестовое сообщение warn уровня');
  res.json({ message: 'Проверьте логи' });
});

/**
 * @swagger
 * tags:
 *   name: Kafka
 *   description: Операции с Kafka messaging
 */

/**
 * @swagger
 * /api/kafka/send:
 *   post:
 *     summary: Отправить сообщение в Kafka
 *     tags: [Kafka]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *                 description: Название топика
 *                 example: phone-events
 *               message:
 *                 type: object
 *                 description: Сообщение для отправки
 *                 example:
 *                   type: CUSTOM_EVENT
 *                   payload:
 *                     data: "Тестовое сообщение"
 *     responses:
 *       200:
 *         description: Сообщение успешно отправлено
 *       500:
 *         description: Ошибка при отправке сообщения
 */
app.post('/api/kafka/send', async (req, res) => {
    try {
        const { topic, message } = req.body;
        await sendMessage(topic, message);
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        logger.error('Error sending Kafka message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/kafka/topics:
 *   get:
 *     summary: Получить список активных топиков
 *     tags: [Kafka]
 *     responses:
 *       200:
 *         description: Список топиков
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topics:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["phone-events", "test-topic"]
 */
app.get('/api/kafka/topics', async (req, res) => {
    try {
        const admin = kafka.admin();
        await admin.connect();
        const topics = await admin.listTopics();
        await admin.disconnect();
        res.json({ topics });
    } catch (error) {
        logger.error('Error listing Kafka topics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/kafka/topics:
 *   post:
 *     summary: Создать новый топик
 *     tags: [Kafka]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *                 description: Название нового топика
 *                 example: new-topic
 *               numPartitions:
 *                 type: integer
 *                 description: Количество партиций
 *                 example: 1
 *               replicationFactor:
 *                 type: integer
 *                 description: Фактор репликации
 *                 example: 1
 *     responses:
 *       201:
 *         description: Топик успешно создан
 *       500:
 *         description: Ошибка при создании топика
 */
app.post('/api/kafka/topics', async (req, res) => {
    try {
        const { topic, numPartitions = 1, replicationFactor = 1 } = req.body;
        const admin = kafka.admin();
        await admin.connect();
        await admin.createTopics({
            topics: [{
                topic,
                numPartitions,
                replicationFactor
            }]
        });
        await admin.disconnect();
        res.status(201).json({ success: true, message: 'Topic created successfully' });
    } catch (error) {
        logger.error('Error creating Kafka topic:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Инициализация Kafka
const initKafka = async () => {
    try {
        await initProducer();
        
        // Подписываемся на топик phone-events
        await initConsumer('phone-events', async (message) => {
            console.log('Received message:', message);
            // Здесь можно добавить логику обработки сообщений
        });
    } catch (error) {
        console.error('Failed to initialize Kafka:', error);
    }
};

// Инициализируем Kafka при запуске сервера
initKafka();

// Обработчик ошибок должен быть последним middleware
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Сервер запущен на порту ${PORT}`);
}); 