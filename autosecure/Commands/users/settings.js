const listSettings = require("../../utils/listSettings");
module.exports = {
  name: "settings",
  description: 'Your settings',
  adminOnly: true,
  callback: async (client, interaction) => {
    return interaction.reply(await listSettings(client.username))
  }
}