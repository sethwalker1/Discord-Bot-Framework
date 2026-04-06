import { Events } from 'discord.js';
import type { Interaction } from 'discord.js';
import Logging from '../modules/Logging.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    // Execute a slash command
    if (!interaction.isChatInputCommand()) return;

    // Validate the command exists
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      return Logging.logCommand(
        interaction,
        `No command matching '${interaction.commandName}' was found.`
      );
    }

    // Run the command and log the result
    await command
      .execute(interaction)
      .then(async (result) => {
        await Logging.logCommand(interaction, result).catch(() => {});
      })
      .catch(async (err: Error) => {
        // Log the error in detail
        Logging.logCommand(interaction, err);

        // Build a generic error message for the user
        const content = {
          content: `Oops, I've ran into an unknown error! Please try again later.`,
          ephemeral: true,
        };

        // Send the generic error message to the user
        if (interaction.replied || interaction.deferred)
          await interaction.followUp(content);
        else await interaction.reply(content);
      });
  },
};
