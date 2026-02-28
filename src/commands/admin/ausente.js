module.exports = {
    name: 'ausente',
    async execute(sock, m, dbs, args) {
        const sender = m.key.participant || m.key.remoteJid;
        const motivo = args.join(" ") || "Não informado";
        dbs.dbUsuarios.prepare('INSERT OR REPLACE INTO afk_users (jid, reason, time) VALUES (?, ?, ?)').run(sender, motivo, Date.now());
        const msg = await sock.sendMessage(m.key.remoteJid, { text: `💤 @${sender.split('@')[0]} ficou ausente.`, mentions: [sender] });
        setTimeout(() => { sock.sendMessage(m.key.remoteJid, { delete: msg.key }).catch(e=>e); }, 60000);
    }
};