const { SlashCommandBuilder, MessageFlags, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ComponentType, ButtonStyle } = require("discord.js")
const User = require("../database/models/user")
const Canvas = require('@napi-rs/canvas');
const { captureAvatar } = require("../Habitica_avatar");
const { request } = require("undici");

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName("duelo")
        .setDescription("Duele com alguém")
        .addUserOption(option => option
            .setName("alvo")
            .setDescription("Com quem você irá tirar x1")
        )
        .addBooleanOption(option => option
            .setName("contra-bot")
            .setDescription("Contra um robô?")
        )
        .addStringOption(option => option
            .setName("dificuldade")
            .setDescription("adiciona dificuldade ao duelo com o bot")
            .addChoices(
                { name: 'Fácil', value: 'facil' },
                { name: 'Médio', value: 'medio' },
                { name: 'Difícil', value: 'dificil' },
            )
        ),

    async execute(interaction) {
        const desafiante = interaction.user
        const user = await User.findOne({ discordId: desafiante.id });
        const alvo = interaction.options.getUser("alvo");
        const contraBot = interaction.options.getBoolean("contra-bot") || false;
        const dif = interaction.options.getString("dificuldade") || "médio"

        // Verifica se está duelando com ele mesmo
        if (alvo && alvo.id === desafiante.discordId) {
            return interaction.reply({ content: "Você não pode duelar consigo mesmo!", flags: MessageFlags.Ephemeral });
        }

        // Verifica se o usuário e o oponente estão vinculado ao habitica no bot
        if (!user) return interaction.reply("Você precisa estar vinculado ao Habitica para duelar.");

        // Se deus quiser essa bomba funciona
        const HEADERS = {
            "x-api-user": user.habiticaUserId,
            "x-api-key": user.habiticaToken,
            "Content-Type": "application/json"
        };

        const res = await fetch("https://habitica.com/api/v3/user", { headers: HEADERS });
        const data = await res.json();

        const forcaJogador = Math.floor(10 + data.data.stats.str + data.data.stats.lvl / 2);
        const conJogador = Math.floor(8 + data.data.stats.con + data.data.stats.lvl / 2);

        // Objeto dos jogadores
        const player = {
            desafiante: {},
            oponente: {},
        }

        let oponenteId = null;
        let nomeOponente = null;

        let hp = {
            [desafiante.id]: 100,
            [oponenteId]: 100
        }

        // Luta contra o bot
        let strBot = 15, conBot = 10
        if (contraBot) {
            oponenteId = "BOT";
            hp[oponenteId] = 100;
            nomeOponente = "🤖 Bot Habiticano";

            switch (dif) {
                case "facil":
                    strBot = Math.floor(Math.random() * 5) + 5
                    conBot = Math.floor(Math.random() * 3) + 4
                    break;
                case "medio":
                    strBot = Math.floor(Math.random() * 5) + 15
                    conBot = Math.floor(Math.random() * 5) + 5
                    break;
                case "dificil":
                    strBot = Math.floor(Math.random() * 12) + 25
                    conBot = Math.floor(Math.random() * 8) + 12
                    break;
            }
        } else {
            // PvP  
            if (!alvo) return interaction.reply("Você precisa mencionar um usuário ou ativar `contra-bot: true`.");
            const alvoDB = await User.findOne({ discordId: alvo.id });
            if (!alvoDB) return interaction.reply("O jogador mencionado não está vinculado ao Habitica.");

            oponenteId = alvo.id;
            hp[oponenteId] = 100;
            nomeOponente = alvo.displayName;
        }

        let turno = null
        let coroa = null
        let cara = null

        const flipCoin = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("cara").setLabel("🪙 Cara").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('coroa').setLabel("👑 Coroa").setStyle(ButtonStyle.Secondary),
        )

        let msgCoin = null
        let escolha = null
        let resultado = null

        if (contraBot) {
            const options = ['cara', 'coroa']
            escolha = options[Math.floor(Math.random() * 2)]
            resultado = options[Math.floor(Math.random() * 2)]
            turno = escolha === resultado ? desafiante.id : "BOT"
            coroa = turno
            cara = turno === desafiante.id ? "BOT" : desafiante.id

            if (turno === "BOT") {
                setTimeout(async () => {
                    if (cd['BOT'] > 0) {
                        cd['BOT']--
                        textoBot = `🤖 O Bot está em Cooldown`;
                    }

                    let acao = "atacar"

                    let textoBot = "";
                    if (acao === "atacar") {
                        let dano = Math.floor(Math.random() * 5 + strBot * 0.8)
                        const crit = Math.random() < 0.15
                        if (crit) dano = Math.floor(dano * 1.5)
                        const def = defBuff[desafiante.id] ? conJogador * 1.5 : conJogador
                        const danoFinal = Math.max(0, dano - def)
                        console.log("Def jogador: ", def, "\nAtk oponente: ", danoFinal)
                        hp[desafiante.id] -= danoFinal;
                        defBuff[desafiante.id] = false
                        textoBot = `🤖 O Bot atacou e causou **${danoFinal} de dano!. ${crit ? "💥 CRITICO" : ""} **`
                    }

                    turno = desafiante.id;
                    duelEmbed.setDescription(`${textoBot}\n\nTurno de <@${turno}>`);
                    duelEmbed.spliceFields(0, 2,
                        { name: desafiante.displayName, value: `❤️ ${Math.max(0, hp[desafiante.id])} HP`, inline: true },
                        { name: nomeOponente, value: `❤️ ${Math.max(0, hp["BOT"])} HP`, inline: true }
                    );

                    await msg.edit({ embeds: [duelEmbed] });
                }, 2000)
            }
        } else {
            msgCoin = await interaction.reply({
                content: `🪙 <@${alvo.id}>, escolha **Cara ou Coroa**!!`,
                components: [flipCoin],
                withResponse: true
            })

            msgCoin = await interaction.fetchReply()
            const colectorCoin = msgCoin.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 })

            await new Promise((resolve) => {
                colectorCoin.on('collect', async (btn) => {
                    if (btn.user.id !== alvo.id) {
                        return btn.reply({ content: "Só o oponente pode escolher!", flags: MessageFlags.Ephemeral })
                    }

                    escolha = btn.customId
                    resultado = Math.random() < 0.5 ? "cara" : "coroa"
                    turno = resultado === escolha ? alvo.id : desafiante.id
                    coroa = turno
                    cara = resultado === desafiante.id ? alvo.id : desafiante.id

                    await btn.update({
                        content: `🪙 A moeda caiu em **${resultado.toUpperCase()}!!**\n <@${turno}> começa o duelo!`,
                        components: []
                    })
                    resolve()
                })

                colectorCoin.on("end", (_, reason) => {
                    if (reason === "time" && !turno) {
                        interaction.followUp("O duelo foi cancelado, o oponente não escolher cara ou coroa a tempo.")
                        resolve()
                    }
                })
            })

            if (!turno) return
        }

        let cd = {
            [desafiante.id]: 0,
            [oponenteId]: 0,
        }

        let defBuff = {
            [desafiante.id]: false,
            [oponenteId]: false,
        }

        let furia = {
            [oponenteId]: {
                ativa: false,
                usos: 0,
            }
        }

        let duelEmbed = new EmbedBuilder()
            .setTitle("⚔️ Duelo Iniciado!")
            .setDescription(`Turno de ${turno == desafiante.id ? "<@" + turno + ">" : "BOT"}`)
            .addFields(
                { name: desafiante.displayName, value: `❤️ ${hp[desafiante.id]} HP`, inline: true },
                { name: nomeOponente, value: `❤️ ${hp[oponenteId]} HP`, inline: true }
            )
            .setColor("#f54269")
            .setFooter({ text: `${oponenteId == "BOT" ? `Dificuldade: ${dif}` : " "}` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("atacar").setLabel("🗡️ Atacar").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("defender").setLabel("🛡️ Defender").setStyle(ButtonStyle.Secondary)
        );

        const msg = await interaction.reply({ embeds: [duelEmbed], components: [row], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on("collect", async (btn) => {
            if (btn.user.id !== turno) {
                return btn.reply({ content: "Não é seu turno!", ephemeral: true });
            }

            const jogadorAtual = turno;
            const inimigo = jogadorAtual === desafiante.id ? oponenteId : desafiante.id;

            let resultado = "";

            if (btn.customId === "atacar") {
                let dano = Math.floor(Math.random() * 5 + forcaJogador * 0.8);
                const crit = Math.random() < 0.1
                if (crit) dano = Math.floor(dano * 1.5)
                const danoFinal = Math.max(0, dano - conBot)
                hp[inimigo] -= danoFinal;
                resultado = `**<@${jogadorAtual}> atacou e causou ${danoFinal} de dano! ${crit ? "💥CRITICO!!" : ""}**`;

            } else if (btn.customId === "defender") {
                defBuff[desafiante.id] = true
                console.log("Def jogador: ", conJogador)
                resultado = `**<@${jogadorAtual}> se defende!**`;
            }

            // Verifica vitória
            if (hp[inimigo] <= 0) {
                collector.stop();
                const finalEmbed = new EmbedBuilder()
                    .setTitle("🏆 Vitória!")
                    .setDescription(`<@${jogadorAtual}> venceu o duelo!`)
                    .addFields(
                        { name: desafiante.displayName, value: `❤️ ${Math.max(0, hp[desafiante.id])} HP`, inline: true },
                        { name: nomeOponente, value: `❤️ ${Math.max(0, hp[oponenteId])} HP`, inline: true }
                    )
                    .setColor("#57F287");
                return btn.update({ embeds: [finalEmbed], components: [] });
            }

            // Troca turno
            turno = inimigo;

            // Atualiza embed
            duelEmbed.setDescription(`${resultado}\n\nTurno de ${turno === "BOT" ? nomeOponente : `<@${turno}>`}`);
            duelEmbed.spliceFields(0, 2,
                { name: desafiante.displayName, value: `❤️ ${Math.max(0, hp[desafiante.id])} HP`, inline: true },
                { name: nomeOponente, value: `❤️ ${Math.max(0, hp[oponenteId])} HP`, inline: true }
            );

            await btn.update({ embeds: [duelEmbed] });

            // BOT joga automaticamente
            if (turno === "BOT") {
                setTimeout(async () => {
                    if (cd['BOT'] > 0) {
                        cd['BOT']--
                        resultado = `🤖 O Bot está em Cooldown`;
                        return
                    }

                    let acao = "atacar"
                    if (dif === "dificil" && hp["BOT"] <= 40 && Math.random() < 0.55) acao = "furia"
                    if (furia['BOT'].ativa === true && Math.random() < 0.99) acao = "furia"
                    if (hp["BOT"] <= 50 && Math.random() < 0.50) acao = "defender"
                    if (hp["BOT"] <= 30 && Math.random() < 0.65) acao = "curar"
                    if (hp[desafiante.id] <= 55 && Math.random() < 0.8) acao = "fire ball"

                    let textoBot = "";
                    if (acao === "atacar") {
                        let dano = Math.floor(Math.random() * 5 + strBot * 0.8)
                        const crit = Math.random() < 0.15
                        if (crit) dano = Math.floor(dano * 1.5)
                        const def = defBuff[desafiante.id] ? conJogador * 1.5 : conJogador
                        const danoFinal = Math.max(0, dano - def)
                        console.log("Def jogador: ", def)
                        hp[desafiante.id] -= danoFinal;
                        defBuff[desafiante.id] = false
                        textoBot = `🤖 O Bot atacou e causou **${danoFinal} de dano!. ${crit ? "💥 CRITICO" : ""} **`;
                    } else if (acao === "defender") {
                        defBuff[oponenteId] = true
                        console.log("Def BOT: ", conBot)
                        textoBot = `🤖 O Bot se **defende!**`;
                    } else if (acao === "fire ball") {
                        let dano = Math.floor(Math.random() * 6 + strBot * 2)
                        const crit = Math.random() < 0.15
                        if (crit) dano = Math.floor(dano * 1.5)
                        const def = defBuff[desafiante.id] ? conJogador * 1.5 : conJogador
                        const danoFinal = Math.max(0, dano - def)
                        hp[desafiante.id] -= danoFinal;
                        console.log("Def jogador: ", def)
                        defBuff[desafiante.id] = false
                        cd['BOT'] = 1
                        textoBot = `🤖 O Bot lançou uma **Bolo de fogo🔥** e causou **${danoFinal} de dano! ${crit ? "💥 CRITICO MÁGICO!!" : ""} **`;
                    } else if (acao === "curar") {
                        let cura = 0
                        if (dif == "facil") {
                            cura = Math.floor(Math.random() * 5) + 2;
                        } else if (dif == "medio") {
                            cura = Math.floor(Math.random() * 8) + 5;
                        } else {
                            cura = Math.floor(Math.random() * 11) + 9;
                        }
                        hp["BOT"] += cura;
                        if (hp["BOT"] > 100) hp["BOT"] = 100;
                        textoBot = `🤖 O Bot recuperou **${cura} de HP❤️!**`;
                    } else if (acao === "furia") {
                        furia["BOT"].ativa = true
                        furia["BOT"].usos = 3
                        const cura = Math.floor(Math.random() * 11) + 10;
                        hp["BOT"] += cura;
                        if (hp["BOT"] > 100) hp["BOT"] = 100;

                        textoBot = `🤖 O Bot entrou em **FÚRIA🔥🔥**`

                        await msg.edit({
                            embeds: [duelEmbed.setDescription(`🤖 O Bot Recuperou **🔥${cura} de HP🔥**\n\nTurno de ${turno === "BOT" ? nomeOponente : `<@${turno}>`}`)]
                        })

                        const furiaAtq = async () => {
                            if (furia["BOT"].usos <= 0) {
                                furia["BOT"].ativa = false
                                await msg.edit({
                                    embeds: [duelEmbed.setDescription(`A Fúria acabou!!\n\nTurno de ${turno === "BOT" ? nomeOponente : `<@${turno}>`}`)]
                                })
                                cd["BOT"] = 2
                                return
                            }

                            let dano = Math.floor(Math.random() * 5 + strBot * 1.5)
                            const crit = Math.random() < 0.3
                            if (crit) dano = Math.floor(dano * 1.5)

                            const def = defBuff[desafiante.id] ? conJogador * 1.5 : conJogador
                            const danoFinal = Math.max(0, dano - def)

                            hp[desafiante.id] -= danoFinal;
                            defBuff[desafiante.id] = false
                            console.log(furia["BOT"].ativa, furia["BOT"].usos)
                            furia[oponenteId].usos--

                            await msg.edit({
                                embeds: [duelEmbed.setDescription(`🤖 O Bot atacou e causou 🔥🔥**${danoFinal} de dano!🔥🔥. ${crit ? "💥 CRITICO FURIOSO🔥🔥" : ""} **\n\nTurno de ${turno === "BOT" ? nomeOponente : `<@${turno}>`}`)]
                            })
                            setTimeout(furiaAtq, 1200)
                        }
                        setTimeout(furiaAtq, 1500)

                    }

                    // Verificar se matou
                    if (hp[desafiante.id] <= 0) {
                        collector.stop();
                        const final = new EmbedBuilder()
                            .setTitle("😵 Derrota!")
                            .setDescription("🤖 O Bot venceu o duelo!")
                            .addFields(
                                { name: desafiante.displayName, value: `❤️ ${Math.max(0, hp[desafiante.id])} HP`, inline: true },
                                { name: nomeOponente, value: `❤️ ${Math.max(0, hp["BOT"])} HP`, inline: true }
                            )
                            .setColor("Red");
                        return msg.edit({ embeds: [final], components: [] });
                    }

                    // Troca de volta
                    turno = desafiante.id;
                    duelEmbed.setDescription(`${textoBot}\n\nTurno de <@${turno}>`);
                    duelEmbed.spliceFields(0, 2,
                        { name: desafiante.displayName, value: `❤️ ${Math.max(0, hp[desafiante.id])} HP`, inline: true },
                        { name: nomeOponente, value: `❤️ ${Math.max(0, hp["BOT"])} HP`, inline: true }
                    );

                    await msg.edit({ embeds: [duelEmbed] });

                }, 1500); // delay pro bot reagir
            }
        });

        collector.on("end", (_, reason) => {
            if (reason === "time") {
                interaction.followUp("⏰ O duelo expirou por inatividade.");
            }
        });
    }
}
