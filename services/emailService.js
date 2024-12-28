const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Проверяем наличие необходимых переменных окружения
const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASSWORD', 'NOTIFICATION_EMAIL'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ Отсутствует переменная окружения ${varName}`);
        console.log('Текущие значения env:', {
            EMAIL_USER: process.env.EMAIL_USER,
            NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL,
        });
    }
});

// Создаем транспорт для отправки email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error('EMAIL_USER или EMAIL_PASSWORD не настроены в .env файле');
        }

        if (!to) {
            throw new Error('Не указан получатель email (to)');
        }

        console.log('📧 Попытка отправки email:', {
            from: process.env.EMAIL_USER,
            to,
            subject
        });

        const mailOptions = {
            from: {
                name: 'Phone Shop API',
                address: process.env.EMAIL_USER
            },
            to,
            subject,
            html,
            headers: {
                'priority': 'high'
            }
        };

        console.log('📧 Настройки email:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            headers: mailOptions.headers
        });

        // Попытка отправки с повторами
        let retries = 3;
        let lastError;

        while (retries > 0) {
            try {
                const info = await transporter.sendMail(mailOptions);
                console.log('📨 Email отправлен:', {
                    messageId: info.messageId,
                    response: info.response,
                    accepted: info.accepted,
                    rejected: info.rejected
                });
                return info;
            } catch (error) {
                lastError = error;
                console.log(`❌ Попытка ${4 - retries} не удалась:`, error.message);
                retries--;
                if (retries > 0) {
                    console.log(`⏳ Ожидание 2 секунды перед следующей попыткой...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        throw lastError;
    } catch (error) {
        console.error('❌ Ошибка отправки email:', {
            name: error.name,
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode,
            stack: error.stack
        });
        throw error;
    }
};

const formatPhoneEmail = (phone) => {
    return `
        <h2 style="color: #2c3e50;">Добавлен новый телефон!</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <p style="color: #34495e;">В магазин добавлен новый телефон со следующими характеристиками:</p>
            <ul style="list-style-type: none; padding: 0;">
                <li style="margin: 10px 0;"><strong style="color: #2c3e50;">Бренд:</strong> <span style="color: #34495e;">${phone.brand}</span></li>
                <li style="margin: 10px 0;"><strong style="color: #2c3e50;">Модель:</strong> <span style="color: #34495e;">${phone.model}</span></li>
                <li style="margin: 10px 0;"><strong style="color: #2c3e50;">Цена:</strong> <span style="color: #34495e;">$${phone.price}</span></li>
                <li style="margin: 10px 0;"><strong style="color: #2c3e50;">Количество на складе:</strong> <span style="color: #34495e;">${phone.stock}</span></li>
            </ul>
        </div>
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">Это автоматическое уведомление от Phone Shop API</p>
    `;
};

// Проверяем подключение при запуске
(async () => {
    try {
        await transporter.verify();
        console.log('✅ Подключение к почтовому серверу успешно');
        console.log('📧 Email настройки:', {
            user: process.env.EMAIL_USER,
            notification_email: process.env.NOTIFICATION_EMAIL,
            service: 'gmail'
        });
    } catch (error) {
        console.error('❌ Ошибка подключения к почтовому серверу:', {
            name: error.name,
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode
        });
    }
})();

module.exports = {
    sendEmail,
    formatPhoneEmail
};
