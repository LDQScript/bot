const { queryParams } = require("../../../db/db"); // thêm dòng này
const getLocalCmds = require('../../utils/getLocalCmds')
const access = require('../../../db/access')
const isOwner = require("../../../db/isOwner")
const { owners, discordServer } = require("../../../config.json")
const { join } = require("path")

// Thay đổi đường dẫn tới file bot.js cho đúng với cấu trúc dự án của bạn
const panelModule = require('../../commands/users/bot')

// Thêm phần xử lý modal notify_all
async function handleNotifyAllModal(client, interaction) {
  if (interaction.customId !== "notify_all_modal") return;

  const noticeContent = interaction.fields.getTextInputValue("notice_content");

  try {
    // Lấy tất cả các notification_channel đã set
    const rows = await queryParams(`SELECT notification_channel FROM autosecure WHERE notification_channel IS NOT NULL`);

    if (rows.length === 0) {
      await interaction.reply({ content: "❌ Không có kênh notification nào được thiết lập.", ephemeral: true });
      return;
    }

    const sentChannels = [];

    for (const row of rows) {
      const parts = row.notification_channel.split("|"); // channelId|guildId
      const channelId = parts[0];
      const guildId = parts[1];

      try {
        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(channelId);

        if (channel && channel.isTextBased()) {
          await channel.send({
            content: `@everyone\n📢 Thông báo từ Admin (Notice from Admin):\n\n${noticeContent}`
          });
          sentChannels.push(channelId);
        }
      } catch (err) {
        console.log(`Failed to send to channel ${channelId}:`, err.message);
      }
    }

    await interaction.reply({
      content: `✅ Đã gửi thông báo đến ${sentChannels.length} kênh.`,
      ephemeral: true,
    });

  } catch (err) {
    console.error("Notify all error:", err);
    await interaction.reply({ content: `❌ Đã xảy ra lỗi: ${err.message}`, ephemeral: true });
  }
}

module.exports = async (client, interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const localCommands = getLocalCmds(join(__dirname, "..", "..", "commands"))
      const cmdObj = localCommands.find((cmd) => cmd.name === interaction.commandName)
      if (!cmdObj) return

      if (cmdObj.ownerOnly) {
        if (!await isOwner(interaction.user.id))
          return interaction.reply({ content: `You can't perform this action!`, ephemeral: true })
      }

      if (cmdObj.userOnly) {
        if (!await access(interaction.user.id)) {
          return interaction.reply({
            content: `You don't have access to this bot!\nContact <@${owners[0]}> or join ${discordServer} to get access`,
            ephemeral: true
          })
        }
      }

      console.log(`${cmdObj.name}|${interaction.user.username}|Command|${new Date().toISOString()}`)
      await cmdObj.callback(client, interaction)

    } else if (interaction.isButton()) {
      await panelModule.buttonHandler(client, interaction)

    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === "modal_token_update") {
        if (typeof panelModule.handleModalSubmit === "function") {
          await panelModule.handleModalSubmit(interaction)
        } else {
          console.warn("handleModalSubmit function not found in panelModule")
          await interaction.reply({ content: "Modal handler not implemented.", ephemeral: true })
        }
      } else if (interaction.customId === "notify_all_modal") {
        // Xử lý modal notify_all ở đây
        await handleNotifyAllModal(client, interaction);
      }
    } else {
      return;
    }
  } catch (error) {
    console.error(error)
  }
}