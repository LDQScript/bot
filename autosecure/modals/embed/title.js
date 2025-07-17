module.exports = {
 name: "title",
 callback: (client, interaction) => {
  let title = interaction.components[0].components[0].value;
  interaction.message.embeds[0].data.title = title
  interaction.update({
   embeds: [interaction.message.embeds[0].data]
  })
 }
}