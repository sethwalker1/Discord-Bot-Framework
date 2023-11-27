/**
 * Imports
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import Client from './src/Client.mjs';

// Load .env file
const productionEnvPath = path.join(process.cwd(), '.env.production');
dotenv.config({
  path: fs.existsSync(productionEnvPath)
    ? productionEnvPath
    : path.join(process.cwd(), '.env'),
});

// Override .env file with .development.env file if in development mode
if (process.env.NODE_ENV !== 'production') dotenv.config({ override: true });

// Override console.log to include a timestamp
console.log = console.info = (
  oldLog =>
  (...args) => {
    const timestamp = new Date()
      .toLocaleString(process.env.LOCALE, { timeZone: process.env.TIMEZONE })
      .split(', ')
      .join(' ');
    oldLog.apply(console, [`[${timestamp}]`, ...args]);
  }
)(console.log);

/**
 * Initiation
 */
async function init() {
  // Initiate Sentry
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN)
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [new ProfilingIntegration()],
      includeLocalVariables: true,
      // Performance Monitoring
      tracesSampleRate: 1.0,
      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: 1.0,
    });

  // Initiate Discord client
  await Client.init();
}

init();
