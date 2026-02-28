module.exports = {
    name: 'unmute',
    async execute(sock, m, dbs, args) {
        const jid = m.key.remoteJid;
        const mention = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                        (args[0] && args[0].replace('@', '') + '@s.whatsapp.net');

        if (!mention) {
            const msg = await sock.sendMessage(jid, { text: "❌ Mencione alguém." }, { quoted: m });
            setTimeout(() => { sock.sendMessage(jid, { delete: msg.key }).catch(e=>e); }, 60000);
            return;
        }

        dbs.dbUsuarios.prepare('DELETE FROM muted_users WHERE jid = ? AND groupId = ?')
            .run(mention, jid);

        const msg = await sock.sendMessage(jid, { text: `🔊 Desmutado: @${mention.split('@')[0]}`, mentions: [mention] }, { quoted: m });
        setTimeout(() => { sock.sendMessage(jid, { delete: msg.key }).catch(e=>e); }, 60000);
    }
};