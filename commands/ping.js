const { SlashCommandBuilder } = require("discord.js")


module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Verifica seu Ping e responde com Pong!"),

    async execute(interaction){
        const sent = await interaction.reply({ content: 'Pinging...' });
        interaction.editReply(`Roundtrip latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
    }
}
