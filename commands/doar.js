const { SlashCommandBuilder, MessageFlags, EmbedBuilder, AttachmentBuilder } = require("discord.js")
const User = require("../database/models/user");

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName("doar")
        .setDescription("Doe um pouco de ouro para um colega habiticano seu.")
        .addUserOption(option => option
            .setName("membro")
            .setDescription("Membro ao qual vai doar dinheiro")
            .setRequired(true))
        .addNumberOption(option => option
            .setName("quantidade")
            .setDescription("A quantidade de ouro que você enviará")
            .setMinValue(0.01)
            .setMaxValue(100)
            .setRequired(true)),
    async execute(interaction) {
        const user = await User.findOne({ discordId: interaction.user.id });
        const URLbase = 'https://habitica.com/api/v3'


        const dest = interaction.options.getUser('membro')
        const gold = interaction.options.getNumber('quantidade')

        const destID = await User.findOne({ discordId: dest.id })

        if (!user) {
            return await interaction.reply("❌ Você não está vinculado ao bot. Use /vincular")
        }
        else if(!destID) {
            return await interaction.reply("❌ O destinatário não está vinculado ao bot.")
        }

        const HEADERS = (userId, Token) => ({
            "x-api-user": userId,
            "x-api-key": Token,
            'Content-Type': "application/json",
        })

        const resUser = await fetch(`${URLbase}/user`, {
            method: 'GET',
            headers: HEADERS(user.habiticaUserId, user.habiticaToken)
        })
        const sendData = await resUser.json()
        const userGold = sendData.data.stats.gp

        if (gold > userGold) return interaction.reply("Você é Pobre! Não tem ouro o suficiente.")

        const resDest = await fetch(`${URLbase}/user`, {
            method: 'GET',
            headers: HEADERS(destID.habiticaUserId, destID.habiticaToken)
        })
        const destData = await resDest.json()
        const destGold = destData.data.stats.gp

        await fetch(`${URLbase}/user`, {
            method: 'PUT',
            headers: HEADERS(user.habiticaUserId, user.habiticaToken),
            body: JSON.stringify({
                "stats.gp": userGold - gold
            })
        })

        await fetch(`${URLbase}/user`, {
            method: 'PUT',
            headers: HEADERS(destID.habiticaUserId, destID.habiticaToken),
            body: JSON.stringify({
                "stats.gp": destGold + gold
            })
        })

        await interaction.reply(`Você doou **${gold.toFixed(2)}** para ${dest.displayName}`)
    }
}