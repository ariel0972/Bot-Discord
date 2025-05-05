const { Events } = require('discord.js')


module.exports ={
    name: Events.ClientReady,
    once: true,
    execute(client){
        console.log(`Estou Pronto! Login realizado com sucesso em ${client.user.tag}`)
    },
}