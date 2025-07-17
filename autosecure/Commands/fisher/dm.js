const { ApplicationCommandOptionType } = require('discord.js')
const { queryParams } = require('../../../db/db')
const axios = require("axios")
module.exports = {
 name: "dm",
 description: 'DM a user with anything that you want',
 enabled: true,
 options: [
  {
   name: "user",
   description: "Who is the user that you want to dm?",
   type: ApplicationCommandOptionType.User,
   required: true
  },
  {
   name: "message",
   description: "What do you want to tell him?",
   type: ApplicationCommandOptionType.String,
   required: true
  }
 ],
 userOnly: true,

 callback: async (client, interaction) => {
  let user2dm = interaction.options.getUser("user")
  let message = interaction.options.getString("message")
  try {
   user2dm.send(message)
   return interaction.reply({
    embeds: [{
     title: `Sent ${user2dm.username} your message!`,
     description: message,
     color: 0x00ff00
    }],
    ephemeral: true
   })
  } catch (e) {
   return interaction.reply({
    embeds: [{
     title: `Error :x:`,
     description: `Failed to dm the user with your message!`,
     color: 0xff0000
    }],
    ephemeral: true
   })
  }
 }
}
