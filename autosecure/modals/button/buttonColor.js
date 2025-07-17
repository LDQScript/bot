module.exports = {
  name: "buttoncolor",
  ownerOnly: true,
  callback: (client, interaction) => {
    let color = interaction.components[0].components[0].value;
    switch (color.toLowerCase()) {
      case "red":
        style = 4
        break
      case "blue":
        style = 1
        break
      case "green":
        style = 3
        break
      case "gray":
        style = 2
        break
      default:
        return interaction.update({ content: `Invalid color! you are limtied only to these 4 colors (Red,Green,Blue,Gray)` })
    }
    for (let comp of interaction.message.components[0].components) {
      let id = comp?.data?.custom_id
      if (id) {
        if (id.split("|")[0] == "savebutton") {
          comp.data.style = style
        }
      }
    }
    interaction.update({
      components: [interaction.message.components[0]]
    })
  }
}