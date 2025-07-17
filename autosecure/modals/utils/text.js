const { Client } = require("discord.js");

module.exports = {
    name: "text",
    userOnly: true,
    callback: async (client, interaction) => {
        console.log(interaction.customId)
        let message = interaction.components[0].components[0].value;
        let id = interaction.customId.split("|")[1]
        try {
            await client.users.fetch(id).then(async (user) => {
                await user.send(message)
            })
            return interaction.update({ content: `Sent <@${id}> your message!` })
        } catch (e) {
            return interaction.update({ content: `Failed to dm <@${id}> your message!` })
        }
    }
}