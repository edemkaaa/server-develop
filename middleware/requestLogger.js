const logger = require('../logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  logger.info('Входящий запрос', {
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    body: req.body,
  });

  // После завершения запроса
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Завершенный запрос', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

module.exports = requestLogger; 