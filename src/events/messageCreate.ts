import fs from 'fs';
import path from 'path';
import { Events } from 'discord.js';
import type { Message } from 'discord.js';
import { fileURLToPath } from 'url';
import Client from '../Client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __extname = path.extname(__filename);

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (
      !message.content.length || // Ignore empty messages
      message.webhookId || // Ignore webhooks
      message.author.id === Client.client.user.id // Ignore messages from myself
    )
      return;

    // Load message handlers
    const handlersPath = path.resolve(__dirname, './messageHandlers');
    if (!fs.existsSync(handlersPath)) return;

    const handlerFiles = fs
      .readdirSync(handlersPath)
      .filter(file => file.endsWith(__extname));

    // Run all message handlers asynchronously
    return await Promise.all(
      handlerFiles.map(async file => {
        const filePath = path.join(handlersPath, file);
        const { default: handler } = await import(`file://${filePath}`);
        return handler(message);
      })
    );
  },
};
