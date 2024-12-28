const logger = require('../logger');

const loggerController = {
  // Получить текущий уровень логирования
  getLogLevel: (req, res) => {
    res.json({
      level: logger.level
    });
  },

  // Изменить уровень логирования
  setLogLevel: (req, res) => {
    const { level } = req.body;
    const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];

    if (!validLevels.includes(level)) {
      return res.status(400).json({
        error: 'Недопустимый уровень логирования',
        validLevels
      });
    }

    logger.level = level;
    logger.info(`Уровень логирования изменен на ${level}`);
    
    res.json({
      message: `Уровень логирования успешно изменен на ${level}`,
      currentLevel: level
    });
  }
};

module.exports = loggerController; 