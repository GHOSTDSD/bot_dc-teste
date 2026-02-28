const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { handleCommands, commands } = require('./handlers/commandHandler');
const { initializeSchedules } = require('./handlers/scheduler');
const { Boom } = require('@hapi/boom');
const qrcodeTerminal = require('qrcode-terminal');
const gradient = require('gradient-string').default;
const pino = require('pino');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const dbPath = path.join(__dirname, '../database.json');
const authPath = 'auth_info_baileys';

app.use(express.static(path.join(__dirname, '../private')));

const aresBanner = `
    █████╗ ██████╗ ███████╗██████╗ 
   ██╔══██╗██╔══██╗██╔════╝██╔══██╗
   ███████║██████╔╝█████╗  ██████╔╝
   ██╔══██║██╔══██╗██╔══╝  ██╔══██╗
   ██║  ██║██║  ██║███████╗██║  ██║
   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ v2.0
`;

function getCurrentHour() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

function loadConfig() {
    try {
        if (!fs.existsSync(dbPath)) {
            const defaultConfig = { 
                groups: {}, 
                commands: {},
                settings: { 
                    prefix: '!', 
                    autodelete: false, 
                    antilink: false,
                    welcome: {
                        enabled: false,
                        message: 'Olá {nome}, seja bem-vindo(a) ao {grupo}! às {hour} 👋',
                        caption: '',
                        autoDelete: 0,
                        withImage: false,
                        imageUrl: null
                    },
                    farewell: {
                        enabled: false,
                        message: 'Até mais, {nome}. Sentiremos sua falta no {grupo}! às {hour} 👋',
                        caption: '',
                        autoDelete: 0,
                        withImage: false,
                        imageUrl: null,
                        withMention: true,
                        withReason: true
                    }
                }
            };
            fs.writeFileSync(dbPath, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }
        
        const config = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        
        if (!config.settings) {
            config.settings = { 
                prefix: '!', 
                autodelete: false, 
                antilink: false 
            };
        }
        
        if (!config.settings.welcome) {
            config.settings.welcome = {
                enabled: false,
                message: 'Olá {nome}, seja bem-vindo(a) ao {grupo}! às {hour} 👋',
                caption: '',
                autoDelete: 0,
                withImage: false,
                imageUrl: null
            };
        } else {
            if (config.settings.welcome.withImage === undefined) {
                config.settings.welcome.withImage = false;
            }
            if (config.settings.welcome.imageUrl === undefined) {
                config.settings.welcome.imageUrl = null;
            }
            if (config.settings.welcome.caption === undefined) {
                config.settings.welcome.caption = '';
            }
        }
        
        if (!config.settings.farewell) {
            config.settings.farewell = {
                enabled: false,
                message: 'Até mais, {nome}. Sentiremos sua falta no {grupo}! às {hour} 👋',
                caption: '',
                autoDelete: 0,
                withImage: false,
                imageUrl: null,
                withMention: true,
                withReason: true
            };
        } else {
            if (config.settings.farewell.withImage === undefined) {
                config.settings.farewell.withImage = false;
            }
            if (config.settings.farewell.imageUrl === undefined) {
                config.settings.farewell.imageUrl = null;
            }
            if (config.settings.farewell.caption === undefined) {
                config.settings.farewell.caption = '';
            }
        }
        
        fs.writeFileSync(dbPath, JSON.stringify(config, null, 2));
        return config;
        
    } catch (error) {
        console.error('Erro ao carregar config:', error);
        return { 
            groups: {}, 
            commands: {},
            settings: { 
                prefix: '!', 
                autodelete: false, 
                antilink: false,
                welcome: {
                    enabled: false,
                    message: 'Olá {nome}, seja bem-vindo(a) ao {grupo}! às {hour} 👋',
                    caption: '',
                    autoDelete: 0,
                    withImage: false,
                    imageUrl: null
                },
                farewell: {
                    enabled: false,
                    message: 'Até mais, {nome}. Sentiremos sua falta no {grupo}! às {hour} 👋',
                    caption: '',
                    autoDelete: 0,
                    withImage: false,
                    imageUrl: null,
                    withMention: true,
                    withReason: true
                }
            }
        };
    }
}

let botConfig = loadConfig();
let groupsCache = [];
let isConnected = false;
let messageCount = 0;
let startTime = Date.now();
let sock = null;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({ 
        version,
        auth: state, 
        logger: pino({ level: 'silent' }), 
        browser: ['AresBot', 'Chrome', '1.0.0'],
        printQRInTerminal: false 
    });

    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) { 
            console.clear();
            console.log(gradient(['#00FFFF', '#0080FF']).multiline(aresBanner));
            qrcodeTerminal.generate(qr, { small: true });
            io.emit('qr_code', qr); 
        }
        
        if (connection === 'open') {
            isConnected = true;
            console.clear();
            console.log(gradient(['#00FFFF', '#0080FF']).multiline(aresBanner));
            console.log(gradient(['#00FFFF', '#0080FF'])(" > AresBot Online!"));
            
            initializeSchedules(sock);
            
            const fetchGroups = await sock.groupFetchAllParticipating();
            groupsCache = Object.values(fetchGroups).map(v => ({ 
                id: v.id, 
                subject: v.subject, 
                members: v.participants.length,
                monitored: botConfig.groups && botConfig.groups[v.id] ? botConfig.groups[v.id] : false
            }));
            
            io.emit('bot_online', { 
                config: botConfig, 
                groups: groupsCache, 
                commandsList: Array.from(commands.values()),
                connected: true,
                stats: { messages: messageCount, uptime: Math.floor((Date.now() - startTime) / 1000) }
            });
        }
        
        if (connection === 'close') {
            isConnected = false;
            const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const reason = Object.keys(DisconnectReason).find(key => DisconnectReason[key] === code);
            
            console.log(gradient(['#FF0000', '#FF5500'])(` > Conexão encerrada: ${reason || code}`));

            if (code === DisconnectReason.loggedOut) {
                console.log(gradient(['#FF0000', '#FF5500'])(" > Sessão finalizada. Limpando dados..."));
                if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });
                setTimeout(connectToWhatsApp, 3000);
            } else {
                console.log(" > Tentando reconectar automaticamente...");
                setTimeout(connectToWhatsApp, 5000);
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => { 
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        messageCount++;
        
        const text = m.message.conversation || m.message.extendedTextMessage?.text || 'Mídia/Outro';
        io.emit('new_activity', {
            title: 'Nova mensagem',
            description: text.substring(0, 30)
        });

        await handleCommands(sock, m, botConfig, fs, dbPath, loadConfig); 
    });

    sock.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update;
            
            const participantIds = participants.map(p => {
                if (typeof p === 'string') return p;
                if (p && typeof p === 'object' && p.id) return p.id;
                return null;
            }).filter(p => p !== null);
    
            console.log(gradient(['#00FFFF', '#0080FF'])(` > Evento: ${action} - Grupo: ${id} - Participantes: ${participantIds.join(', ')}`));
            
            botConfig = loadConfig();
            
            if (action === 'add') {
                const welcomeEnabled = botConfig && 
                                      botConfig.settings && 
                                      botConfig.settings.welcome && 
                                      botConfig.settings.welcome.enabled === true;
                    
                if (welcomeEnabled) {
                    const groupMetadata = await sock.groupMetadata(id);
                    const groupName = groupMetadata.subject || 'Grupo';
                    
                    for (const participantId of participantIds) {
                        try {
                            let msg = botConfig.settings.welcome.message || 'Olá {nome}, seja bem-vindo(a) ao {grupo}! às {hour} 👋';
                            const participantName = participantId.split('@')[0];
                            const currentHour = getCurrentHour();
                            
                            msg = msg.replace(/{nome}/g, `@${participantName}`);
                            msg = msg.replace(/{grupo}/g, groupName);
                            msg = msg.replace(/{hour}/g, currentHour);
                            
                            if (botConfig.settings.welcome.withImage) {
                                if (botConfig.settings.welcome.imageUrl) {
                                    try {
                                        const imageBuffer = await new Promise((resolve, reject) => {
                                            https.get(botConfig.settings.welcome.imageUrl, (response) => {
                                                const chunks = [];
                                                response.on('data', (chunk) => chunks.push(chunk));
                                                response.on('end', () => resolve(Buffer.concat(chunks)));
                                                response.on('error', reject);
                                            });
                                        });
                                        
                                        await sock.sendMessage(id, { 
                                            image: imageBuffer,
                                            caption: msg,
                                            mentions: [participantId]
                                        });
                                        
                                    } catch (imageError) {
                                        await sendProfilePicture(sock, id, participantId, msg, botConfig.settings.welcome);
                                    }
                                } else {
                                    await sendProfilePicture(sock, id, participantId, msg, botConfig.settings.welcome);
                                }
                            } else {
                                const sentMsg = await sock.sendMessage(id, { 
                                    text: msg,
                                    mentions: [participantId]
                                });
                                
                                if (botConfig.settings.welcome.autoDelete > 0) {
                                    setTimeout(() => {
                                        sock.sendMessage(id, { delete: sentMsg.key }).catch(e => {});
                                    }, botConfig.settings.welcome.autoDelete * 1000);
                                }
                            }
                        } catch (participantError) {
                            console.error('Erro ao processar participante:', participantError);
                        }
                    }
                }
            } else if (action === 'remove') {
                const farewellEnabled = botConfig && 
                                       botConfig.settings && 
                                       botConfig.settings.farewell && 
                                       botConfig.settings.farewell.enabled === true;
                    
                if (farewellEnabled) {
                    console.log('Despedida ativada! Enviando mensagem...');
                    
                    const groupMetadata = await sock.groupMetadata(id);
                    const groupName = groupMetadata.subject || 'Grupo';
                    
                    for (const participantId of participantIds) {
                        try {
                            let msg = botConfig.settings.farewell.message || 'Até mais, {nome}. Sentiremos sua falta no {grupo}! às {hour} 👋';
                            const participantName = participantId.split('@')[0];
                            const currentHour = getCurrentHour();
                            
                            msg = msg.replace(/{nome}/g, participantName);
                            msg = msg.replace(/{grupo}/g, groupName);
                            msg = msg.replace(/{hour}/g, currentHour);
                            
                            const mentions = [];
                            if (botConfig.settings.farewell.withMention) {
                                mentions.push(participantId);
                                msg = msg.replace(participantName, `@${participantName}`);
                            }
                            
                            let finalMsg = msg;
                           
                            
                            console.log(`Enviando despedida para grupo ${id}:`, finalMsg);
                            
                            if (botConfig.settings.farewell.withImage) {
                                if (botConfig.settings.farewell.imageUrl) {
                                    try {
                                        const imageBuffer = await new Promise((resolve, reject) => {
                                            https.get(botConfig.settings.farewell.imageUrl, (response) => {
                                                const chunks = [];
                                                response.on('data', (chunk) => chunks.push(chunk));
                                                response.on('end', () => resolve(Buffer.concat(chunks)));
                                                response.on('error', reject);
                                            });
                                        });
                                        
                                        await sock.sendMessage(id, { 
                                            image: imageBuffer,
                                            caption: finalMsg,
                                            mentions: mentions
                                        });
                                        
                                    } catch (imageError) {
                                        const sentMsg = await sock.sendMessage(id, { 
                                            text: finalMsg,
                                            mentions: mentions
                                        });
                                        
                                        if (botConfig.settings.farewell.autoDelete > 0) {
                                            setTimeout(() => {
                                                sock.sendMessage(id, { delete: sentMsg.key }).catch(e => {});
                                            }, botConfig.settings.farewell.autoDelete * 1000);
                                        }
                                    }
                                } else {
                                    await sendProfilePicture(sock, id, participantId, finalMsg, botConfig.settings.farewell);
                                }
                            } else {
                                const sentMsg = await sock.sendMessage(id, { 
                                    text: finalMsg,
                                    mentions: mentions
                                });
                                
                                if (botConfig.settings.farewell.autoDelete > 0) {
                                    setTimeout(() => {
                                        sock.sendMessage(id, { delete: sentMsg.key }).catch(e => {});
                                    }, botConfig.settings.farewell.autoDelete * 1000);
                                }
                            }
                        } catch (participantError) {
                            console.error('Erro ao processar saída:', participantError);
                        }
                    }
                } else {
                    console.log('Despedida está desativada');
                }
            }
        } catch (error) {
            console.error('Erro no evento group-participants.update:', error);
        }
    });
}

async function sendProfilePicture(sock, groupId, participantId, msg, config) {
    try {
        const participantName = participantId.split('@')[0];
        const profilePic = await sock.profilePictureUrl(participantId, 'image');
        
        const imageBuffer = await new Promise((resolve, reject) => {
            https.get(profilePic, (response) => {
                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => resolve(Buffer.concat(chunks)));
                response.on('error', reject);
            });
        });
        
        const mentions = msg.includes('@') ? [participantId] : [];
        
        await sock.sendMessage(groupId, { 
            image: imageBuffer,
            caption: msg,
            mentions: mentions
        });
        
    } catch (profileError) {
        const sentMsg = await sock.sendMessage(groupId, { 
            text: msg,
            mentions: msg.includes('@') ? [participantId] : []
        });
        
        if (config.autoDelete > 0) {
            setTimeout(() => {
                sock.sendMessage(groupId, { delete: sentMsg.key }).catch(e => {});
            }, config.autoDelete * 1000);
        }
    }
}

io.on('connection', (socket) => {
    console.log('Cliente conectado ao dashboard');
    
    if (isConnected) {
        socket.emit('bot_online', { 
            config: botConfig, 
            groups: groupsCache, 
            commandsList: Array.from(commands.values()),
            connected: true,
            stats: { messages: messageCount, uptime: Math.floor((Date.now() - startTime) / 1000) }
        });
    }

    socket.on('toggle_command', (data) => {
        botConfig = loadConfig();
        if (!botConfig.commands) botConfig.commands = {};
        botConfig.commands[data.name] = data.status;
        fs.writeFileSync(dbPath, JSON.stringify(botConfig, null, 2));
        io.emit('realtime_update', { config: botConfig, groups: groupsCache, commandsList: Array.from(commands.values()) });
    });

    socket.on('toggle_group', (data) => {
        botConfig = loadConfig();
        if (!botConfig.groups) botConfig.groups = {};
        botConfig.groups[data.id] = data.status;
        fs.writeFileSync(dbPath, JSON.stringify(botConfig, null, 2));
        groupsCache = groupsCache.map(g => g.id === data.id ? { ...g, monitored: data.status } : g);
        io.emit('realtime_update', { config: botConfig, groups: groupsCache, commandsList: Array.from(commands.values()) });
    });

    socket.on('delete_command', (name) => {
        botConfig = loadConfig();
        if (botConfig.commands) delete botConfig.commands[name];
        commands.delete(name);
        fs.writeFileSync(dbPath, JSON.stringify(botConfig, null, 2));
        io.emit('realtime_update', { config: botConfig, groups: groupsCache, commandsList: Array.from(commands.values()) });
    });

    socket.on('save_welcome_config', (welcomeConfig) => {
        try {
            botConfig = loadConfig();
            if (!botConfig.settings) botConfig.settings = {};
            if (!botConfig.settings.welcome) botConfig.settings.welcome = {};
            
            botConfig.settings.welcome = {
                enabled: welcomeConfig.enabled === true,
                message: welcomeConfig.message || 'Olá {nome}, seja bem-vindo(a) ao {grupo}! às {hour} 👋',
                caption: welcomeConfig.caption || '',
                autoDelete: welcomeConfig.autoDelete || 0,
                withImage: welcomeConfig.withImage === true,
                imageUrl: welcomeConfig.imageUrl || null
            };
            
            fs.writeFileSync(dbPath, JSON.stringify(botConfig, null, 2));
            
            io.emit('realtime_update', { config: botConfig });
            socket.emit('config_saved', { type: 'welcome', success: true });
            
        } catch (error) {
            console.error('Erro ao salvar welcome config:', error);
            socket.emit('config_saved', { type: 'welcome', success: false, error: error.message });
        }
    });
    
    socket.on('save_farewell_config', (farewellConfig) => {
        try {
            botConfig = loadConfig();
            if (!botConfig.settings) botConfig.settings = {};
            if (!botConfig.settings.farewell) botConfig.settings.farewell = {};
            
            botConfig.settings.farewell = {
                enabled: farewellConfig.enabled === true,
                message: farewellConfig.message || 'Até mais, {nome}. Sentiremos sua falta no {grupo}! às {hour} 👋',
                caption: farewellConfig.caption || '',
                autoDelete: farewellConfig.autoDelete || 0,
                withImage: farewellConfig.withImage === true,
                imageUrl: farewellConfig.imageUrl || null,
                withMention: farewellConfig.withMention === true,
                withReason: farewellConfig.withReason === true
            };
            
            fs.writeFileSync(dbPath, JSON.stringify(botConfig, null, 2));
            
            io.emit('realtime_update', { config: botConfig });
            socket.emit('config_saved', { type: 'farewell', success: true });
            
        } catch (error) {
            console.error('Erro ao salvar farewell config:', error);
            socket.emit('config_saved', { type: 'farewell', success: false, error: error.message });
        }
    });
});

server.listen(3000, () => {
    console.clear();
    console.log(gradient(['#00FFFF', '#0080FF']).multiline(aresBanner));
    console.log(gradient(['#00FFFF', '#0080FF'])(' > Dashboard: http://localhost:3000'));
    console.log('Database path:', dbPath);
    connectToWhatsApp();
});