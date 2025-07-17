const { ApplicationCommandOptionType } = require('discord.js')
const getssid = require('../../utils/secure/getssid')
const getProfile = require('../../utils/secure/getProfile')
const getxbl = require('../../utils/secure/getxbl')
module.exports = {
    name: "getssid",
    description: 'Get SSID from Login Cookie OR XBL',
    enabled: true,
    options: [
        {
            name: "logincookie",
            description: "Login Cookie",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    userOnly: true,

    callback: async (client, interaction) => {
        let loginCookie = interaction.options.getString("logincookie")
        interaction.deferReply({ ephemeral: true })
        try {
            let xbl = await getxbl(loginCookie)
            if (xbl) {
                let ssid = await getssid(xbl)
                if (ssid) {
                    let profile = await getProfile(ssid)
                    if (profile) {
                        return await interaction.editReply({
                            embeds: [{
                                title: `Got SSID!`,
                                fields: [
                                    {
                                        name: "Name",
                                        value: "```" + profile.name ? profile.name : `Doesn't have minecraft!` + "```",
                                        inline: false
                                    },
                                    {
                                        name: "UUID",
                                        value: "```" + profile.id ? profile.id : `Doesn't have minecraft!` + "```",
                                        inline: false
                                    },
                                    {
                                        name: "SSID",
                                        value: "```" + ssid + "```",
                                        inline: false
                                    }],
                                thumbnail: {
                                    url: `https://mineskin.eu/helm/${profile.name}`,
                                },
                                color: 0x00ff00
                            }],
                            ephemeral: true
                        })
                    } else {
                        return interaction.editReply({
                            embeds: [{
                                title: `Error :x:`,
                                description: `Account doesn't have minecraft`,
                                color: 0xff0000
                            }],
                            ephemeral: true
                        })
                    }
                } else {
                    return interaction.editReply({
                        embeds: [{
                            title: `Error :x:`,
                            description: `Couldn't fetch the ssid from the fetched XBL! (Maybe the user doesn't have minecraft)`,
                            color: 0xff0000
                        }],
                        ephemeral: true
                    })
                }
            } else {
                return interaction.editReply({
                    embeds: [{
                        title: `Error :x:`,
                        description: `Failed to fetch XBL from the Login Cookie!`,
                        color: 0xff0000
                    }],
                    ephemeral: true
                })
            }
        } catch (e) {
            console.log(e)
            return interaction.editReply({
                embeds: [{
                    title: `Error :x:`,
                    description: `Failed while getting SSID from Login Cookie!`,
                    color: 0xff0000
                }],
                ephemeral: true
            })
        }
    }
}
