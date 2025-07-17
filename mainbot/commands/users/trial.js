const { WebhookClient } = require("discord.js");
const { queryParams } = require("../../../db/db");
const { notifierWebhook } = require("../../../config.json");

module.exports = {
  name: "trial",
  description: "Claim a 1-day trial access to AutoSecure",

  callback: async (client, interaction) => {
    const userId = interaction.user.id;

    try {
      // Kiểm tra đã dùng trial chưa
      const existing = await queryParams(
        `SELECT * FROM autosecure WHERE user_id = ? AND is_trial = 1`,
        [userId]
      );

      if (existing.length > 0) {
        return interaction.reply({
          content: "❌ You have already claimed your trial!",
          ephemeral: true,
        });
      }

      // Thêm quyền trial vào DB với thời hạn 1 ngày
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

      await queryParams(
        `INSERT INTO autosecure (user_id, is_trial, expires_at) VALUES (?, 1, ?)`,
        [userId, expiresAt]
      );

      // Gửi thông báo webhook nếu có
      try {
        const webhook = new WebhookClient({ url: notifierWebhook });
        await webhook.send({
          content: `🎟️ <@${userId}> claimed a 1-day trial access to AutoSecure.`,
        });
      } catch (err) {
        console.warn("⚠️ Webhook failed:", err.message);
      }

      return interaction.reply({
        content: "✅ You have claimed a 1-day trial access!",
        ephemeral: true,
      });

    } catch (e) {
      console.error("Trial error:", e);
      return interaction.reply({
        content: `❌ Something went wrong: \`${e.message}\``,
        ephemeral: true,
      });
    }
  },
};
