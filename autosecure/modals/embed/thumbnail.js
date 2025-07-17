module.exports = {
 name: "thumbnail",
 callback: (client, interaction) => {
  let thumbnail = interaction.components[0].components[0].value;
  if (thumbnail.length == 0) {
   interaction.message.embeds[0].data.thumbnail = null
   return interaction.update({
    embeds: [interaction.message.embeds[0].data]
   })
  }
  if (!isValidUrl(thumbnail)) {
   return interaction.update(`Invalid URL`)
  }
  interaction.message.embeds[0].data.thumbnail = { url: thumbnail }
  interaction.update({
   embeds: [interaction.message.embeds[0].data]
  })
 }
}
const isValidUrl = urlString => {
 var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
  '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
 return !!urlPattern.test(urlString);
}