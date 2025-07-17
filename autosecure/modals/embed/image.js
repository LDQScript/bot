module.exports = {
 name: "image",
 callback: (client, interaction) => {
  let image = interaction.components[0].components[0].value;
  if (image.length == 0) {
   interaction.message.embeds[0].data.image = null
   return interaction.update({
    embeds: [interaction.message.embeds[0].data]
   })
  }
  if (!isValidUrl(image)) {
   return interaction.update(`Invalid URL`)
  }
  interaction.message.embeds[0].data.image = { url: image }
  return interaction.update({
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