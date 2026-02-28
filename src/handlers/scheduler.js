const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const schedulesPath = path.join(__dirname, '../schedules.json');
const activeJobs = new Map();

function loadSchedules() {
    try {
        if (fs.existsSync(schedulesPath)) {
            return JSON.parse(fs.readFileSync(schedulesPath, 'utf-8'));
        }
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
    }
    return [];
}

function saveSchedules(schedules) {
    try {
        fs.writeFileSync(schedulesPath, JSON.stringify(schedules, null, 2));
    } catch (error) {
        console.error('Erro ao salvar agendamentos:', error);
    }
}

function scheduleGroupAction(sock, jid, time, action) {
    const jobId = `${jid}_${time}_${action}`;
    
    if (activeJobs.has(jobId)) {
        activeJobs.get(jobId).stop();
        activeJobs.delete(jobId);
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    const cronExp = `${minutes} ${hours} * * *`;
    
    console.log(`[SCHEDULER] Agendando ${action} para ${jid} às ${time}`);
    
    const job = cron.schedule(cronExp, async () => {
        try {
            console.log(`[CRON] Executando ${action} em ${jid} às ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
            
            if (action === 'close') {
                await sock.groupSettingUpdate(jid, 'announcement');
                await sock.sendMessage(jid, { 
                    text: `🔒 *Fechamento automático*\n\nO grupo foi fechado conforme agendado às ${time}.` 
                });
                console.log(`[SUCESSO] Grupo fechado: ${jid}`);
            } else if (action === 'open') {
                await sock.groupSettingUpdate(jid, 'not_announcement');
                await sock.sendMessage(jid, { 
                    text: `🔓 *Abertura automática*\n\nO grupo foi aberto conforme agendado às ${time}.` 
                });
                console.log(`[SUCESSO] Grupo aberto: ${jid}`);
            }
        } catch (error) {
            console.error(`[ERRO] Falha ao executar ${action} em ${jid}:`, error.message);
        }
    }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    });
    
    activeJobs.set(jobId, job);
    return job;
}

function initializeSchedules(sock) {
    const schedules = loadSchedules();
    schedules.forEach(s => {
        scheduleGroupAction(sock, s.jid, s.time, s.action);
    });
    console.log(`[SCHEDULER] ${schedules.length} agendamentos carregados`);
}

function addSchedule(jid, time, action) {
    const schedules = loadSchedules();
    schedules.push({ jid, time, action });
    saveSchedules(schedules);
}

function removeSchedules(jid) {
    const schedules = loadSchedules();
    const newSchedules = schedules.filter(s => s.jid !== jid);
    saveSchedules(newSchedules);
    
    for (const [key, job] of activeJobs.entries()) {
        if (key.startsWith(jid)) {
            job.stop();
            activeJobs.delete(key);
        }
    }
}

function getSchedules(jid) {
    const schedules = loadSchedules();
    return schedules.filter(s => s.jid === jid);
}

module.exports = {
    initializeSchedules,
    scheduleGroupAction,
    addSchedule,
    removeSchedules,
    getSchedules,
    activeJobs
};