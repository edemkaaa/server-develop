module.exports = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    trace: 'white'
  },
  defaultLevel: 'info',
  logPath: 'logs',
  rotateConfig: {
    maxSize: '20m',
    maxFiles: '14d',
    datePattern: 'YYYY-MM-DD'
  }
}; 