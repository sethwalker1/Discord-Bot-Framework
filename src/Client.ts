import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Client as Discord,
  Collection,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from 'discord.js';
import type { SlashCommandBuilder } from 'discord.js';
import * as Sentry from '@sentry/node';
import { logger } from './modules/Logger.js';
import type { BotCommand, BotEvent } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __extname = path.extname(__filename);

export default class Client {
  static client: Discord<true>;

  static async init() {
    // Build the Discord client
    const client = new Discord({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Message, Partials.User],
    });
    client.commands = new Collection<string, BotCommand>();

    // Register commands and events
    await Client.registerCommands(client);
    await Client.registerEvents(client);

    // Log into discord
    client.login(process.env.DISCORD_TOKEN);
    Client.client = client as Discord<true>;
  }

  static async registerCommands(client: Discord) {
    // Build the command and subcommands paths
    const commandsPath = path.join(__dirname, 'commands');
    const subcommandsPath = path.join(commandsPath, 'subcommands');

    // Function to load and validate commands
    async function loadCommands(directory: string) {
      const commandFiles = fs
        .readdirSync(directory)
        .filter(file => file.endsWith(__extname));

      // Load and validate each command asynchronously for better performance
      return await Promise.all(
        commandFiles.map(async file => {
          const filePath = path.join(directory, file);
          const { default: command } = await import(`file://${filePath}`);

          // All valid commands must have a data and execute property
          if (!('data' in command && 'execute' in command)) {
            logger.warn(`The command at ${filePath} is invalid!`);
            return undefined;
          }

          return command as BotCommand;
        })
      );
    }

    // Load base commands
    const baseCommands = await loadCommands(commandsPath);

    // Process each base command
    for (const command of baseCommands) {
      // Skip invalid commands
      if (!command) continue;

      // Build the subcommand path
      const subcommandPath = path.join(subcommandsPath, command.name);

      // Load subcommands if they exist
      if (fs.existsSync(subcommandPath)) {
        const subcommands = await loadCommands(subcommandPath);
        subcommands.forEach(subcommand => {
          if (!subcommand) return;
          command.data = (command.data as SlashCommandBuilder).addSubcommand(
            subcommand.data as unknown as (sub: import('discord.js').SlashCommandSubcommandBuilder) => import('discord.js').SlashCommandSubcommandBuilder
          );
        });
      }

      // Register the command
      client.commands.set(command.data.name, command);
    }

    // Register slash commands when in production or when --register flag is passed
    if (process.env.NODE_ENV === 'production' || process.argv.includes('--register')) {
      const rest = new REST().setToken(process.env.DISCORD_TOKEN);
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: client.commands.map(item => item.data.toJSON()),
      });
    }

    logger.info(`Registered ${client.commands.size} commands!`);
  }

  static async registerEvents(client: Discord) {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter(file => file.endsWith(__extname));

    // Register each event asynchronously for better performance
    await Promise.all(
      eventFiles.map(async file => {
        const filePath = path.join(eventsPath, file);
        const { default: event } = await import(`file://${filePath}`) as { default: BotEvent };

        // Prepare the event handler function
        // Note that the execute() function must be async,
        // or else the .catch() method will throw an error
        const handler = async (...args: unknown[]) =>
          await event.execute(...args).catch((err: Error) => {
            logger.error(err);
            Sentry.captureException(err);
          });

        // Register the event
        if (event.once) client.once(event.name, handler);
        else client.on(event.name, handler);
      })
    );

    logger.info(`Registered ${eventFiles.length} events!`);
  }
}
