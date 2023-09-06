class Logger {
  debug(...args) {
    logger.debug(...args);
  }
  error(...args) {
    logger.error(...args);
  }
  info(...args) {
    logger.info(...args);
  }
  trace(...args) {
    logger.trace(...args);
  }
  warn(...args) {
    logger.warn(...args);
  }
}
let logger = console;
function setLogger(instance) {
  logger = instance;
}
export {
  Logger,
  logger,
  setLogger
};
