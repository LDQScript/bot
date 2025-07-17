const discord = require("discord.js");
const eventHandler = require("./handlers/eventHandler");
const config = require("../config.json");
const { queryParams } = require("../db/db");
const fs = require("fs/promises");
const path = require("path");
const { autosecureMap } = require("./handlers/botHandler");

// Global map lưu tất cả các bot client đang chạy
global.clientMap = new Map();

async function initializeController() {
  for (let token of config.tokens) {
    const client = new discord.Client({
      intents: ["Guilds", "GuildMessages"],
      presence: {
        activities: [
          {
            name: "Manager",
            type: 4,
            state: "discord.gg/GUpUjKDuuH",
          },
        ],
        status: "online",
      },
    });

    client.cooldowns = new discord.Collection();
    eventHandler(client, token);

    await client.login(token);

    // ✅ Lưu vào clientMap để dùng bên ngoài
    global.clientMap.set(client.user.id, client);
  }
}

async function cleanExpiredAccess() {
  try {
    const now = Date.now();
    const expiredUsers = await queryParams(
      `SELECT user_id FROM autosecure WHERE expires_at IS NOT NULL AND expires_at <= ?`,
      [now]
    );

    if (expiredUsers.length === 0) return;

    for (const row of expiredUsers) {
      const userId = row.user_id;

      // ✅ Tìm user qua tất cả bot client
      let user = null;
      for (const [_, client] of global.clientMap) {
        try {
          user = await client.users.fetch(userId);
          if (user) break;
        } catch (_) {
          continue;
        }
      }

      if (!user) {
        console.warn(`⚠️ Cannot fetch or DM user ${userId}`);
        continue;
      }

      try {
        // 1. Fetch config để backup
        const configData = await queryParams(
          `SELECT * FROM autosecure WHERE user_id = ?`,
          [userId]
        );

        if (configData.length > 0) {
          const data = configData[0];

          // 2. Backup vào file
          const backupDir = path.join(__dirname, "..", "backups");
          await fs.mkdir(backupDir, { recursive: true });

          const fileName = `config_${userId}.json`;
          const configPath = path.join(backupDir, fileName);

          await fs.writeFile(configPath, JSON.stringify(data, null, 2), "utf8");

          // 3. Gửi file qua DM
          await user.send({
            content: "",
            files: [{
              attachment: configPath,
              name: fileName
            }]
          });

          // 4. Xoá file tạm
          await fs.unlink(configPath);
        }

        // 5. Gửi thông báo hết hạn
        const embed = new discord.EmbedBuilder()
          .setTitle("License Expired")
          .setDescription(`Your access to **Maous AutoSecure** has expired.\nIf you wish to continue using the bot, please contact support.`)
          .setColor("Red")
          .setTimestamp();

        await user.send({ embeds: [embed] });

      } catch (e) {
        console.log(`⚠️ Failed to DM user ${userId}: ${e.message}`);
      }

      // 6. Xoá dữ liệu trong DB
      const tables = [
        "autosecure",
        "users",
        "buttons",
        "embeds",
        "modals",
        "accountsbyuser",
        "licenses"
      ];

      for (const table of tables) {
        await queryParams(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
      }

      // 7. Tắt sub-bot nếu có
      const bot = autosecureMap.get(userId);
      if (bot) {
        try {
          await bot.destroy();
        } catch (e) {
          console.log(`⚠️ Failed to destroy sub-bot for user ${userId}: ${e.message}`);
        }
        autosecureMap.delete(userId);
      }

      console.log(`✅ Expired access cleared for user: ${userId}`);
    }
  } catch (e) {
    console.error("❌ Error during access cleanup:", e);
  }
}

// Dọn dẹp quyền hết hạn mỗi 60 giây
setInterval(cleanExpiredAccess, 60000);

// Export để dùng bên ngoài
module.exports = {
  initializeController,
  cleanExpiredAccess,
};