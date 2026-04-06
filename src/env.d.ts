declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
      LOCALE?: string;
      TIMEZONE?: string;
      SENTRY_DSN?: string;
      CLIENT_ID: string;
      DISCORD_TOKEN: string;
      LOGGING_WEBHOOK_URL: string;
    }
  }
}

export {};
