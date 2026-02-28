module.exports = {
    name: 'list_parceria',
    category: 'admin',
    async execute(sock, m, dbs, args) {
        const jid = m.key.remoteJid;
        const { dbParcerias } = dbs;

        try {
            const parceiros = dbParcerias.prepare('SELECT * FROM parcerias WHERE groupId = ?').all(jid);

            if (parceiros.length === 0) {
                const vazio = await sock.sendMessage(jid, { text: "⚠️ Nenhuma parceria registrada neste grupo." });
                return setTimeout(() => sock.sendMessage(jid, { delete: vazio.key }).catch(e => e), 30000);
            }

            let texto = '┌── [ LISTA DE PARCERIAS ]\n';
            const mentions = [];

            parceiros.forEach((p, index) => {
                const userJid = p.parceiro_id;
                mentions.push(userJid);
                
                texto += `│ [#] Parceiro: @${userJid.split('@')[0]}\n`;
                texto += `│ [#] Créditos: ${p.envios_restantes}/${p.limite_envios}\n`;
                texto += `│ [#] Status: ${p.info}\n`;
                
                if (index !== parceiros.length - 1) {
                    texto += `├──────────────────────────\n`;
                }
            });

            texto += '└──────────────────────────';

            const msg = await sock.sendMessage(jid, { 
                text: texto, 
                mentions: mentions 
            });

            setTimeout(() => sock.sendMessage(jid, { delete: msg.key }).catch(e => e), 60000);

        } catch (e) {
            console.error(e);
            await sock.sendMessage(jid, { text: "❌ Erro ao listar parcerias." });
        }
    }
};