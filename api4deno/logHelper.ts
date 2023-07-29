import { log } from "./deps.ts";

export async function logInit() {
  await log.setup({
    handlers: {
      stringFmt: new log.handlers.ConsoleHandler("DEBUG", {
        formatter: "[{levelName}]: {datetime} {msg}",
      }),

      functionFmt: new log.handlers.ConsoleHandler("DEBUG", {
        formatter: (logRecord) => {
          let msg = `${logRecord.level} ${logRecord.msg}`;

          logRecord.args.forEach((arg, index) => {
            msg += `, arg${index}: ${arg}`;
          });

          return msg;
        },
      }),

      anotherFmt: new log.handlers.ConsoleHandler("DEBUG", {
        formatter: "[{loggerName}] - {datetime} - {levelName} {msg}",
      }),
    },

    loggers: {
      default: {
        level: "DEBUG",
        handlers: ["stringFmt"],
      },
      dataLogger: {
        level: "INFO",
        handlers: ["anotherFmt"],
      },
    },
  });
}
