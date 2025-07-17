const { ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const axios = require('axios')
const generate = require('../../utils/generate')
const { queryParams } = require('../../../db/db')
module.exports = {
 name: "ssidchecker",
 description: 'Checks your ssid',
 enabled: true,
 options: [
  {
   name: "ssid",
   description: "SSID to check!",
   type: ApplicationCommandOptionType.String,
   required: true
  }
 ],
 userOnly: true,

 callback: async (client, interaction) => {
  let ssid = interaction.options.getString("ssid")
  let profile = await axios({
   method: "GET",
   url: "https://api.minecraftservices.com/minecraft/profile",
   headers: {
    Authorization: `Bearer ${ssid}`
   },
   validateStatus: (status) => status >= 200 && status < 500,
  })
  if (profile?.data?.name) {
   let { data } = await axios({
    method: "GET",
    url: "https://api.minecraftservices.com/player/attributes",
    headers: {
     Authorization: `Bearer ${ssid}`
    }
   })
   let stats = `Online chat ${data?.privileges?.onlineChat ? `:white_check_mark:` : `:x:`}\nMultiplayer ${data?.privileges?.multiplayerServer ? `:white_check_mark:` : `:x:`}`
   let id = generate(32)
   let id2 = generate(32)
   queryParams(
    `INSERT INTO actions (id,action) VALUES (?,?)`,
    [id, `namechange|${ssid}`]
   );
   queryParams(
    `INSERT INTO actions (id,action) VALUES (?,?)`,
    [id2, `changeskin|${ssid}`]
   );
   return interaction.reply({
    embeds: [{
     title: `Got profile!`,
     description: `**IGN**: \`${profile.data.name}\`\n**UUID**:\`${profile?.data?.id}\`\n**Capes**: \`${profile?.data?.capes?.length}\`\n${stats}`,
     thumbnail: {
      url: `https://mineskin.eu/helm/${profile.data.name}`,
     },
     color: 0x00ff00
    }],
    components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("action|" + id).setLabel("Change Name").setEmoji("🏷️").setStyle(ButtonStyle.Primary)).addComponents(new ButtonBuilder().setCustomId("action|" + id2).setLabel("Change Skin").setEmoji(`👀`).setStyle(ButtonStyle.Primary))],
    ephemeral: true
   })

  } else {
   return interaction.reply({ content: `Invalid ssid!`, ephemeral: true })
  }
 }
}
