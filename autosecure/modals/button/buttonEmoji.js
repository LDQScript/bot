module.exports = {
    name: "buttonemoji",
    ownerOnly: true,
    callback: async (client, interaction) => {
        let emoji = interaction.components[0].components[0].value
        for (let comp of interaction.message.components[0].components) {
            let id = comp?.data?.custom_id
            if (id) {
                if (id.split("|")[0] == "savebutton") {
                    if (emoji) {
                        if (isNaN(emoji)) {
                            comp.data.emoji = { name: emoji }
                        } else {
                            comp.data.emoji = { id: emoji }
                        }
                    }else{
                        delete comp.data.emoji
                    }
                }
            }
        }
        try {
            await interaction.update({
                components: [interaction.message.components[0]]
            })
        } catch (e) {
            console.log(e)
            return interaction.update({ content: `Invalid emoji` })
        }
    }
}