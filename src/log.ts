type LogLevel = 'log' | 'info' | 'debug' | 'warn' | 'error';

function prefixLog(name: string, logLevel: LogLevel) {
  return `${logLevel.toUpperCase()} [damlhub-react:${name}]`;
}

type LogData = (string | number | object)[];

export default (name: string) => {
  return {
    debug: (...data: LogData) => {
      console.debug(prefixLog(name, 'debug'), ...data);
    },
    log: (...data: LogData) => {
      console.log(prefixLog(name, 'log'), ...data);
    },
    info: (...data: LogData) => {
      console.info(prefixLog(name, 'info'), ...data);
    },
    warn: (...data: LogData) => {
      console.warn(prefixLog(name, 'warn'), ...data);
    },
    error: (...data: LogData) => {
      console.error(prefixLog(name, 'error'), ...data);
    },
  };
};
