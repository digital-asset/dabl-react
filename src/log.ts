import {
  LoggerFactoryOptions,
  LogGroupRule,
  LogLevel,
  LoggerFactory,
  LFService,
} from 'typescript-logging';

const logPrefix = 'damlhub-react';

const options = new LoggerFactoryOptions();
options.addLogGroupRule(new LogGroupRule(new RegExp(`${logPrefix}.+`), LogLevel.Info));

const factory: LoggerFactory = LFService.createNamedLoggerFactory('LoggerFactory', options);

export default (name: string) => {
  return factory.getLogger(`${logPrefix}:${name}`);
};
