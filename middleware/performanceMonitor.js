const logger = require('../logger');

const performanceMonitor = (req, res, next) => {
  const start = process.hrtime();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const time = diff[0] * 1e3 + diff[1] * 1e-6; // Переводим в миллисекунды
    const endMemory = process.memoryUsage();

    logger.info('Метрики производительности', {
      method: req.method,
      url: req.url,
      responseTime: `${time.toFixed(2)}ms`,
      statusCode: res.statusCode,
      memoryDelta: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external
      }
    });
  });

  next();
};

module.exports = performanceMonitor; 