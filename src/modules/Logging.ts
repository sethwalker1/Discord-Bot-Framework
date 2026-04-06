import { EmbedBuilder, GuildMember, WebhookClient } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

export default class Logging {
  static getFullCommand(context: ChatInputCommandInteraction): string {
    const { commandName, options } = context;
    const subcommand = options.getSubcommand(false);
    const subcommandGroup = options.getSubcommandGroup();

    // Base command
    let fullCommand = `/${commandName}`;

    // Subcommands
    if (subcommandGroup) fullCommand += ` ${subcommandGroup}`;
    if (subcommand) fullCommand += ` ${subcommand}`;

    // Options
    for (const option of options.data)
      fullCommand += ` ${option.name}:\`${option.value}\``;

    return fullCommand;
  }

  static async delete(message: string) {
    // Build the webhook client
    const webhookClient = new WebhookClient({
      url: process.env.LOGGING_WEBHOOK_URL,
    });

    // Delete the message
    webhookClient.deleteMessage(message);
  }

  static async logCommand(context: ChatInputCommandInteraction, content: string | Error) {
    const isError = content instanceof Error;

    // Build the content field
    const contentField = isError
      ? console.error(content) ?? {
          name: 'Error',
          value: content.message,
        }
      : {
          name: 'Result',
          value: content,
        };

    // Build the webhook client
    const webhookClient = new WebhookClient({
      url: process.env.LOGGING_WEBHOOK_URL,
    });

    // Build the response embed
    const embed = new EmbedBuilder()
      .setColor(isError ? 0xec6064 : 0xb7ce77)
      .setTitle(
        `${context.member instanceof GuildMember ? context.member.displayName : context.user.username} → ${Logging.getFullCommand(context)}`
      )
      .setFields([
        {
          name: 'User',
          value: `<@${context.user.id}>`,
          inline: true,
        },
        {
          ...contentField,
          inline: true,
        },
      ])
      .setFooter({
        text: `${context.user.username}  •  ID ${context.user.id}`,
        iconURL: context.user.avatarURL() ?? undefined,
      });

    // Log the message/error to the logging webhook
    return await webhookClient.send({
      embeds: [embed],
    });
  }
}
