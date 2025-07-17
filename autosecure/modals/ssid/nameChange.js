const axios = require("axios");

module.exports = {
 name: "namechangemodal",
 callback: async (client, interaction) => {
  let ssid = interaction.customId.split("|")[1]
  let newName = interaction.components[0].components[0].value;
  let data = await axios({
   method: "PUT",
   url: `https://api.minecraftservices.com/minecraft/profile/name/${newName}`,
   headers: {
    "Content-Type": "Application/json",
    Authorization: `Bearer ${ssid}`
   },
   validateStatus: (status) => status >= 200 && status < 501
  })
  switch (data.status) {
   case 400:
    return interaction.update({ content: `Name is invalid, longer than 16 characters or contains characters other than (a-zA-Z0-9_)` })
   case 403:
    return interaction.update({ content: `Name is unavailable (Either taken or has not become available)` })

   case 401:
    return interaction.update({ content: `Unauthorized (Bearer token expired or is not correct)` })

   case 429:
    return interaction.update({ content: `Too many requests sent` })

   case 500:
    return interaction.update({ content: `Timed out (API lagged out and could not respond)` })

   case 200:
    return interaction.update({ content: `Success (Name changed)` })

   default:
    console.log(data)
    return interaction.update({ content: `Unexpected error occured!` })
    break;
  }
 }
}