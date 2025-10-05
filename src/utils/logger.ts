
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type
export type JSPrimitive = string | number | boolean | null | undefined | object | Function

type LogParams = JSPrimitive | JSPrimitive[] | Record<string, JSPrimitive>;


class Logger {
  state = {
    logs: new Set<LogParams>(),
    errors: new Set<LogParams>(),
    warns: new Set<LogParams>(),
    infos: new Set<LogParams>(),
    debugs: new Set<LogParams>(),
    traces: new Set<LogParams>(),
    tables: new Set<LogParams>(),
  }

  log(message: LogParams) {
    console.log(message);
  }

  logOnce(message: LogParams) {
    if (this.state.logs.has(message)) {
      return;
    }
    this.state.logs.add(message);
    this.log(message);
  }


  error(message: LogParams) {
    console.error(message);
  }

  errorOnce(message: LogParams) {
    if (this.state.errors.has(message)) {
      return;
    }
    this.state.errors.add(message);
    this.error(message);
  }

  warn(message: LogParams) {
    console.warn(message);
  }

  warnOnce(message: LogParams) {
    if (this.state.warns.has(message)) {
      return;
    }
    this.state.warns.add(message);
    this.warn(message);
  }

  info(message: LogParams) {
    console.info(message);
  }

  infoOnce(message: LogParams) {
    if (this.state.infos.has(message)) {
      return;
    }
    this.state.infos.add(message);
    this.info(message);
  }

  debug(message: string) {
    console.debug(message);
  }

  debugOnce(message: string) {
    if (this.state.debugs.has(message)) {
      return;
    }
    this.state.debugs.add(message);
    this.debug(message);
  }

  trace(message: LogParams) {
    console.trace(message);
  }

  traceOnce(message: LogParams) {
    if (this.state.traces.has(message)) {
      return;
    }
    this.state.traces.add(message);
    this.trace(message);
  }

  table(message: LogParams) {
    console.table(message);
  }

  tableOnce(message: LogParams) {
    if (this.state.tables.has(message)) {
      return;
    }
    this.state.tables.add(message);
    this.table(message);
  }
}

export default new Logger();
