const chalk = require('chalk');

module.exports = {
    name: 'adverter',
    category: 'admin',
    async execute(sock, m, dbs, args) {
        const { dbUsuarios } = dbs;
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');

        if (!isGroup) return sock.sendMessage(jid, { text: '[!] Este comando só pode ser usado em grupos.' });

        dbUsuarios.exec(`
            CREATE TABLE IF NOT EXISTS advertencias (
                usuario_id TEXT,
                groupId TEXT,
                qtd INTEGER DEFAULT 0,
                PRIMARY KEY (usuario_id, groupId)
            )
        `);

        const quoted = m.message.extendedTextMessage?.contextInfo?.participant;
        const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = quoted || mentioned || (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);

        if (!target) return sock.sendMessage(jid, { text: '[!] ERRO: Marque o usuário ou responda a mensagem dele.' });
        if (target === (m.key.participant || m.key.remoteJid)) return sock.sendMessage(jid, { text: '[!] Você não pode se adverter.' });

        try {
            const row = dbUsuarios.prepare('SELECT qtd FROM advertencias WHERE usuario_id = ? AND groupId = ?').get(target, jid);
            const novaQtd = (row ? row.qtd : 0) + 1;

            dbUsuarios.prepare('INSERT OR REPLACE INTO advertencias (usuario_id, groupId, qtd) VALUES (?, ?, ?)').run(target, jid, novaQtd);

            const texto = [
                '┌── [ SISTEMA DE PUNIÇÃO ]',
                `│ [#] Usuário: @${target.split('@')[0]}`,
                `│ [#] Advertência: ${novaQtd}/3`,
                '└──────────────────────────'
            ].join('\n');

            await sock.sendMessage(jid, { text: texto, mentions: [target] });

            if (novaQtd >= 3) {
                dbUsuarios.prepare('DELETE FROM advertencias WHERE usuario_id = ? AND groupId = ?').run(target, jid);
                await sock.sendMessage(jid, { text: `[!] Limite atingido. Removendo @${target.split('@')[0]}...`, mentions: [target] });
                await sock.groupParticipantsUpdate(jid, [target], 'remove');
            }
        } catch (e) {
            console.error(e);
        }
    }
};