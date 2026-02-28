const chalk = require('chalk');

module.exports = {
    name: 'temp',
    category: 'util',
    async execute(sock, m, dbs, args) {
        const jid = m.key.remoteJid;
        const input = parseInt(args[0]);

        if (isNaN(input) || input <= 0) {
            return sock.sendMessage(jid, { text: 'Solicitação inválida. Use: !temp [segundos]' });
        }

        const formatarTempo = (s) => {
            const mins = Math.floor(s / 60);
            const segs = s % 60;
            return `${mins}:${segs.toString().padStart(2, '0')}`;
        };

        const getBarra = (progresso) => {
            const tamanho = 10;
            const preenchido = Math.round(progresso * tamanho);
            const vazio = tamanho - preenchido;
            const cor = progresso > 0.6 ? '🟩' : progresso > 0.3 ? '🟨' : '🟥';
            return cor.repeat(preenchido) + '⬜'.repeat(vazio);
        };

        const totalSegundos = input;
        let restantes = totalSegundos;

        const { key } = await sock.sendMessage(jid, { 
            text: `┌── [ TEMPORIZADOR ]\n│ ⏳ Tempo: ${formatarTempo(restantes)}\n│ ${getBarra(1)}\n└────────────────` 
        });

        const timer = setInterval(async () => {
            restantes--;
            const progresso = restantes / totalSegundos;

            if (restantes <= 0) {
                clearInterval(timer);
                await sock.sendMessage(jid, { 
                    text: `┌── [ TEMPORIZADOR ]\n│ ✅ STATUS: FINALIZADO!\n│ ${getBarra(0)}\n└────────────────`,
                    edit: key 
                });
                return;
            }

            try {
                await sock.sendMessage(jid, { 
                    text: `┌── [ TEMPORIZADOR ]\n│ ⏳ Tempo: ${formatarTempo(restantes)}\n│ ${getBarra(progresso)}\n└────────────────`,
                    edit: key 
                });
            } catch (e) {
                clearInterval(timer);
            }
        }, 1000);
    }
};