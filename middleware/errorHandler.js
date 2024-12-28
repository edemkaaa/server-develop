const logger = require('../logger');

const errorHandler = (err, req, res, next) => {

  logger.error('Ошибка приложения', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Внутренняя ошибка сервера',
      status: err.status || 500
    }
  });
};

module.exports = errorHandler; 