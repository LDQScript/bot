const { ActivityType } = require("discord.js");
const { queryParams } = require("../../../db/db");
module.exports = {
    name: "botstatus",
    adminOnly: true,
    callback: async (client, interaction) => {
        let status = interaction.components[0].components[0].value;
        let state = interaction.components[1].components[0].value
        if (state != "online" && state != "dnd" && state != "idle" && state != "invisible") {
            return interaction.reply({ content: `Invalid status!`, ephemeral: true })
        }
        queryParams(`UPDATE autosecure SET status=? WHERE user_id=?`, [`${status}|${state}`, client.username])
        client.user.setPresence({
            activities: [{
                name: status,
                type: ActivityType.Custom,
            }],
            status: state
        });
        interaction.update(`Changed your bot status!\nKeep in mind, it might take a few minutes to be updated fully!`)
    }
}