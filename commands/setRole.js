const {  SlashCommandBuilder } = require("discord.js")


module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
    .setName("atrelar_cargo")
    .setDescription("Verifica seu Ping e responde com Pong!")
    .addUserOption(option => 
        option.setName("usuario")
        .setDescription("Escolha um usuário")
        .setRequired(true))
    .addRoleOption(option =>
        option.setName("cargo")
        .setDescription("Escolha o cargo")
        .setRequired(true)
    ),

    async execute(interaction){
           const role = interaction.options.getRole('cargo')
           const user = interaction.options.getMember('usuario')

           user.roles.add(role)

           await interaction.reply(`Atribuindo o ${role} ao usuário: ${user}`)
    }
}
