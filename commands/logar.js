const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js")
const { inlineCode, codeBlock, bold, spoiler } = require('discord.js');
const User = require("../database/models/user")


module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName("logar-habitica")
        .setDescription("Conecte-se com sua conta do Hábitica e receba seu Token de API e ID de Usuário")
        .addStringOption(option => option
            .setName("email")
            .setDescription("Escreva seu nome de usuário ou email do hábitica")
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName("senha")
            .setDescription("Coloque sua senha do Habitica")
            .setRequired(true)
        ),

    async execute(interaction) {
        const discordId = interaction.user.id
        const username = interaction.options.getString("email")
        const password = interaction.options.getString("senha")

        try {
            const user = await User.findOne({ discordId })

            if (!user) {
                return await interaction.editReply("Você ainda não vinculou sua conta. Use /vincular")
            }

            if (!username || !password) {
                return await interaction.reply("Falha ao logar na sua conta do hábitica.")
            }

            const HEADERS = {
                "x-client": `${user.habiticaUserId}-BotDiscord`,
                "x-api-user": user.habiticaUserId,
                "x-api-key": user.habiticaToken,
                'Content-Type': "application/json",
            }

            const login = {
                "username": username,
                "password": password
            }

            const res = await fetch('https://habitica.com/api/v3/user/auth/local/login', {
                method: 'POST',
                headers: HEADERS,
                body: JSON.stringify(login)
            })

            const data = await res.json()

            if (!res.ok) {
                await interaction.editReply(`Erro ao criar o Hábito: ${data.message}`)
            }

            const file = new AttachmentBuilder('./assets/habitica-logo.jpg');

            const userEmbed = new EmbedBuilder()
                .setTitle(`${data.data.username}`)
                .setThumbnail('attachment://habitica-logo.jpg')
                .setColor("#24CC8f")
                .addFields(
                    { name: 'User ID', value: `${spoiler(codeBlock(data.data.id))}` },
                    { name: 'Token API', value: `${spoiler(codeBlock(data.data.apiToken))}` },
                    { name: '\u200B', value: '\u200B' },
                    { name: 'Copie e cole o comando', value: `${spoiler(codeBlock(`/vincular userid:${data.data.id} token:${data.data.apiToken}`))}` },
                )

            await interaction.reply({
                embeds: [userEmbed],
                files: [file]
            })

        } catch (error) {
            console.error(error)
            await interaction.reply("❌ Ocorreu um erro ao logar no hábitica.");
        }
    }
}