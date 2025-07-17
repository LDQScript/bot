const listProfiles = require("../../utils/listProfiles")

module.exports = {
    name: "profiles",
    description: `Configre your profiles!`,
    userOnly: true,
    callback: async (client, interaction) => {
        return interaction.reply(await listProfiles(interaction.user.id, 1))
    }
}