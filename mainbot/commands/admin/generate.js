const { owners, notifierWebhook } = require("../../../config.json");
const { queryParams } = require("../../../db/db");
const generate = require("../../utils/generate");
const { WebhookClient, ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const access = require("../../../db/access");
const { autosecureMap } = require("../../handlers/botHandler");

function formatKey() {
  const raw = generate(15);
  return `maous-${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}`;
}

// Kiểm tra user có blacklist không, trả về object nếu có, null nếu không
async function isBlacklisted(userId) {
  const rows = await queryParams(`SELECT * FROM blacklist WHERE user_id = ?`, [userId]);
  return rows.length > 0 ? rows[0] : null;
}

module.exports = {
  name: "access",
  description: "Manage autosecure access [OWNER]",
  options: [
    {
      name: "option",
      description: "Choose what you want to do",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Create Autosecure Key", value: "create_key" },
        { name: "Give Access to a User", value: "give_access" },
        { name: "Remove Access from a User", value: "remove_access" },
        { name: "List Unused Keys", value: "list_keys" },
        { name: "Delete All Unredeem Keys", value: "clear_unused_keys" },
        { name: "Delete All Licenses (DANGEROUS)", value: "delete_all_licenses" },
        { name: "Blacklist User", value: "blacklist" },
        { name: "Unblacklist User", value: "unblacklist" },
        { name: "List Active Users", value: "list_users" },

      ],
    },
    {
      name: "amount",
      description: "Amount of keys to generate (for create_key)",
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
    {
      name: "user",
      description: "User to interact (for give_access, remove_access, blacklist, unblacklist)",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
    {
      name: "duration",
      description: "Duration of access in days (for give_access)",
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
    {
      name: "reason",
      description: "Reason for blacklisting (for blacklist option)",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  callback: async (client, interaction) => {
    if (!owners.includes(interaction.user.id)) {
      return interaction.reply({
        content: "❌ You are not allowed to use this command.",
        ephemeral: true,
      });
    }

    const option = interaction.options.getString("option");
    const amount = interaction.options.getInteger("amount") || 1;
    const user = interaction.options.getUser("user");
    const duration = interaction.options.getInteger("duration") || 20; // default 20 days
    const reason = interaction.options.getString("reason") || "No reason provided";

    // 1. Create keys
    if (option === "create_key") {
      const keys = [];
      for (let i = 0; i < amount; i++) {
        const newKey = formatKey();
        try {
          await queryParams(`INSERT INTO licenses(license, redeemed) VALUES(?, 0)`, [newKey]);
          keys.push(`\`${newKey}\``);
        } catch (e) {
          return interaction.reply({
            content: `❌ Failed to insert key #${i + 1}: \`${e.message}\``,
            ephemeral: true,
          });
        }
      }

      return interaction.reply({
        content: `🔑 Created ${keys.length} key(s):\n${keys.join("\n")}`,
        ephemeral: true,
      });
    }

    // 2. Give access
    if (option === "give_access") {
      if (!user) {
        return interaction.reply({
          content: "❌ Please specify a user to give access.",
          ephemeral: true,
        });
      }

      // Check blacklist first
      const bl = await isBlacklisted(user.id);
      if (bl) {
        return interaction.reply({
          content: `❌ <@${user.id}> is blacklisted and cannot be granted access.\nReason: ${bl.reason}`,
          ephemeral: true,
        });
      }

      // Check if user already has access and not expired
      const hasAccess = await queryParams(
        `SELECT * FROM autosecure WHERE user_id = ? AND expires_at > ?`,
        [user.id, Date.now()]
      );

      if (hasAccess.length > 0) {
        return interaction.reply({
          content: `⚠️ <@${user.id}> already has access to AutoSecure.`,
          ephemeral: true,
        });
      }

      const expiresAt = Date.now() + duration * 24 * 60 * 60 * 1000;
      const newLicense = formatKey();

      try {
        // Tạo license mới trong bảng licenses, đánh dấu redeemed luôn, gán user_id
        await queryParams(
          `INSERT INTO licenses(license, redeemed, user_id) VALUES(?, 1, ?)`,
          [newLicense, user.id]
        );

        // Cấp quyền access
        await queryParams(
          `INSERT INTO autosecure(user_id, expires_at) VALUES(?, ?)`,
          [user.id, expiresAt]
        );

        // Webhook notify admin
        try {
          const webhook = new WebhookClient({ url: notifierWebhook });
          await webhook.send({
            content: `<@${interaction.user.id}> gave <@${user.id}> access to AutoSecure for ${duration} day(s) with license \`${newLicense}\`.`,
          });
        } catch {
          console.log("⚠️ Invalid notifier webhook.");
        }

        // Tạo embed trả về
        const embed = new EmbedBuilder()
          .setTitle("License Granted")
          .setColor(0x32ff00)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: "Your License", value: `\`${newLicense}\``, inline: false },
            { name: "Access Expires In", value: `<t:${Math.floor(expiresAt / 1000)}:R>`, inline: false },
            { name: "Guide", value: `Use \`/guide\` to learn how to use the bot.`, inline: false },
            { name: "Configure Bot", value: `Use \`/bot\` to launch your bot.`, inline: false }
          )
          .setTimestamp();

        // Gửi DM user
        try {
          await user.send({ embeds: [embed] });
        } catch (err) {
          console.log("⚠️ Could not DM user:", err.message);
        }

        // Reply embed
        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      } catch (err) {
        return interaction.reply({
          content: `❌ Failed to give access: \`${err.message}\``,
          ephemeral: true,
        });
      }
    }

    // 3. Remove access
    if (option === "remove_access") {
      if (!user) {
        return interaction.reply({
          content: "❌ Please specify a user to remove access.",
          ephemeral: true,
        });
      }

      if (!(await access(user.id))) {
        return interaction.reply({
          content: `<@${user.id}> doesn't have access!`,
          ephemeral: true,
        });
      }

      try {
        const webhook = new WebhookClient({ url: notifierWebhook });
        await webhook.send({
          content: `<@${interaction.user.id}> removed access from <@${user.id}>.`,
        });

        await queryParams(`DELETE FROM autosecure WHERE user_id = ?`, [user.id]);

        try {
          const c = autosecureMap.get(user.id);
          if (c) await c.destroy();
          autosecureMap.delete(user.id);
        } catch (e) {
          console.log("Error destroying autosecure client:", e);
        }

        return interaction.reply({
          content: `✅ Removed access from <@${user.id}>.`,
          ephemeral: true,
        });
      } catch (e) {
        console.log("Error removing access:", e);
        return interaction.reply({
          content: `❌ Failed to remove access: ${e.message}`,
          ephemeral: true,
        });
      }
    }

    // 4. List unused keys
    if (option === "list_keys") {
      try {
        const rows = await queryParams(`SELECT license FROM licenses WHERE redeemed = 0`);
        if (rows.length === 0) {
          return interaction.reply({
            content: "⚠️ There are no unused keys.",
            ephemeral: true,
          });
        }

        const list = rows.map((r) => `🔑 \`${r.license}\``).join("\n").slice(0, 1900);

        return interaction.reply({
          content: `🧾 **Unused Keys (${rows.length})**:\n${list}`,
          ephemeral: true,
        });
      } catch (e) {
        return interaction.reply({
          content: `❌ Failed to list keys: \`${e.message}\``,
          ephemeral: true,
        });
      }
    }

    // 5. Clear unused keys
    if (option === "clear_unused_keys") {
      try {
        await queryParams(`DELETE FROM licenses WHERE redeemed = 0`);
        return interaction.reply({
          content: `🗑️ All unused keys have been cleared from the database.`,
          ephemeral: true,
        });
      } catch (e) {
        return interaction.reply({
          content: `❌ Failed to clear unused keys: \`${e.message}\``,
          ephemeral: true,
        });
      }
    }

    // 6. Delete all licenses (DANGEROUS)
    if (option === "delete_all_licenses") {
      try {
        // Danh sách các bảng chứa dữ liệu người dùng
        await queryParams(`DELETE FROM autosecure`);
        await queryParams(`DELETE FROM users`);
        await queryParams(`DELETE FROM licenses`);
        await queryParams(`DELETE FROM cookie_store`);
        await queryParams(`DELETE FROM actions`);

        return interaction.reply({
          content: `✅ All user-related data (user IDs, tokens, licenses, actions, cookies...) has been permanently deleted from the database.`,
          ephemeral: true,
        });
      } catch (e) {
        return interaction.reply({
          content: `❌ Failed to delete user data: \`${e.message}\``,
          ephemeral: true,
        });
      }
    }


    // 7. Blacklist user
    if (option === "blacklist") {
      if (!user) {
        return interaction.reply({
          content: "❌ Please specify a user to blacklist.",
          ephemeral: true,
        });
      }
      const alreadyBlacklisted = await isBlacklisted(user.id);
      if (alreadyBlacklisted) {
        return interaction.reply({
          content: `⚠️ <@${user.id}> is already blacklisted.\nReason: ${alreadyBlacklisted.reason}`,
          ephemeral: true,
        });
      }

      try {
        const now = Date.now();
        await queryParams(
          `INSERT INTO blacklist(user_id, reason, blacklisted_at) VALUES(?, ?, ?)`,
          [user.id, reason, now]
        );

        // Nếu user có access thì remove luôn
        await queryParams(`DELETE FROM autosecure WHERE user_id = ?`, [user.id]);

        // Destroy bot client nếu đang chạy
        try {
          const c = autosecureMap.get(user.id);
          if (c) await c.destroy();
          autosecureMap.delete(user.id);
        } catch (e) {
          console.log("Error destroying autosecure client:", e);
        }

        // Gửi webhook thông báo admin
        try {
          const webhook = new WebhookClient({ url: notifierWebhook });
          await webhook.send({
            content: `<@${interaction.user.id}> blacklisted <@${user.id}>.\nReason: ${reason}`,
          });
        } catch {
          console.log("⚠️ Invalid notifier webhook.");
        }

        // Gửi embed DM cho user bị blacklist
        try {
          const embed = new EmbedBuilder()
            .setTitle("🚫 You have been blacklisted")
            .setDescription(`You have been blacklisted from AutoSecure access.\n**Reason:** ${reason}`)
            .setColor("Red")
            .setTimestamp();

          await user.send({ embeds: [embed] });
        } catch {
          // Bỏ qua nếu ko gửi DM được
        }

        return interaction.reply({
          content: `✅ <@${user.id}> has been blacklisted.\nReason: ${reason}`,
          ephemeral: true,
        });
      } catch (err) {
        return interaction.reply({
          content: `❌ Failed to blacklist user: \`${err.message}\``,
          ephemeral: true,
        });
      }
    }

    // 8. Unblacklist user
    if (option === "unblacklist") {
      if (!user) {
        return interaction.reply({
          content: "❌ Please specify a user to unblacklist.",
          ephemeral: true,
        });
      }

      const isBlacklistedUser = await isBlacklisted(user.id);
      if (!isBlacklistedUser) {
        return interaction.reply({
          content: `<@${user.id}> is not blacklisted.`,
          ephemeral: true,
        });
      }

      try {
        await queryParams(`DELETE FROM blacklist WHERE user_id = ?`, [user.id]);

        // Gửi webhook thông báo admin
        try {
          const webhook = new WebhookClient({ url: notifierWebhook });
          await webhook.send({
            content: `<@${interaction.user.id}> unblacklisted <@${user.id}>.`,
          });
        } catch {
          console.log("⚠️ Invalid notifier webhook.");
        }

        // Gửi embed DM cho user bị unblacklist
        try {
          const embed = new EmbedBuilder()
            .setTitle("✅ You have been unblacklisted")
            .setDescription(`Your blacklist status has been removed. You can now access AutoSecure.`)
            .setColor("Green")
            .setTimestamp();

          await user.send({ embeds: [embed] });
        } catch {
          // Bỏ qua nếu ko gửi DM được
        }

        return interaction.reply({
          content: `✅ <@${user.id}> has been removed from the blacklist.`,
          ephemeral: true,
        });
      } catch (err) {
        return interaction.reply({
          content: `❌ Failed to unblacklist user: \`${err.message}\``,
          ephemeral: true,
        });
      }
    }

    // 9. List Active Users
    // 9. List Active Users (Full Token)
    if (option === "list_users") {
      try {
        const rows = await queryParams(`SELECT * FROM autosecure WHERE expires_at > ?`, [Date.now()]);
        if (rows.length === 0) {
          return interaction.reply({
            content: "📭 No active users with access currently.",
            ephemeral: true
          });
        }

        let output = `📋 **Active Users (${rows.length})**\n\n`;
        for (const row of rows) {
          const userId = row.user_id;
          const token = row.token || "*No token*";
          const expiresIn = `<t:${Math.floor(row.expires_at / 1000)}:R>`;
          output += `👤 <@${userId}> (\`${userId}\`)\n🔑 Token: \`${token}\`\n⏰ Expires: ${expiresIn}\n\n`;
        }

        // Nếu quá dài thì gửi file
        if (output.length > 1900) {
          const fs = require("fs");
          const path = require("path");
          const filePath = path.join(__dirname, "../../../temp/active-users.txt");

          fs.writeFileSync(filePath, output);

          await interaction.reply({
            content: "📄 Too many users! Here's the full list:",
            files: [filePath],
            ephemeral: true
          });

          fs.unlinkSync(filePath); // Xoá file sau khi gửi
        } else {
          return interaction.reply({
            content: output,
            ephemeral: true
          });
        }
      } catch (e) {
        console.error("Error listing users:", e);
        return interaction.reply({
          content: `❌ Failed to list active users: \`${e.message}\``,
          ephemeral: true
        });
      }
    }


    // Nếu option không hợp lệ
    return interaction.reply({
      content: "⚠️ This option is not implemented yet.",
      ephemeral: true,
    });
  },
};
