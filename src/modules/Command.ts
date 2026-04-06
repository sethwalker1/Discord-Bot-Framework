import path from 'path';
import { fileURLToPath } from 'url';
import type { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __extname = path.extname(__filename);

export default class Command {
  name: string;
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;

  constructor(name: string, data: SlashCommandBuilder) {
    this.name = name;
    this.data = data;
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<string> {
    // Defer the reply to let the user know the bot is working
    await interaction.deferReply({ ephemeral: true });

    // Build a path to the target subcommand module
    const file = interaction.options.getSubcommand() + __extname;
    const folderPath = path.join(__dirname, '..', 'commands', 'subcommands');
    const subcommandPath = path.join(folderPath, this.name, file);

    // Import the target subcommand module
    const { default: subcommand } = await import(`file://${subcommandPath}`);
    const content: string = await subcommand.execute(interaction);

    // Reply with the subcommand's result
    await interaction.editReply({ content });

    // Return the result for logging
    return content;
  }
}
