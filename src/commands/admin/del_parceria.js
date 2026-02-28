const chalk = require('chalk');

module.exports = {
    name: 'del_parceria',
    category: 'admin',
    async execute(sock, m, dbs, args) {
        const { dbParcerias } = dbs;
        const jid = m.key.remoteJid;

        const quoted = m.message.extendedTextMessage?.contextInfo?.participant;
        const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = quoted || mentioned || (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);

        if (!target) {
            return sock.sendMessage(jid, { 
                text: '>> [!] Menciona o parceiro, responde à mensagem ou digita o número.' 
            });
        }

        try {
            const result = dbParcerias.prepare('DELETE FROM parcerias WHERE parceiro_id = ? AND groupId = ?').run(target, jid);

            if (result.changes > 0) {
                const textoSucesso = [
                    '┌── [ PARCERIA REMOVIDA ]',
                    `│ [#] Parceiro: @${target.split('@')[0]}`,
                    '└──────────────────────────'
                ].join('\n');

                await sock.sendMessage(jid, { text: textoSucesso, mentions: [target] });
                console.log(chalk.red(`  [DB] Parceria removida em ${jid} para: ${target}`));
            } else {
                await sock.sendMessage(jid, { text: '>> [!] Esse utilizador não possui uma parceria ativa neste grupo.' });
            }

        } catch (error) {
            console.error(error);
            await sock.sendMessage(jid, { text: '>> [!] Erro ao eliminar dados.' });
        }
    }
};