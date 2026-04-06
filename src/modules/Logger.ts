function formatTimestamp(): string {
  return new Date()
    .toLocaleString(process.env.LOCALE, { timeZone: process.env.TIMEZONE })
    .split(', ')
    .join(' ');
}

export const logger = {
  info(...args: unknown[]) {
    console.info(`[${formatTimestamp()}]`, ...args);
  },
  warn(...args: unknown[]) {
    console.warn(`[${formatTimestamp()}]`, ...args);
  },
  error(...args: unknown[]) {
    console.error(`[${formatTimestamp()}]`, ...args);
  },
};
