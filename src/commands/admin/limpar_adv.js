module.exports = {
    name: 'limpar_adv',
    category: 'admin',
    async execute(sock, m, dbs, args) {
        const { dbUsuarios } = dbs;
        const jid = m.key.remoteJid;

        const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                       (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);

        if (!target) return sock.sendMessage(jid, { text: '[!] ERRO: Marque o usuário para zerar.' });

        dbUsuarios.prepare('DELETE FROM advertencias WHERE usuario_id = ?').run(target);

        await sock.sendMessage(jid, { 
            text: `[#] ADVERTÊNCIAS ZERADAS\n[>] Usuário: @${target.split('@')[0]}\n[>] O histórico foi limpo.`,
            mentions: [target]
        });
    }
};