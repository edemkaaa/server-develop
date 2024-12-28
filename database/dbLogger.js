const logger = require('../logger');

const dbLogger = {
  logQuery: (query, params) => {
    logger.debug('SQL запрос', {
      query,
      params,
      timestamp: new Date().toISOString()
    });
  },
  
  logError: (error, query, params) => {
    logger.error('Ошибка SQL запроса', {
      error: error.message,
      query,
      params,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = dbLogger; 