import { createLogger, format, transports, config } from "winston";
import Config from "./Config";

export class Logger {
  private logger;
  private service:string = "server";
  constructor(logLevel) {
    this.logger = createLogger({
      level: logLevel,
      levels: config.syslog.levels,
      format: format.combine(
        format.colorize(),
        format.prettyPrint(),
        format.splat(),
        format.printf((info) => {
          if(info instanceof Error) {
            return `[${info.level}] : ${info.timestamp} : ${info.message} ${info.stack}`;
          }
          return `[${info.level}] : ${info.timestamp} :  ${info.message}`;
      })),
      //defaultMeta: { service: this.service },
      transports: [
        new transports.Console({
          format: format.simple(),
        })
      ]
    });
  }

  public changeService(service){
    this.service = service;
  }

  public info(message, data:any = []){
    this.logger.info(message, data);
  }

  public warning(message, data:any = []){
    this.logger.warning(message, data);
  }

  public error(message, data:any = []){
    this.logger.error(message, data);
  }

}

// export instance of MyModule directly
export default new Logger(Config.logLevel);

/*
logger.setLevels({
    debug:0,
    info: 1,
    silly:2,
    warn: 3,
    error:4,
});


if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
      level: logLevel || 'silly',
      
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.prettyPrint(),
        winston.format.splat(),
        winston.format.printf((info) => {
          if(info instanceof Error) {
            return `[${info.level}] : ${info.timestamp} : ${info.message} ${info.stack}`;
          }
          return `[${info.level}] : ${info.timestamp} :  ${info.message}`;
        })
      ),
      handleExceptions: true,
      humanReadableUnhandledException: true,
      exitOnError: false,
      timestamp:true 
  }));
} else {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
        //winston.format.colorize(),
        winston.format.cli(),
    )
  }));
}

logger.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};

module.exports = logger;
*/
