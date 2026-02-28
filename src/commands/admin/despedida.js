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
                    },
                    farewell: {
                        enabled: false,
                        message: 'Até mais, {nome}! Sentiremos sua falta no {grupo}! 👋',
                        caption: '',
                        autoDelete: 0,
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
                message: 'Olá {nome}, seja bem-vindo(a) ao {grupo}! 👋',
                image: null,
                caption: '',
                autoDelete: 0
            };
        }
        
        if (!config.settings.farewell) {
            config.settings.farewell = {
                enabled: false,
                message: 'Até mais, {nome}! Sentiremos sua falta no {grupo}! 👋',
                caption: '',
                autoDelete: 0,
                withMention: true,
                withReason: true
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
                },
                farewell: {
                    enabled: false,
                    message: 'Até mais, {nome}! Sentiremos sua falta no {grupo}! 👋',
                    caption: '',
                    autoDelete: 0,
                    withMention: true,
                    withReason: true
                }
            }
        };
    }
}

function saveConfig(config) {
    fs.writeFileSync(dbPath, JSON.stringify(config, null, 2));
    console.log('Configuração salva em:', dbPath);
}

function getCurrentHour() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

module.exports = {
    name: 'despedida',
    async execute(sock, m, dbs, args) {
        try {
            const remoteJid = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid;
            const isGroup = remoteJid.endsWith('@g.us');
            
            if (!isGroup) {
                await sock.sendMessage(remoteJid, { 
                    text: '❌ Este comando só pode ser usado em grupos.' 
                }, { quoted: m });
                return;
            }

            const groupMetadata = await sock.groupMetadata(remoteJid);
            const isAdmin = groupMetadata.participants.some(p => 
                (p.id === sender) && (p.admin === 'admin' || p.admin === 'superadmin')
            );

            if (!isAdmin) {
                await sock.sendMessage(remoteJid, { 
                    text: '❌ Apenas administradores podem usar este comando.' 
                }, { quoted: m });
                return;
            }

            const config = loadConfig();
            
            if (!args.length) {
                const status = config.settings.farewell.enabled ? '✅ ATIVADO' : '❌ DESATIVADO';
                const mencao = config.settings.farewell.withMention ? '✅ Sim' : '❌ Não';
                const motivo = config.settings.farewell.withReason ? '✅ Sim' : '❌ Não';
                
                const texto = [
                    '┌── [ 📢 DESPEDIDA ]',
                    `│ Status: ${status}`,
                    `│ Mensagem: ${config.settings.farewell.message || 'Não configurada'}`,
                    `│ Auto-deletar: ${config.settings.farewell.autoDelete || 0}s`,
                    `│ Com menção: ${mencao}`,
                    `│ Mostrar motivo: ${motivo}`,
                    '│',
                    '│ Comandos:',
                    '│ !despedida on  - Ativar',
                    '│ !despedida off - Desativar',
                    '│ !despedida msg <texto> - Configurar mensagem',
                    '│ !despedida delete <segundos> - Auto-deletar',
                    '│ !despedida mencao on/off - Menção',
                    '│ !despedida motivo on/off - Motivo da saída',
                    '└──────────────────────────'
                ].join('\n');
                
                await sock.sendMessage(remoteJid, { text: texto }, { quoted: m });
                return;
            }

            const subCommand = args[0].toLowerCase();

            if (subCommand === 'on') {
                config.settings.farewell.enabled = true;
                saveConfig(config);
                
                await sock.sendMessage(remoteJid, { 
                    text: '✅ *Sistema de despedida ativado!*\n\nMensagens de despedida serão enviadas quando membros saírem.' 
                }, { quoted: m });

            } else if (subCommand === 'off') {
                config.settings.farewell.enabled = false;
                saveConfig(config);
                
                await sock.sendMessage(remoteJid, { 
                    text: '❌ *Sistema de despedida desativado!*\n\nNão serão enviadas mensagens de despedida.' 
                }, { quoted: m });

            } else if (subCommand === 'msg') {
                const novaMensagem = args.slice(1).join(' ');
                if (!novaMensagem) {
                    await sock.sendMessage(remoteJid, { 
                        text: '❌ Digite a mensagem após o comando.\nExemplo: !despedida msg Até mais {nome}, volte sempre!' 
                    }, { quoted: m });
                    return;
                }
                
                config.settings.farewell.message = novaMensagem;
                saveConfig(config);
                
                await sock.sendMessage(remoteJid, { 
                    text: `✅ *Mensagem de despedida atualizada!*\n\nNova mensagem: ${novaMensagem}` 
                }, { quoted: m });

            } else if (subCommand === 'delete') {
                const segundos = parseInt(args[1]);
                if (isNaN(segundos) || segundos < 0) {
                    await sock.sendMessage(remoteJid, { 
                        text: '❌ Digite um número válido de segundos.\nExemplo: !despedida delete 60' 
                    }, { quoted: m });
                    return;
                }
                
                config.settings.farewell.autoDelete = segundos;
                saveConfig(config);
                
                const texto = segundos === 0 
                    ? '❌ Auto-deletar desativado. As mensagens não serão apagadas.'
                    : `✅ Mensagens serão apagadas após *${segundos} segundos*.`;
                
                await sock.sendMessage(remoteJid, { text: texto }, { quoted: m });

            } else if (subCommand === 'mencao') {
                const opcao = args[1]?.toLowerCase();
                if (!opcao || (opcao !== 'on' && opcao !== 'off')) {
                    await sock.sendMessage(remoteJid, { 
                        text: '❌ Use: !despedida mencao on ou !despedida mencao off' 
                    }, { quoted: m });
                    return;
                }
                
                config.settings.farewell.withMention = opcao === 'on';
                saveConfig(config);
                
                await sock.sendMessage(remoteJid, { 
                    text: `✅ *Menção ${opcao === 'on' ? 'ativada' : 'desativada'}!*\n\nOs usuários ${opcao === 'on' ? 'serão' : 'não serão'} mencionados na mensagem.` 
                }, { quoted: m });

            } else if (subCommand === 'motivo') {
                const opcao = args[1]?.toLowerCase();
                if (!opcao || (opcao !== 'on' && opcao !== 'off')) {
                    await sock.sendMessage(remoteJid, { 
                        text: '❌ Use: !despedida motivo on ou !despedida motivo off' 
                    }, { quoted: m });
                    return;
                }
                
                config.settings.farewell.withReason = opcao === 'on';
                saveConfig(config);
                
                await sock.sendMessage(remoteJid, { 
                    text: `✅ *Motivo da saída ${opcao === 'on' ? 'ativado' : 'desativado'}!*\n\n${opcao === 'on' ? 'Será mostrado se foi removido ou saiu.' : 'Não será mostrado o motivo da saída.'}` 
                }, { quoted: m });

            } else {
                await sock.sendMessage(remoteJid, { 
                    text: '❌ Comando inválido! Use: !despedida on/off/msg/delete/mencao/motivo' 
                }, { quoted: m });
            }
            
        } catch (error) {
            console.error('Erro no comando !despedida:', error);
            await sock.sendMessage(m.key.remoteJid, { 
                text: '❌ Erro ao executar o comando. Tente novamente.' 
            }, { quoted: m });
        }
    }
};