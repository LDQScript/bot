module.exports = {
 name: "footerurl",
 callback: (client, interaction) => {
  let footerurl = interaction.components[0].components[0].value;
  let data = interaction.message.embeds[0].data
  if (footerurl.length == 0) {
   if (data.footer) {
    data.footer.icon_url = null
   } else {
    data.footer = null
   }
   return interaction.update({
    embeds: [interaction.message.embeds[0].data]
   })
  }
  if (!isValidUrl(footerurl)) {
   return interaction.update(`Invalid URL`)
  }
  if (data.footer) {
   data.footer.icon_url = footerurl
  } else {
   data.footer = { icon_url: footerurl }
  }
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