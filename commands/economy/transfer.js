const { SlashCommandBuilder } = require("discord.js")


module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
    .setName("transfer")
    .setDescription("aaaaaaaaaaaaaaa")
    .addUserOption(option=>
        option.setName('user')
        .setDescription('O usúario')
        .setRequired(true))
    .addIntegerOption(option=>
        option.setName('amount')
        .setDescription('quantidade')
        .setRequired(true)
    ),

    async execute(interaction){
    }
}
