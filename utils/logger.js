const winston = require('winston');
const { format } = winston;

// Настраиваем формат логов
const logFormat = format.combine(
    format.timestamp(),
    format.json()
);

// Создаем логгер
const logger = winston.createLogger({
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        }),
        new winston.transports.File({ 
            filename: 'error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'combined.log' 
        })
    ]
});

module.exports = logger;
