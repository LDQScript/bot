module.exports = {
 name: "color",
 callback: (client, interaction) => {
  let color = interaction.components[0].components[0].value;
  try {
   color = parseInt(color, 16)
  } catch (e) {
   return interaction.update(`Invalid hex color`)
  }
  interaction.message.embeds[0].data.color = color
  interaction.update({
   embeds: [interaction.message.embeds[0].data]
  })
 }
}