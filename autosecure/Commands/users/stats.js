const fetchStats = require("../../utils/fetchStats")
const statsMsg = require("../../utils/statsMsg")

module.exports = {
    name: "stats",
    description: `Stats of a user!`,
    options: [{
        name: "username",
        description: `Username of the user!`,
        type: 3,
        required: true
    }],
    userOnly: true,
    callback: async (client, interaction) => {
        let username = interaction.options.getString("username")
        interaction.deferReply({ ephemeral: true })
        let id = await fetchStats(username)
        if (id) {
            return interaction.editReply(await statsMsg(id))
        } else {
            return interaction.editReply({
                content: `Invalid profile!`,
                ephemeral: true
            })
        }
    }
}