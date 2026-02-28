module.exports = {
    name: 'rm_adv',
    category: 'admin',
    async execute(sock, m, dbs, args) {
        const { dbUsuarios } = dbs;
        const jid = m.key.remoteJid;

        const quoted = m.message.extendedTextMessage?.contextInfo?.participant;
        const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = quoted || mentioned || (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);

        if (!target) return sock.sendMessage(jid, { text: '[!] ERRO: Marque o usuário ou responda a ele.' });

        try {
            const row = dbUsuarios.prepare('SELECT qtd FROM advertencias WHERE usuario_id = ? AND groupId = ?').get(target, jid);
            if (!row || row.qtd === 0) return sock.sendMessage(jid, { text: '[#] Este usuário não possui advertências neste grupo.' });

            const novaQtd = row.qtd - 1;
            dbUsuarios.prepare('UPDATE advertencias SET qtd = ? WHERE usuario_id = ? AND groupId = ?').run(novaQtd, target, jid);

            const texto = [
                '┌── [ ADVERTÊNCIA REMOVIDA ]',
                `│ [#] Usuário: @${target.split('@')[0]}`,
                `│ [#] Restantes: ${novaQtd}`,
                '└──────────────────────────'
            ].join('\n');

            await sock.sendMessage(jid, { text: texto, mentions: [target] });
        } catch (e) { console.error(e); }
    }
};