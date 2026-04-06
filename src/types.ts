import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

export interface BotCommand {
  name: string;
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<string>;
}

export interface BotEvent {
  name: string;
  once?: boolean;
  execute(...args: unknown[]): Promise<void>;
}
