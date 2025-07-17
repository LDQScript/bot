const { 
  ApplicationCommandOptionType, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder,
  PermissionFlagsBits 
} = require("discord.js");
const { queryParams } = require("../../../db/db");

module.exports = {
  name: "notify_all",
  description: "Send a notification message to all notification channels [OWNER]",
  default_member_permissions: PermissionFlagsBits.Administrator.toString(),
  callback: async (client, interaction) => {
    // Tạo modal
    const modal = new ModalBuilder()
      .setCustomId("notify_all_modal")
      .setTitle("Send Notification to All");

    // Tạo input text
    const noticeInput = new TextInputBuilder()
      .setCustomId("notice_content")
      .setLabel("Thông báo (Notice content)")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Nhập nội dung thông báo ở đây...")
      .setRequired(true);

    // Đưa input vào modal
    const firstActionRow = new ActionRowBuilder().addComponents(noticeInput);
    modal.addComponents(firstActionRow);

    // Hiện modal cho người dùng
    await interaction.showModal(modal);
  }
};
