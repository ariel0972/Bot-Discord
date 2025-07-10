const { Events, MessageFlags } = require('discord.js')

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {

            const command = interaction.client.commands.get(interaction.commandName)

            if (!command) {
                console.error("Comando Não Encontrado")
                return
            }


            try {
                await command.execute(interaction)
            }
            catch (error) {
                console.error(error)
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: "Esse comando Não existe", flags: MessageFlags.Ephemeral })
                } else {
                    await interaction.reply({ content: 'Tá viajando? Essa porra existe não!', flags: MessageFlags.Ephemeral });
                }
            }
        }

        else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName)

            if (!command | !command.autocomplete) return

            try {
                await command.autocomplete(interaction)
            } catch (error) {
                console.error("Erro no autocomplete", error)
            }
        }
    },
}