module.exports = {
    name: 'lista_adv',
    category: 'admin',
    async execute(sock, m, dbs, args) {
        const { dbUsuarios } = dbs;
        const jid = m.key.remoteJid;

        const rows = dbUsuarios.prepare('SELECT * FROM advertencias WHERE qtd > 0').all();

        if (rows.length === 0) return sock.sendMessage(jid, { text: '[#] Nenhuma advertência registrada no sistema.' });

        let lista = '┌── [ LISTA DE INFRAÇÕES ]\n';
        const mentions = [];

        rows.forEach(row => {
            lista += `│ [#] @${row.usuario_id.split('@')[0]} - [${row.qtd} ADVs]\n`;
            mentions.push(row.usuario_id);
        });
        lista += '└──────────────────────────';

        await sock.sendMessage(jid, { text: lista, mentions });
    }
}