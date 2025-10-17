
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getOnceKey(args: any[]): string {
  return args.map(arg => {
    if (typeof arg === 'function') {
      return arg.toString();
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return '[Circular object]';
      }
    }
    return String(arg);
  }).join(' ');
}


function getCaller() {
  const stack = new Error().stack;
  const caller = stack?.split('\n')[3];
  return `[${caller}]\n`;
}

class Logger {
  state = {
    logs: new Set<string>(),
    errors: new Set<string>(),
    warns: new Set<string>(),
    infos: new Set<string>(),
    debugs: new Set<string>(),
    traces: new Set<string>(),
    tables: new Set<string>(),
  }

  log(...args: unknown[]) {
    console.log(getCaller(), ...args);
  }

  logOnce(...args: unknown[]) {
    const key = getOnceKey(args);
    if (this.state.logs.has(key)) {
      return;
    }
    this.state.logs.add(key);
    this.log(...args);
  }


  error(...args: unknown[]) {
    console.error(getCaller(), ...args);
  }

  errorOnce(...args: unknown[]) {
    const key = getOnceKey(args);
    if (this.state.errors.has(key)) {
      return;
    }
    this.state.errors.add(key);
    this.error(...args);
  }

  warn(...args: unknown[]) {
    console.warn(getCaller(), ...args);
  }

  warnOnce(...args: unknown[]) {
    const key = getOnceKey(args);
    if (this.state.warns.has(key)) {
      return;
    }
    this.state.warns.add(key);
    this.warn(...args);
  }

  info(...args: unknown[]) {
    console.info(getCaller(), ...args);
  }

  infoOnce(...args: unknown[]) {
    const key = getOnceKey(args);
    if (this.state.infos.has(key)) {
      return;
    }
    this.state.infos.add(key);
    this.info(...args);
  }

  debug(...args: unknown[]) {
    console.debug(getCaller(), ...args);
  }

  debugOnce(...args: unknown[]) {
    const key = getOnceKey(args);
    if (this.state.debugs.has(key)) {
      return;
    }
    this.state.debugs.add(key);
    this.debug(...args);
  }

  trace(...args: unknown[]) {
    console.trace(getCaller(), ...args);
  }

  traceOnce(...args: unknown[]) {
    const key = getOnceKey(args);
    if (this.state.traces.has(key)) {
      return;
    }
    this.state.traces.add(key);
    this.trace(...args);
  }

  table(...args: unknown[]) {
    console.table(...args);
  }

  tableOnce(...args: unknown[]) {
    const key = getOnceKey(args);
    if (this.state.tables.has(key)) {
      return;
    }
    this.state.tables.add(key);
    this.table(...args);
  }
}

export default new Logger();
