type Level = 'info' | 'warn' | 'error';

function timestamp() {
  return new Date().toISOString().substring(11, 23); // HH:mm:ss.mmm
}

function log(level: Level, context: string, message: string, data?: unknown) {
  const prefix = `[${timestamp()}] [${level.toUpperCase()}] [${context}]`;
  if (data !== undefined) {
    console[level](prefix, message, data);
  } else {
    console[level](prefix, message);
  }
}

export const logger = {
  info:  (ctx: string, msg: string, data?: unknown) => log('info',  ctx, msg, data),
  warn:  (ctx: string, msg: string, data?: unknown) => log('warn',  ctx, msg, data),
  error: (ctx: string, msg: string, data?: unknown) => log('error', ctx, msg, data),
};
