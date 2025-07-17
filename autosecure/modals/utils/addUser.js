const { queryParams } = require("../../../db/db");
const usersMsg = require("../../utils/usersMsg");

module.exports = {
    name: "adduser",
    ownerOnly:true,
    callback: async (client, interaction) => {
        let userId = interaction.components[0].components[0].value;
        if(isNaN(userId)) return interaction.update(`Invalid User ID`)
        let isExist = await queryParams(`SELECT * FROM users WHERE user_id=? AND child=?`,[client.username,userId])
        if(isExist.length!=0){
            return interaction.update(`You already added this user before!`)
        }else{
            if(userId==client.username){
                return interaction.update(`You are the owner of this bot, you don't need to add yourself!`)
            }
            await queryParams(`INSERT INTO users(user_id,child) VALUES(?,?)`,[client.username,userId])
            return interaction.update(await usersMsg(interaction.user.id,1))
        }
    }
}