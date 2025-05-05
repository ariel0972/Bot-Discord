const { SlashCommandBuilder } = require("discord.js")
const { inlineCode, codeBlock, bold } = require('discord.js');


module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Joga um dado de 6 lados")
    .addNumberOption(option=>
        option.setName('quantidade')
        .setDescription('Quantidade de Dados a serem lançados')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addNumberOption(option=>
            option.setName('lados')
            .setDescription('número de lados do(s) dado(s) lançado(s)')
            .setRequired(true)
            .setMinValue(2)
            .setMaxValue(200))
    .addNumberOption(option =>
        option.setName('modificador')
        .setDescription('Adicione um modificador ao resultado')),
        
    async execute(interaction){
        const sided = interaction.options.getNumber('lados')
        const dices = interaction.options.getNumber('quantidade')
        const mod = interaction.options.getNumber('modificador')

        var dice = []
        var soma = 0
        for(let i=0;i<dices;i++){
            let result = ""
            result = 1 + Math.floor(Math.random() * sided)
            dice[i] =+ result
            soma += dice[i]
        }
        dice.sort(function (a, b) {
            return a - b;
          })
        console.log(`${dice}`)

        if (mod > 0){
            if (dices <= 1){
                await interaction.reply(`${dices}d${sided} + ${mod} [${bold(dice)}]  ⇾  ${inlineCode(` ${dice[0] + mod} `)}`)
            } else if (dices > 1){
                await interaction.reply(`${dices}d${sided} + ${mod} [${bold(dice)}]  ⇾  ${inlineCode(` ${soma + mod} `)}`)
            }
        } else if (mod < 0){
            if (dices <= 1){
                await interaction.reply(`${dices}d${sided} ${mod} [${bold(dice)}]  ⇾  ${inlineCode(` ${dice[0] + mod} `)}`)
            } else if (dices > 1){
                await interaction.reply(`${dices}d${sided} ${mod} [${bold(dice)}]  ⇾  ${inlineCode(` ${soma + mod} `)}`)
            }
        } else {
            if (dices <= 1){
                await interaction.reply(`${dices}d${sided} [${bold(dice)}]  ⇾  ${inlineCode(` ${dice} `)}`)
            } else if (dices > 1){
                await interaction.reply(`${dices}d${sided} [${bold(dice)}]  ⇾  ${inlineCode(` ${soma} `)}`)
            }
        }
    }
}