const chalk = require('chalk');
const { scheduleGroupAction, addSchedule, removeSchedules, getSchedules } = require('../../handlers/scheduler');

module.exports = {
    name: 'closegp',
    category: 'admin',
    
    async execute(sock, m, dbs, args) {
        const jid = m.key.remoteJid;
        
        if (!jid.endsWith('@g.us')) {
            await sock.sendMessage(jid, { 
                text: '❌ Este comando só pode ser usado em grupos.' 
            }, { quoted: m });
            return;
        }

        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        
        const userId = (m.key.participant || m.key.remoteJid).split('@')[0];
        const adminIds = participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.id.split('@')[0]);

        const isUserAdmin = adminIds.includes(userId);
        if (!isUserAdmin) {
            await sock.sendMessage(jid, { 
                text: '❌ Apenas administradores podem usar este comando.' 
            }, { quoted: m });
            return;
        }

        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = participants.some(p => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (!isBotAdmin) {
            await sock.sendMessage(jid, { 
                text: '⚠️ *Aviso:* O bot não é administrador.\nAgendamentos podem falhar.' 
            }, { quoted: m });
        }

        if (args.length === 0) {
            try {
                await sock.groupSettingUpdate(jid, 'announcement');
                await sock.sendMessage(jid, { 
                    text: '🔒 *Grupo fechado com sucesso!*\n\nAgora apenas administradores podem enviar mensagens.' 
                }, { quoted: m });
                console.log(chalk.green(`[CLOSEGP] Fechado por ${userId}`));
                return;
            } catch (e) {
                console.error('Erro ao fechar grupo:', e);
                await sock.sendMessage(jid, { 
                    text: '❌ Falha ao fechar. O bot precisa ser administrador do grupo.' 
                }, { quoted: m });
                return;
            }
        }

        if (args[0] === 'open') {
            try {
                await sock.groupSettingUpdate(jid, 'not_announcement');
                await sock.sendMessage(jid, { 
                    text: '🔓 *Grupo aberto com sucesso!*\n\nTodos os membros podem enviar mensagens.' 
                }, { quoted: m });
                console.log(chalk.green(`[CLOSEGP] Aberto por ${userId}`));
                return;
            } catch (e) {
                console.error('Erro ao abrir grupo:', e);
                await sock.sendMessage(jid, { 
                    text: '❌ Falha ao abrir. O bot precisa ser administrador do grupo.' 
                }, { quoted: m });
                return;
            }
        }

        if (args[0] === 'list') {
            const schedules = getSchedules(jid);
            
            if (schedules.length === 0) {
                await sock.sendMessage(jid, { 
                    text: '📋 *Nenhum agendamento ativo.*' 
                }, { quoted: m });
                return;
            }
            
            let lista = '┌── [ 📋 AGENDAMENTOS ]\n';
            schedules.forEach(s => {
                const acao = s.action === 'close' ? '🔒 Fechar' : '🔓 Abrir';
                lista += `│ ${acao} às ${s.time}\n`;
            });
            lista += '└──────────────────────';
            
            await sock.sendMessage(jid, { text: lista }, { quoted: m });
            return;
        }

        if (args[0] === 'cancel') {
            removeSchedules(jid);
            await sock.sendMessage(jid, { 
                text: '✅ *Todos agendamentos cancelados.*' 
            }, { quoted: m });
            return;
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        
        if (!timeRegex.test(args[0])) {
            await sock.sendMessage(jid, { 
                text: '❌ Formato inválido! Use HH:MM\n\nExemplos:\n!closegp 17:05\n!closegp 17:05 08:00' 
            }, { quoted: m });
            return;
        }

        try {
            const horaFechar = args[0];
            
            scheduleGroupAction(sock, jid, horaFechar, 'close');
            addSchedule(jid, horaFechar, 'close');
            
            let mensagem = `┌── [ ✅ AGENDADO ]\n│ 🔒 Fechar: ${horaFechar}\n`;
            
            if (args[1] && timeRegex.test(args[1])) {
                const horaAbrir = args[1];
                
                scheduleGroupAction(sock, jid, horaAbrir, 'open');
                addSchedule(jid, horaAbrir, 'open');
                
                mensagem += `│ 🔓 Abrir: ${horaAbrir}\n`;
            }
            
            mensagem += `│ 📅 Repete diariamente\n└──────────────────`;
            
            await sock.sendMessage(jid, { text: mensagem }, { quoted: m });
            console.log(chalk.blue(`[SCHEDULE] Novo: ${args[0]} ${args[1] || ''} para ${jid}`));
            
        } catch (error) {
            console.error('Erro ao agendar:', error);
            await sock.sendMessage(jid, { 
                text: '❌ Erro ao processar agendamento.' 
            }, { quoted: m });
        }
    }
};