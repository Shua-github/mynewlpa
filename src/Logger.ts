const errMsg = "The method must be implemented by subclasses"

export default class Logger {
  constructor() {
    if (new.target === Logger) {
      throw new Error("Logger is an abstract class and cannot be instantiated directly");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  log(_message: string) {
    throw new Error(errMsg);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(_message: string) {
    throw new Error(errMsg);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(_message: string) {
    throw new Error(errMsg);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(_message: string) {
    throw new Error(errMsg);
  }
}