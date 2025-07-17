const { queryParams } = require("../../../db/db");
const listSettings = require("../../utils/listSettings");

module.exports = {
    name: "oauthlink",
    callback: async (client, interaction) => {
        let oauth = interaction.components[0].components[0].value;
        if (oauth.length != 0) {
            if (!isValidUrl(oauth)) {
                return interaction.reply({ content: `Invalid URL`, ephemeral: true })
            }
        }
        await queryParams(`UPDATE autosecure SET oauth_link=? WHERE user_id=?`, [oauth, interaction.user.id])
        return interaction.update(await listSettings(client.username))
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