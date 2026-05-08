type Context = Record<string, unknown>;

declare const __DEV__: boolean;

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
}

export function logError(scope: string, error: Error, context?: Context): void {
  if (!isDev()) return;
  const payload = context
    ? { scope, message: error.message, ...context }
    : { scope, message: error.message };
  // eslint-disable-next-line no-console
  console.error('[error]', payload);
}

export function logWarn(scope: string, message: string, context?: Context): void {
  if (!isDev()) return;
  const payload = context ? { scope, message, ...context } : { scope, message };
  // eslint-disable-next-line no-console
  console.warn('[warn]', payload);
}

export function logInfo(scope: string, message: string, context?: Context): void {
  if (!isDev()) return;
  const payload = context ? { scope, message, ...context } : { scope, message };
  // eslint-disable-next-line no-console
  console.log('[info]', payload);
}
