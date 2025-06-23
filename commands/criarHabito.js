const { SlashCommandBuilder, MessageFlags } = require("discord.js")
const User = require("../database/models/user");


module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName("criar-habito")
        .setDescription("Cria um hábito no seu hábitica. O hábito vem positivo por padrão.")
        .addStringOption(option => option
            .setName("nome")
            .setDescription("Escreva o nome do hábito")
            .setRequired(true))
        .addStringOption(option => option
            .setName("descrição")
            .setDescription("Escreva a descrição do hábito"))
        .addBooleanOption(option => option
            .setName("positivo")
            .setDescription("Define se é um hábito positivo"))
        .addBooleanOption(option => option
            .setName("negativo")
            .setDescription('Define se é um hábito negativo'))
        .addNumberOption(option => option
            .setName("dificuldade")
            .setDescription("Defina qual é o nível de dificuldade do seu Hábito.")
            .addChoices(
                { name: 'Trivial', value: 0.1 },
                { name: 'Normal', value: 1 },
                { name: 'Médio', value: 1.5 },
                { name: 'Difícil', value: 2 },
            ))
        .addStringOption(option => option
            .setName("etiqeutas")
            .setDescription("⚠️BETA-Adicione uma etiqueta ao seu hábito.")
            .addChoices()
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const discordId = interaction.user.id
        const text = interaction.options.getString("nome")
        const tag = interaction.options.getString("etiqueta")
        const desc = interaction.options.getString("descrição")
        const plus = interaction.options.getBoolean("positivo")
        const minus = interaction.options.getBoolean("negativo")
        const dif = interaction.options.getNumber("dificuldade")
        
        const up = (plus === null || plus === undefined) ? true : plus;
        const down = (minus === null || minus === undefined) ? false : minus;
        const diff = (dif === null || dif === undefined) ? 1 : dif;
        
       

        try {
            const user = await User.findOne({ discordId })

            if (!user) {
                return await interaction.editReply("Você ainda não vinculou sua conta. Use /vincular")
            }

            const HEADERS = {
                "x-client": `${user.habiticaUserId}-BotDiscord`,
                "x-api-user": user.habiticaUserId,
                "x-api-key": user.habiticaToken,
                'Content-Type': "application/json",
            }

            const Task = {
                "text": text,
                "notes": desc,
                "type": "habit",
                "up": up,
                "down": down,
                "priority": diff,
            }


            const res = await fetch('https://habitica.com/api/v3/tasks/user', {
                method: 'POST',
                headers: HEADERS,
                body: JSON.stringify(Task)
            })

            const data = await res.json()

            if (!res.ok) {
                await interaction.editReply(`Erro ao criar o Hábito: ${data.message}`)
            }

            await interaction.editReply(`Hábito criado com sucesso: **${data.data.text}**`)
        } catch (err) {
            console.error(err)
            await interaction.editReply("❌ Ocorreu um erro ao criar o hábito.");
        }

    }
}