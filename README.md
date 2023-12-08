# Discord Bot Framework

A scalable Discord bot framework: easily expandable with modular components.
This is a barebones template. If you want to see something more fleshed out,
check out
[this translation bot fork](https://github.com/sethwalker1/Discord-Translation-Bot).

## Getting Started

1. Install dependencies
   ```bash
   yarn install
   ```
2. Rename the `.env.example` file in the root directory to `.env` and add your
   values. Every variable is required except for `SENTRY_DSN`, which is only
   required if you want to use Sentry for error reporting.
   - You can also create a `.env.production` file to differentiate between
     development and production environments. With this setup, `.env` will
     override any production values while in development.
3. Start the bot
   - In production:
     ```bash
     yarn start
     ```
   - In development:
     ```bash
     yarn dev
     ```
4. Invite the bot to your server. You can generate an invite link from the
   [Discord Developer Portal](https://discord.com/developers/applications).

## Features

### Commands

Commands are defined in the `src/commands` directory. Each command is a class
that inherits from the `Command` class. The `Command` class provides a simple
interface for defining commands and subcommands.

### Subcommands

To create a subcommand, you need to follow a few steps.

1. Create a folder matching the base command's name in
   `src/commands/subcommands` and create a new `.mjs` file matching the
   subcommand's name.
2. Inside your new subcommand file, export an object with:
   - `data`: An arrow method that is passed as an argument to the
     `addSubcommand` method.
   - `execute`: An async class method that is called when the subcommand is
   executed.

> 💡 The `execute` method in the `Command` class supports loading subcommands by default. You need to implement the logic yourself if your command overrides the `execute` method.

### Events

Events are defined in the `src/events` directory. Each event is an object, not a
class. The `execute` method is called when the event is triggered.

The `messageCreate` event can dynamically load message handler modules. To
create a message handler:

1. Create a new `.mjs` file in the `src/events/messageHandlers` directory
2. Inside your new message handler file, export a method with your custom logic.
3. Your method needs to filter each message and return `null` when the message
   doesn't match your criteria, as every handler will be executed for every
   message.
