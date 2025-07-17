module.exports = {
  name: "buttonlabel",
  ownerOnly: true,
  callback: (client, interaction) => {
    let label = interaction.components[0].components[0].value;
    for (let comp of interaction.message.components[0].components) {
      let id = comp?.data?.custom_id
      if (id) {
        if (id.split("|")[0] == "savebutton") {
          comp.data.label = label
        }
      }
    }
    interaction.update({
      components: [interaction.message.components[0]]
    })
  }
}