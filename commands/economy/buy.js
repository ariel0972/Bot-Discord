const { SlashCommandBuilder } = require("discord.js")


module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("aaaaaaaaaa")
    .addStringOption(option=>
        option.setName('item')
        .setDescription('item a comprar')
        .setRequired(true)
    ),

    async execute(interaction){
    }
}
