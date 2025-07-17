module.exports={
    name:"quarantine",
    description:`Keeps logging into an SSID, until the user gets cancer and decides that his account is just lost!`,
    options:[{
        name:"ssid",
        description:`SSID to keep logging into`,
        type:3,
        required:true
    }],
    userOnly:true,
    callback:async(client,interaction)=>{
        interaction.reply({
            embeds:[{
                title:`wait for it!`,
                color:0x00ff00
            }],
            ephemeral:true
        })
    }
}