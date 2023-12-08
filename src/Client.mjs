import fs from 'fs';
import path from 'path';
import {
  Client as Discord,
  Collection,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from 'discord.js';
import * as Sentry from '@sentry/node';

const __extname = path.extname(import.meta.url);

export default class Client {
  static async init() {
    // Build the Discord client
    Client.client = new Discord({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Message, Partials.User],
    });
    Client.client.commands = new Collection();

    // Register commands and events
    await Client.registerCommands();
    await Client.registerEvents();

    // Log into discord
    Client.client.login(process.env.DISCORD_TOKEN);
  }

  static async registerCommands() {
    // Build the command and subcommands paths
    const commandsPath = path.join(process.cwd(), 'src/commands');
    const subcommandsPath = path.join(commandsPath, 'subcommands');

    // Function to load and validate commands
    async function loadCommands(directory) {
      const commandFiles = fs
        .readdirSync(directory)
        .filter(file => file.endsWith(__extname));

      // Load and validate each command asynchronously for better performance
      return await Promise.all(
        commandFiles.map(async file => {
          const filePath = path.join(directory, file);
          const { default: command } = await import(`file://${filePath}`);

          // All valid commands must have a data and execute property
          if (!('data' in command && 'execute' in command))
            return console.warn(`The command at ${filePath} is invalid!`);

          return command;
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
          command.data = command.data.addSubcommand(subcommand.data);
        });
      }

      // Register the command
      Client.client.commands.set(command.data.name, command);
    }

    // Register slash commands when in production
    // Change `false` to `true` to manually register commands in development
    if (process.env.NODE_ENV === 'production' || false) {
      const rest = new REST().setToken(process.env.DISCORD_TOKEN);
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: Client.client.commands.map(item => item.data.toJSON()),
      });
    }

    console.info(`Registered ${Client.client.commands.size} commands!`);
  }

  static async registerEvents() {
    const eventsPath = path.join(process.cwd(), 'src/events');
    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter(file => file.endsWith(__extname));

    // Register each event asynchronously for better performance
    await Promise.all(
      eventFiles.map(async file => {
        const filePath = path.join(eventsPath, file);
        const { default: event } = await import(`file://${filePath}`);

        // Prepare the event handler function
        // Note that the execute() function must be async,
        // or else the .catch() method will throw an error
        const handler = async (...args) =>
          await event.execute(...args).catch(err => {
            console.error(err);
            Sentry.captureException(err);
          });

        // Register the event
        if (event.once) Client.client.once(event.name, handler);
        else Client.client.on(event.name, handler);
      })
    );

    console.info(`Registered ${eventFiles.length} events!`);
  }
}
