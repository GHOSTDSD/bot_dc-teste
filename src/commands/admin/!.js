module.exports = {
    name: '',
    async execute(sock, m, dbs, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        const texto = [
            '┌── [ ⚠️ AVISO ]',
            `│ Olá @${sender.split('@')[0]}!`,
            `│ Para ver a minha lista de comandos`,
            `│ utilize o comando: *!menu*`,
            '└──────────────────────────'
        ].join('\n');

        const msg = await sock.sendMessage(jid, { 
            text: texto, 
            mentions: [sender] 
        }, { quoted: m });

        // Apaga a mensagem após 60 segundos para manter o grupo limpo
        setTimeout(() => {
            sock.sendMessage(jid, { delete: msg.key }).catch(e => e);
        }, 60000);
    }
};