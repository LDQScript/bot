module.exports = {
    name: "authorurl",
    callback: (client, interaction) => {
        let authorUrl = interaction.components[0].components[0].value;
        let data = interaction.message.embeds[0].data
        if (authorUrl.length == 0) {
            if (data.author) {
                data.author.iconURL = authorUrl
            } else {
                data.author = { iconURL: authorUrl }
            }
            return interaction.update({
                embeds: [interaction.message.embeds[0].data]
            })
        }
        if (!isValidUrl(authorUrl)) {
            return interaction.update(`Invalid URL`)
        }
        if (data.author) {
            data.author.iconURL = authorUrl
        } else {
            data.author = { iconURL: authorUrl }
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