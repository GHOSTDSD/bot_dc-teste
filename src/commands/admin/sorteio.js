const chalk = require('chalk');

module.exports = {
    name: 'sorteio',
    category: 'admin',
    async execute(sock, m, dbs, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;

        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        
        const { key } = await sock.sendMessage(jid, { text: '🎰 Iniciando Roleta...' });

        for (let i = 0; i < 15; i++) {
            const randomUser = participants[Math.floor(Math.random() * participants.length)].id.split('@')[0];
            
            await sock.sendMessage(jid, { 
                text: `┌── [ 🎰 ROLETA ]\n│ 🎲 Rodando: ${randomUser}\n└──────────────`, 
                edit: key 
            });
            
            await new Promise(resolve => setTimeout(resolve, 150 + (i * 20)));
        }

        const vencedorObj = participants[Math.floor(Math.random() * participants.length)];
        const vencedorId = vencedorObj.id;
        const vencedorNome = vencedorId.split('@')[0];

        await sock.sendMessage(ji656d, { 
            text: `┌── [ 🏆 VENCEDOR 🏆 ]\n│\n│ 🎯 Marcado: @${vencedorNome}\n│ ✨ Parabéns!\n│\n└────────────────────`, 
            edit: key, 
            mentions: [vencedorId] 
        });
    }
}