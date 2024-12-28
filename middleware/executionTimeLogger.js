const logger = require('../logger');

const executionTimeLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Время выполнения запроса', {
      method: req.method,
      url: req.url,
      duration: `${duration}ms`
    });
  });

  next();
};

module.exports = executionTimeLogger;