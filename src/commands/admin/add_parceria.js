module.exports = {
    name: 'add_parceria',
    async execute(sock, m, dbs, args) {
        const jid = m.key.remoteJid;
        const quoted = m.message.extendedTextMessage?.contextInfo?.participant;
        const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = quoted || mentioned || (args[0] && args[0].replace(/\D/g, '') + '@s.whatsapp.net');
        
        const qtdArg = quoted || mentioned ? args[0] : args[1];
        const qtd = parseInt(qtdArg);

        if (!target || isNaN(qtd)) {
            const err = await sock.sendMessage(jid, { text: "⚠️ Use: !add_parceria @user [qtd] ou responda a uma mensagem." });
            return setTimeout(() => sock.sendMessage(jid, { delete: err.key }).catch(e=>e), 60000);
        }

        dbs.dbParcerias.exec(`
            CREATE TABLE IF NOT EXISTS parcerias (
                parceiro_id TEXT,
                groupId TEXT,
                autor TEXT,
                limite_envios INTEGER,
                envios_restantes INTEGER,
                info TEXT,
                PRIMARY KEY (parceiro_id, groupId)
            )
        `);

        dbs.dbParcerias.prepare('DELETE FROM parcerias WHERE parceiro_id = ? AND groupId = ?').run(target, jid);
        dbs.dbParcerias.prepare(`
            INSERT INTO parcerias (parceiro_id, groupId, autor, limite_envios, envios_restantes, info)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(target, jid, m.key.participant || jid, qtd, qtd, 'Ativo');

        const texto = [
            '┌── [ REGISTRO DE PARCERIA ]',
            `│ [#] Parceiro: @${target.split('@')[0]}`,
            `│ [#] Créditos: ${qtd}/${qtd}`,
            '└──────────────────────────'
        ].join('\n');

        const ok = await sock.sendMessage(jid, { text: texto, mentions: [target] });
        setTimeout(() => sock.sendMessage(jid, { delete: ok.key }).catch(e=>e), 60000);
    }
};