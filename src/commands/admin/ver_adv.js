module.exports = {
    name: 'ver_adv',
    category: 'admin',
    async execute(sock, m, dbs, args) {
        const { dbUsuarios } = dbs;
        const jid = m.key.remoteJid;

        const quoted = m.message.extendedTextMessage?.contextInfo?.participant;
        const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = quoted || mentioned || (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : (m.key.participant || m.sender));

        const row = dbUsuarios.prepare('SELECT qtd FROM advertencias WHERE usuario_id = ? AND groupId = ?').get(target, jid);
        const qtd = row ? row.qtd : 0;

        const texto = [
            '┌── [ CONSULTA DE ADVS ]',
            `│ [#] Usuário: @${target.split('@')[0]}`,
            `│ [#] Total: ${qtd}`,
            '└──────────────────────────'
        ].join('\n');

        await sock.sendMessage(jid, { text: texto, mentions: [target] });
    }
};