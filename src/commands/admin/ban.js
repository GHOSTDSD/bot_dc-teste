const chalk = require('chalk');

module.exports = {
    name: 'ban',
    category: 'admin',
    async execute(sock, m, dbs, args) {
        const jid = m.key.remoteJid;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        const quoted = m.message.extendedTextMessage?.contextInfo?.participant;
        const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const target = quoted || mentioned || (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);

        if (!target) {
            return sock.sendMessage(jid, { text: '[!] ERRO: Marque alguém ou responda a uma mensagem.' });
        }

        if (target === botId) {
            return sock.sendMessage(jid, { text: '[!] OPERAÇÃO CANCELADA: Eu não posso me banir.' });
        }

        try {
            await sock.groupParticipantsUpdate(jid, [target], 'remove');

            const texto = [
                '┌── [ OPERAÇÃO: BANIMENTO ]',
                `│ [#] Alvo: @${target.split('@')[0]}`,
                `│ [#] Status: Removido do setor`,
                '└──────────────────────────'
            ].join('\n');

            await sock.sendMessage(jid, { text: texto, mentions: [target] });
            console.log(chalk.red(`  [BAN] Executado contra: ${target}`));

        } catch (e) {
            console.error(e);
            await sock.sendMessage(jid, { text: '[!] FALHA: O sistema não possui permissões de Administrador.' });
        }
    }
};