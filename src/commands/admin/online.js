module.exports = {
    name: 'online',
    async execute(sock, m, dbs, args) {
        const sender = m.key.participant || m.key.remoteJid;
        dbs.dbUsuarios.prepare('DELETE FROM afk_users WHERE jid = ?').run(sender);
        const msg = await sock.sendMessage(m.key.remoteJid, { text: `✨ @${sender.split('@')[0]} voltou!`, mentions: [sender] });
        setTimeout(() => { sock.sendMessage(m.key.remoteJid, { delete: msg.key }).catch(e=>e); }, 60000);
    }
};