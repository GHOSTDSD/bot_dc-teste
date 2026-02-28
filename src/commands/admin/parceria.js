module.exports = {
    name: 'parceria',
    async execute(sock, m, dbs, args) {
        const sender = m.key.participant || m.key.remoteJid;
        const res = dbs.dbParcerias.prepare('SELECT * FROM parcerias WHERE parceiro_id = ?').get(sender);
        if (!res) return;
        const msg = await sock.sendMessage(m.key.remoteJid, { text: `📊 *Status Parceria*\n\nCréditos: ${res.envios_restantes}/${res.limite_envios}` });
        setTimeout(() => { sock.sendMessage(m.key.remoteJid, { delete: msg.key }).catch(e=>e); }, 60000);
    }
};