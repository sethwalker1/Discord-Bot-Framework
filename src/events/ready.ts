import { Events } from 'discord.js';
import type { Client } from 'discord.js';
import { logger } from '../modules/Logger.js';

export default {
  name: Events.ClientReady,
  once: true,
  // All event handlers have to be asynchronous, so the .catch() method can be used
  async execute(client: Client<true>) {
    logger.info(`Logged into Discord as ${client.user.tag}!`);
  },
};
