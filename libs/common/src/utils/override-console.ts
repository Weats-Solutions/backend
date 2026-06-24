import { Logger } from 'nestjs-pino';

/**
 * Monkey-patches global console methods to redirect all standard log calls
 * (from third-party libraries, legacy logs, etc.) to the structured Pino logger.
 */
export function overrideConsole(pinoLogger: Logger) {
  const formatArgs = (args: any[]) => {
    return args
      .map((arg) => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  };

  console.log = (...args: any[]) => pinoLogger.log(formatArgs(args));
  console.error = (...args: any[]) => pinoLogger.error(formatArgs(args));
  console.warn = (...args: any[]) => pinoLogger.warn(formatArgs(args));
  console.info = (...args: any[]) => pinoLogger.log(formatArgs(args));
  console.debug = (...args: any[]) => pinoLogger.debug(formatArgs(args));
}
