const { SlashCommandBuilder } = require("discord.js")


module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("aaaaaaaaaaaaa")
    .addUserOption(option=>
        option.setName('user')
        .setDescription('O usúario')
        .setRequired(true)
    ),

    async execute(interaction){
    }
}
