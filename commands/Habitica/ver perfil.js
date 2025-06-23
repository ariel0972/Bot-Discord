const { SlashCommandBuilder } = require("discord.js")


module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
    .setName("ver-perfil")
    .setDescription("Veja seu perfil do Habitica"),

    async execute(interaction){
        interaction.reply(`oi!`);
    }
}