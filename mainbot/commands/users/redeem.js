const { EmbedBuilder } = require("discord.js");
const { queryParams } = require("../../../db/db");

module.exports = {
  name: "redeem",
  description: `Use a license key to gain access to this bot!`,
  options: [
    {
      name: "license",
      description: `The license that you bought from us!`,
      type: 3, // STRING
      required: true,
    },
  ],
  callback: async (client, interaction) => {
    const licenseKey = interaction.options.getString("license");
    const userId = interaction.user.id;

    try {
      // 1. Check blacklist
      const blacklist = await queryParams("SELECT user_id FROM blacklist WHERE user_id = ?", [userId]);
      if (blacklist.length > 0) {
        return interaction.reply({
          content: "🚫 You are blacklisted and cannot redeem a license.",
          ephemeral: true,
        });
      }

      // 2. Get license data
      const licenseData = await queryParams(`SELECT * FROM licenses WHERE license = ?`, [licenseKey]);

      if (licenseData.length === 0) {
        return interaction.reply({
          content: `❌ Invalid license key.`,
          ephemeral: true,
        });
      }

      const license = licenseData[0];

      if (license.redeemed === 1) {
        return interaction.reply({
          content: `❌ This license key has already been redeemed.`,
          ephemeral: true,
        });
      }

      // 3. Check if user already has active access
      const now = Date.now();
      const userAccess = await queryParams(
        `SELECT * FROM autosecure WHERE user_id = ? AND expires_at > ?`,
        [userId, now]
      );

      if (userAccess.length > 0) {
        return interaction.reply({
          content: `✅ You already have active access!`,
          ephemeral: true,
        });
      }

      // 4. Calculate expiration timestamp (20 days default)
      const durationDays = 20;
      const expiresAt = now + durationDays * 24 * 60 * 60 * 1000;

      // 5. Update license as redeemed, associate with user
      await queryParams(
        `UPDATE licenses SET redeemed = 1, user_id = ? WHERE license = ?`,
        [userId, licenseKey]
      );

      // 6. Insert access record
      await queryParams(
        `INSERT INTO autosecure(user_id, expires_at) VALUES(?, ?)`,
        [userId, expiresAt]
      );

      // 7. Create embed with timestamp (Discord format: <t:unix_timestamp:R> = relative)
      const embed = new EmbedBuilder()
        .setTitle("License Redeemed")
        .setColor(0x32ff00)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: "Your License", value: `\`${licenseKey}\``, inline: false },
          { name: "Access Expires In", value: `<t:${Math.floor(expiresAt / 1000)}:R>`, inline: false },
          { name: "Guide", value: `Use \`/guide\` to learn how to use the bot.`, inline: false },
          { name: "Configure Bot", value: `Use \`/bot\` to launch your bot.`, inline: false }
        );

      // 8. Try send DM with embed
      try {
        await interaction.user.send({ embeds: [embed] });
      } catch {
        // Không sao nếu không gửi DM được
      }

      // 9. Reply interaction success
      return interaction.reply({
        content: `✅ License key redeemed successfully! You now have access for **${durationDays} days**.`,
        ephemeral: true,
      });

    } catch (err) {
      console.error("[REDEEM ERROR]", err);
      return interaction.reply({
        content: `❗ An unexpected error occurred. Please contact support.`,
        ephemeral: true,
      });
    }
  },
};