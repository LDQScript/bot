const { ApplicationCommandOptionType, TextInputStyle } = require("discord.js");
const modalBuilder = require("../../utils/modalBuilder");
module.exports = {
  name: "secure",
  description: "Secure an account",
  options: [
    {
      name: "type",
      description: "Type of Securing",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Recovery Code",
          value: "rec"
        },
        {
          name: "OTP",
          value: "otp"
        }
      ]
    },
  ],
  enabled: true,
  userOnly: true,
  callback: async (client, interaction) => {
    let option = interaction.options.getString("type")
    if (option == "otp") {
      return interaction.showModal(modalBuilder(`otpsecure`, `Type Your Account Information`,
        [
          {
            setCustomId: 'email',
            setMaxLength: 200,
            setMinLength: 1,
            setRequired: true,
            setLabel: "Email",
            setPlaceholder: "Ex:test@outlook.com",
            setStyle: TextInputStyle.Short
          },
          {
            setCustomId: 'otp',
            setMaxLength: 7,
            setMinLength: 6,
            setRequired: true,
            setLabel: "OTP",
            setPlaceholder: "Ex:312849",
            setStyle: TextInputStyle.Short
          }
        ]
      ))
    } else {
      return interaction.showModal(modalBuilder(`recsecure`, `Type Your Account Information`,
        [
          {
            setCustomId: 'email',
            setMaxLength: 200,
            setMinLength: 1,
            setRequired: true,
            setLabel: "Email",
            setPlaceholder: "Ex:test@outlook.com",
            setStyle: TextInputStyle.Short
          },
          {
            setCustomId: 'rec',
            setMaxLength: 40,
            setMinLength: 1,
            setRequired: true,
            setLabel: "Recovery Code",
            setPlaceholder: "Ex: 5LR2M-JF4XZ-EDBWS-VMLQD-T34CW",
            setStyle: TextInputStyle.Short
          }
        ]
      ))
    }
  },
};
