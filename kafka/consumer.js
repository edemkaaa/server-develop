const kafka = require('./config');
const { sendEmail, formatPhoneEmail } = require('../services/emailService');

const consumer = kafka.consumer({ groupId: 'phone-shop-group' });

// Имитация разных сервисов
const notificationService = {
    sendEmail: async (data) => {
        try {
            console.log('📧 Попытка отправки email уведомления:', data);
            const html = formatPhoneEmail(data);
            await sendEmail(
                process.env.NOTIFICATION_EMAIL,
                'Новый телефон в магазине',
                html
            );
            console.log('✅ Email успешно отправлен');
        } catch (error) {
            console.error('❌ Ошибка отправки уведомления:', error);
        }
    }
};

const analyticsService = {
    updateStats: (data) => {
        console.log('📊 Обновление статистики:', data);
    }
};

const logisticsService = {
    planStorage: (data) => {
        console.log('🚚 Планирование размещения на складе:', data);
    }
};

const inventoryService = {
    updateInventory: (data) => {
        console.log('📦 Обновление инвентаря:', data);
    }
};

const messageHandlers = {
    PHONE_CREATED: async (data) => {
        console.log('📱 Обработка события PHONE_CREATED:', data);
        // Параллельная обработка разными сервисами
        await Promise.all([
            notificationService.sendEmail(data),
            analyticsService.updateStats(data),
            logisticsService.planStorage(data),
            inventoryService.updateInventory(data)
        ]);
        console.log('✅ Событие PHONE_CREATED обработано');
    },
    PHONE_UPDATED: async (data) => {
        console.log('🔄 Обработка события PHONE_UPDATED:', data);
        // Параллельная обработка разными сервисами
        await Promise.all([
            analyticsService.updateStats(data),
            inventoryService.updateInventory(data)
        ]);
        console.log('✅ Событие PHONE_UPDATED обработано');
    },
    PHONE_DELETED: async (data) => {
        console.log('📝 Обработка события PHONE_DELETED:', data);
        // Параллельная обработка разными сервисами
        await Promise.all([
            notificationService.sendEmail(data),
            analyticsService.updateStats(data),
            inventoryService.updateInventory(data)
        ]);
        console.log('✅ Событие PHONE_DELETED обработано');L
    }
};

const initConsumer = async (topic) => {
    try {
        console.log('🔄 Инициализация consumer...');
        await consumer.connect();
        console.log('✅ Consumer подключен к Kafka');
        
        await consumer.subscribe({ topic, fromBeginning: true });
        console.log(`📥 Consumer подписан на топик: ${topic}`);

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    console.log(`\n📨 Получено новое сообщение из топика ${topic}:`);
                    const event = JSON.parse(message.value.toString());
                    console.log('📄 Содержимое сообщения:', event);
                    
                    if (messageHandlers[event.type]) {
                        await messageHandlers[event.type](event.payload);
                    } else {
                        console.warn(`⚠️ Нет обработчика для события типа: ${event.type}`);
                    }
                    console.log('✅ Сообщение обработано успешно\n');
                } catch (error) {
                    console.error('❌ Ошибка обработки сообщения:', error);
                }
            },
        });
    } catch (error) {
        console.error('❌ Ошибка инициализации consumer:', error);
        throw error;
    }
};

module.exports = {
    initConsumer
};
