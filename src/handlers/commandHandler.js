const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbs = {
    dbParcerias: new Database(path.join(dbDir, 'parcerias.db')),
    dbUsuarios: new Database(path.join(dbDir, 'usuarios.db'))
};

dbs.dbUsuarios.prepare(`CREATE TABLE IF NOT EXISTS muted_users (jid TEXT, groupId TEXT, PRIMARY KEY (jid, groupId))`).run();
dbs.dbUsuarios.prepare(`CREATE TABLE IF NOT EXISTS afk_users (jid TEXT PRIMARY KEY, reason TEXT, time INTEGER)`).run();
dbs.dbParcerias.prepare(`CREATE TABLE IF NOT EXISTS parcerias (parceiro_id TEXT PRIMARY KEY, autor TEXT, limite_envios INTEGER, envios_restantes INTEGER, info TEXT)`).run();

const commands = new Map();
const prefix = '!';

const getGroupAdmins = (participants) => {
    return participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
};

function readCommands(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            readCommands(fullPath);
        } else if (file.endsWith('.js')) {
            const command = require(fullPath);
            if (command.name !== undefined) commands.set(command.name.toLowerCase(), command);
        }
    }
}
readCommands(path.join(__dirname, '../commands'));

async function handleCommands(sock, m) {
    try {
        const remoteJid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || "";

        const isMuted = dbs.dbUsuarios.prepare('SELECT * FROM muted_users WHERE jid = ? AND groupId = ?').get(sender, remoteJid);
        if (isMuted) return await sock.sendMessage(remoteJid, { delete: m.key });

        const containsLink = /(https?:\/\/[^\s]+)/g.test(messageText);
        if (containsLink && isGroup) {
            const parceria = dbs.dbParcerias.prepare('SELECT * FROM parcerias WHERE parceiro_id = ?').get(sender);
            const saldo = parceria ? Number(parceria.envios_restantes) : 0;
            if (!parceria || saldo <= 0) {
                await sock.sendMessage(remoteJid, { delete: m.key });
                const msgL = await sock.sendMessage(remoteJid, { text: `⚠️ @${sender.split('@')[0]}, sem créditos (${saldo}/${parceria ? parceria.limite_envios : 0}).`, mentions: [sender] });
                return setTimeout(() => sock.sendMessage(remoteJid, { delete: msgL.key }).catch(e=>e), 60000);
            } else {
                const novoSaldo = saldo - 1;
                dbs.dbParcerias.prepare('UPDATE parcerias SET envios_restantes = ? WHERE parceiro_id = ?').run(novoSaldo, sender);
                const msgP = await sock.sendMessage(remoteJid, { text: `✅ *LINK PERMITIDO*\n\n[#] Créditos: ${novoSaldo}/${parceria.limite_envios}`, mentions: [sender] });
                return setTimeout(() => sock.sendMessage(remoteJid, { delete: msgP.key }).catch(e=>e), 60000);
            }
        }

        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        for (let jid of mentioned) {
            const isAfk = dbs.dbUsuarios.prepare('SELECT * FROM afk_users WHERE jid = ?').get(jid);
            if (isAfk) {
                await sock.sendMessage(remoteJid, { react: { text: "💤", key: m.key } });
                const msgA = await sock.sendMessage(remoteJid, { text: `💤 @${jid.split('@')[0]} está ausente.\n📝 Motivo: ${isAfk.reason}`, mentions: [jid] }, { quoted: m });
                setTimeout(() => sock.sendMessage(remoteJid, { delete: msgA.key }).catch(e=>e), 60000);
            }
        }

        if (!messageText.startsWith(prefix)) return;
        const args = messageText.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase() || '';
        const command = commands.get(commandName);

        if (command) {
            let isAdmin = false;
            if (isGroup) {
                const groupMetadata = await sock.groupMetadata(remoteJid);
                const admins = getGroupAdmins(groupMetadata.participants);
                isAdmin = admins.includes(sender);
            }
            if (isGroup && !isAdmin && command.name !== '') {
                return await sock.sendMessage(remoteJid, { react: { text: "❌", key: m.key } });
            }
            await command.execute(sock, m, dbs, args);
        }
    } catch (e) {}
}
 
module.exports = { handleCommands, dbs, commands, readCommands };