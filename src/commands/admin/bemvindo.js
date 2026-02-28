const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../../database.json');

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
                        message: 'Olá {nome}, seja bem-vindo(a) ao {grupo}! 👋',
                        image: null,
                        caption: '',
                        autoDelete: 0
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
                message: 'Olá {nome}, seja bem-vindo(a) ao {grupo}! 👋',
                image: null,
                caption: '',
                autoDelete: 0
            };
        }
        
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
                    message: 'Olá {nome}, seja bem-vindo(a) ao {grupo}! 👋',
                    image: null,
                    caption: '',
                    autoDelete: 0
                }
            }
        };
    }
}

function saveConfig(config) {
    fs.writeFileSync(dbPath, JSON.stringify(config, null, 2));
    console.log('Configuração salva em:', dbPath);
}

module.exports = {
    name: 'bemvindo',
    async execute(sock, m, dbs, args) {
        const remoteJid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        
        if (!isGroup) {
            return await sock.sendMessage(remoteJid, { 
                text: '❌ Este comando só pode ser usado em grupos.' 
            }, { quoted: m });
        }

        const groupMetadata = await sock.groupMetadata(remoteJid);
        const isAdmin = groupMetadata.participants.some(p => 
            (p.id === sender) && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        if (!isAdmin) {
            return await sock.sendMessage(remoteJid, { 
                text: '❌ Apenas administradores podem usar este comando.' 
            }, { quoted: m });
        }

        const config = loadConfig();
        
        if (!args.length) {
            const status = config.settings.welcome.enabled ? '✅ ATIVADO' : '❌ DESATIVADO';
            const texto = [
                '┌── [ 📢 BEM-VINDO ]',
                `│ Status: ${status}`,
                `│ Mensagem: ${config.settings.welcome.message || 'Não configurada'}`,
                `│ Auto-deletar: ${config.settings.welcome.autoDelete || 0}s`,
                '│',
                '│ Comandos:',
                '│ !bemvindo on  - Ativar',
                '│ !bemvindo off - Desativar',
                '│ !bemvindo msg <texto> - Configurar mensagem',
                '│ !bemvindo delete <segundos> - Auto-deletar',
                '└──────────────────────────'
            ].join('\n');
            
            return await sock.sendMessage(remoteJid, { text: texto }, { quoted: m });
        }

        const subCommand = args[0].toLowerCase();

        if (subCommand === 'on') {
            config.settings.welcome.enabled = true;
            saveConfig(config);
            
            await sock.sendMessage(remoteJid, { 
                text: '✅ *Sistema de boas-vindas ativado!*\n\nAs mensagens de boas-vindas serão enviadas quando novos membros entrarem.' 
            }, { quoted: m });

        } else if (subCommand === 'off') {
            config.settings.welcome.enabled = false;
            saveConfig(config);
            
            await sock.sendMessage(remoteJid, { 
                text: '❌ *Sistema de boas-vindas desativado!*\n\nNão serão enviadas mensagens de boas-vindas.' 
            }, { quoted: m });

        } else if (subCommand === 'msg') {
            const novaMensagem = args.slice(1).join(' ');
            if (!novaMensagem) {
                return await sock.sendMessage(remoteJid, { 
                    text: '❌ Digite a mensagem após o comando.\nExemplo: !bemvindo msg Olá {nome}, seja bem-vindo!' 
                }, { quoted: m });
            }
            
            config.settings.welcome.message = novaMensagem;
            saveConfig(config);
            
            await sock.sendMessage(remoteJid, { 
                text: `✅ *Mensagem de boas-vindas atualizada!*\n\nNova mensagem: ${novaMensagem}` 
            }, { quoted: m });

        } else if (subCommand === 'delete') {
            const segundos = parseInt(args[1]);
            if (isNaN(segundos) || segundos < 0) {
                return await sock.sendMessage(remoteJid, { 
                    text: '❌ Digite um número válido de segundos.\nExemplo: !bemvindo delete 60' 
                }, { quoted: m });
            }
            
            config.settings.welcome.autoDelete = segundos;
            saveConfig(config);
            
            const texto = segundos === 0 
                ? '❌ Auto-deletar desativado. As mensagens não serão apagadas.'
                : `✅ Mensagens serão apagadas após *${segundos} segundos*.`;
            
            await sock.sendMessage(remoteJid, { text: texto }, { quoted: m });

        } else {
            await sock.sendMessage(remoteJid, { 
                text: '❌ Comando inválido! Use: !bemvindo on/off/msg/delete' 
            }, { quoted: m });
        }
    }
};