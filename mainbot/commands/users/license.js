const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { queryParams } = require("../../../db/db");

// Hàm kiểm tra blacklist
async function isBlacklisted(userId) {
  const rows = await queryParams(`SELECT user_id FROM blacklist WHERE user_id = ?`, [userId]);
  return rows.length > 0;
}

module.exports = {
  name: "license",
  description: "License system",
  options: [
    {
      name: "view",
      description: "View your license or access status",
      type: 1, // Subcommand
    },
    {
      name: "recover",
      description: "Recover your license from another user ID",
      type: 1,
      options: [
        {
          name: "old_user_id",
          description: "The user ID that redeemed the license",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "license_key",
          description: "The license key you want to recover",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ],

  callback: async (client, interaction) => {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    // Check blacklist
    if (await isBlacklisted(userId)) {
      return interaction.reply({
        content: "❌ You are blacklisted and cannot use license commands.",
        ephemeral: true,
      });
    }

    if (sub === "view") {
      const username = interaction.user.username;
      const avatarURL = interaction.user.displayAvatarURL({ dynamic: true });

      try {
        const accessRows = await queryParams(
          `SELECT expires_at FROM autosecure WHERE user_id = ? AND expires_at > ?`,
          [userId, Date.now()]
        );

        const licenseRows = await queryParams(
          `SELECT license FROM licenses WHERE user_id = ? AND redeemed = 1`,
          [userId]
        );

        const hasAccess = accessRows.length > 0;
        const licenseKey = licenseRows.length > 0 ? licenseRows[0].license : "None";
        const timeLeft = hasAccess
          ? `<t:${Math.floor(accessRows[0].expires_at / 1000)}:R>`
          : "N/A";

        const embed = new EmbedBuilder()
          .setTitle(`Profile for ${username}`)
          .setThumbnail(avatarURL)
          .setColor(hasAccess ? 0x00ff00 : 0xff0000)
          .addFields(
            { name: "License key", value: `\`${licenseKey}\``, inline: true },
            { name: "Has Access", value: `\`${hasAccess ? "True" : "False"}\``, inline: true },
            { name: "Time left", value: `${timeLeft}`, inline: true }
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (err) {
        console.error("View license error:", err);
        return interaction.reply({
          content: `❌ Error: ${err.message}`,
          ephemeral: true,
        });
      }
    }

    if (sub === "recover") {
      const newUserId = userId;
      const oldUserId = interaction.options.getString("old_user_id");
      const licenseKey = interaction.options.getString("license_key");

      try {
        const rows = await queryParams(
          `SELECT * FROM licenses WHERE license = ? AND redeemed = 1 AND user_id = ?`,
          [licenseKey, oldUserId]
        );

        if (rows.length === 0) {
          return interaction.reply({
            content: "❌ License not found or doesn't belong to the provided user ID.",
            ephemeral: true,
          });
        }

        // Xóa access cũ (nếu có)
        await queryParams(`DELETE FROM autosecure WHERE user_id = ?`, [oldUserId]);

        // Cập nhật license & cấp access mới
        const durationDays = 20;
        const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;

        await queryParams(`UPDATE licenses SET user_id = ? WHERE license = ?`, [newUserId, licenseKey]);
        await queryParams(`INSERT OR REPLACE INTO autosecure(user_id, expires_at) VALUES(?, ?)`, [
          newUserId,
          expiresAt,
        ]);

        const embed = new EmbedBuilder()
          .setTitle("🔁 License Recovery Successful")
          .setColor("Gold")
          .addFields(
            { name: "License Key", value: `\`${licenseKey}\``, inline: false },
            { name: "Recovered From", value: `<@${oldUserId}>`, inline: true },
            { name: "Transferred To", value: `<@${newUserId}>`, inline: true },
            { name: "Time Left", value: `<t:${Math.floor(expiresAt / 1000)}:R>`, inline: false }
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (err) {
        console.error("Recover error:", err);
        return interaction.reply({
          content: `❌ Error: ${err.message}`,
          ephemeral: true,
        });
      }
    }
  },
};