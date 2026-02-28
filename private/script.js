const socket = io();

socket.on('connect', () => {
    console.log('Socket conectado ao servidor! ID:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('Erro de conexão socket:', error);
});

function activate(page) {
    document.querySelectorAll('.nav-a, .bn-item').forEach(n => n.classList.remove('on'));
    document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
    document.querySelectorAll(`[data-page="${page}"]`).forEach(n => n.classList.add('on'));
    document.getElementById('page-' + page)?.classList.add('on');
    document.getElementById('fab').classList.toggle('hide', page !== 'commands');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-a, .bn-item').forEach(i => {
    i.addEventListener('click', () => activate(i.dataset.page));
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('on'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('on'));
        btn.classList.add('on');
        document.getElementById('tab-' + btn.dataset.tab)?.classList.add('on');
    });
});

document.querySelectorAll('.cfg-card-head').forEach(head => {
    head.addEventListener('click', e => {
        if (e.target.closest('.pill')) return;
        const card = head.closest('.cfg-card');
        card.classList.toggle('open');
    });
});

document.querySelectorAll('.pill').forEach(pill => {
    if (pill.dataset.name && !pill.closest('#cmd-grid')) {
        pill.addEventListener('click', () => {
            pill.classList.toggle('on');
        });
    }
});

const welcomeWithImage = document.getElementById('welcome-with-image');
const welcomeImageSection = document.getElementById('welcome-image-section');
const welcomeImageStatus = document.getElementById('welcome-image-status');
const welcomeImageUrl = document.getElementById('welcome-image-url');
const welcomeUrlPreview = document.getElementById('welcome-url-preview');
const welcomeUrlPreviewImg = document.getElementById('welcome-url-preview-img');

if (welcomeWithImage) {
    welcomeWithImage.addEventListener('click', () => {
        welcomeWithImage.classList.toggle('on');
        const isActive = welcomeWithImage.classList.contains('on');
        
        welcomeImageSection.style.display = isActive ? 'block' : 'none';
        welcomeImageStatus.textContent = isActive ? 'Imagem personalizada ativada' : 'Imagem personalizada desativada';
        
        if (!isActive) {
            welcomeImageUrl.value = '';
            welcomeUrlPreview.style.display = 'none';
        }
    });
}

if (welcomeImageUrl) {
    welcomeImageUrl.addEventListener('input', function() {
        const url = this.value.trim();
        if (url) {
            welcomeUrlPreviewImg.src = url;
            welcomeUrlPreview.style.display = 'block';
            
            welcomeUrlPreviewImg.onerror = function() {
                welcomeUrlPreview.style.display = 'none';
                toast('Link da imagem inválido', 'err');
            };
        } else {
            welcomeUrlPreview.style.display = 'none';
        }
    });
}

const farewellWithImage = document.getElementById('farewell-with-image');
const farewellImageSection = document.getElementById('farewell-image-section');
const farewellImageStatus = document.getElementById('farewell-image-status');
const farewellImageUrl = document.getElementById('farewell-image-url');
const farewellUrlPreview = document.getElementById('farewell-url-preview');
const farewellUrlPreviewImg = document.getElementById('farewell-url-preview-img');

if (farewellWithImage) {
    farewellWithImage.addEventListener('click', () => {
        farewellWithImage.classList.toggle('on');
        const isActive = farewellWithImage.classList.contains('on');
        
        farewellImageSection.style.display = isActive ? 'block' : 'none';
        farewellImageStatus.textContent = isActive ? 'Imagem personalizada ativada' : 'Imagem personalizada desativada';
        
        if (!isActive) {
            farewellImageUrl.value = '';
            farewellUrlPreview.style.display = 'none';
        }
    });
}

if (farewellImageUrl) {
    farewellImageUrl.addEventListener('input', function() {
        const url = this.value.trim();
        if (url) {
            farewellUrlPreviewImg.src = url;
            farewellUrlPreview.style.display = 'block';
            
            farewellUrlPreviewImg.onerror = function() {
                farewellUrlPreview.style.display = 'none';
                toast('Link da imagem inválido', 'err');
            };
        } else {
            farewellUrlPreview.style.display = 'none';
        }
    });
}

function getCurrentHour() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

window.saveWelcomeConfig = function() {
    const enabled = document.getElementById('pill-welcome')?.classList.contains('on') || false;
    const message = document.getElementById('welcome-msg')?.value || 'Olá {nome}, seja bem-vindo(a) ao {grupo}! às {hour} 👋';
    const caption = document.getElementById('welcome-caption')?.value || '';
    const autoDelete = parseInt(document.getElementById('welcome-auto-delete')?.value) || 0;
    const withImage = document.getElementById('welcome-with-image')?.classList.contains('on') || false;
    const imageUrl = document.getElementById('welcome-image-url')?.value.trim() || null;
    
    const welcomeConfig = {
        enabled: enabled,
        message: message,
        caption: caption,
        autoDelete: autoDelete,
        withImage: withImage,
        imageUrl: imageUrl
    };
    
    socket.emit('save_welcome_config', welcomeConfig);
    toast('Enviando configuração...', 'ok');
};

window.saveFarewellConfig = function() {
    const enabled = document.getElementById('pill-farewell')?.classList.contains('on') || false;
    const message = document.getElementById('farewell-msg')?.value || 'Até mais, {nome}. Sentiremos sua falta no {grupo}! às {hour} 👋';
    const caption = document.getElementById('farewell-caption')?.value || '';
    const autoDelete = parseInt(document.getElementById('farewell-auto-delete')?.value) || 0;
    const withImage = document.getElementById('farewell-with-image')?.classList.contains('on') || false;
    const imageUrl = document.getElementById('farewell-image-url')?.value.trim() || null;
    const withMention = document.getElementById('farewell-mention')?.classList.contains('on') || false;
    const withReason = document.getElementById('farewell-reason')?.classList.contains('on') || false;
    
    const farewellConfig = {
        enabled: enabled,
        message: message,
        caption: caption,
        autoDelete: autoDelete,
        withImage: withImage,
        imageUrl: imageUrl,
        withMention: withMention,
        withReason: withReason
    };
    
    socket.emit('save_farewell_config', farewellConfig);
    toast('Configurações de despedida salvas!', 'ok');
};

window.openWhatsAppPreview = function(type) {
    const modal = document.getElementById('ov-wa-preview');
    const systemMsg = document.getElementById('wa-system-msg');
    const botMsg = document.getElementById('wa-bot-msg');
    const chat = document.getElementById('wa-chat');
    const waAvatar = document.querySelector('.wa-avatar');
    const currentHour = getCurrentHour();
    
    modal.classList.remove('hide');
    
    while (chat.children.length > 1) {
        chat.removeChild(chat.lastChild);
    }
    
    chat.appendChild(systemMsg);
    chat.appendChild(botMsg);
    
    waAvatar.textContent = '👤';
    
    if (type === 'welcome') {
        let msg = document.getElementById('welcome-msg')?.value || 'Olá {nome}, seja bem-vindo(a) ao {grupo}! às {hour} 👋';
        const caption = document.getElementById('welcome-caption')?.value || '';
        const autoDelete = document.getElementById('welcome-auto-delete')?.value || '0';
        const withImage = document.getElementById('welcome-with-image')?.classList.contains('on') || false;
        const imageUrl = document.getElementById('welcome-image-url')?.value.trim() || null;
        
        systemMsg.textContent = 'João entrou no grupo';
        
        if (autoDelete !== '0') {
            systemMsg.textContent += ` (mensagem será apagada em ${autoDelete}s)`;
        }
        
        msg = msg.replace(/{nome}/g, 'João').replace(/{grupo}/g, 'Grupo de Teste').replace(/{hour}/g, currentHour);
        
        if (withImage) {
            let finalContent = msg;
            
            if (imageUrl) {
                finalContent += `<br><img src="${imageUrl}" style="max-width: 100%; border-radius: 8px; margin: 8px 0; display: block;" onerror="this.src='https://ui-avatars.com/api/?name=João&size=200&background=3b7eff&color=fff&bold=true'">`;
            } else {
                finalContent += `<br><img src="https://ui-avatars.com/api/?name=João&size=200&background=3b7eff&color=fff&bold=true" style="max-width: 100%; border-radius: 8px; margin: 8px 0; display: block;">`;
            }
            
            if (caption) {
                finalContent += `<div style="font-size: 11px; color: var(--t3); margin-top: 4px; font-style: italic;">${caption}</div>`;
            }
            
            botMsg.innerHTML = `<span>${finalContent}</span><div class="wa-time">12:34</div>`;
        } else {
            botMsg.innerHTML = `<span>${msg}</span><div class="wa-time">12:34</div>`;
        }
        
    } else {
        let msg = document.getElementById('farewell-msg')?.value || 'Até mais, {nome}. Sentiremos sua falta no {grupo}! às {hour} 👋';
        const caption = document.getElementById('farewell-caption')?.value || '';
        const autoDelete = document.getElementById('farewell-auto-delete')?.value || '0';
        const withImage = document.getElementById('farewell-with-image')?.classList.contains('on') || false;
        const imageUrl = document.getElementById('farewell-image-url')?.value.trim() || null;
        const withMention = document.getElementById('farewell-mention')?.classList.contains('on');
        const withReason = document.getElementById('farewell-reason')?.classList.contains('on');
        
        if (withReason) {
            systemMsg.textContent = 'João saiu do grupo (foi removido)';
        } else {
            systemMsg.textContent = 'João saiu do grupo';
        }
        
        if (autoDelete !== '0') {
            systemMsg.textContent += ` (mensagem será apagada em ${autoDelete}s)`;
        }
        
        msg = msg.replace(/{nome}/g, withMention ? '@João' : 'João').replace(/{grupo}/g, 'Grupo de Teste').replace(/{hour}/g, currentHour);
        
        if (withImage) {
            let finalContent = msg;
            
            if (imageUrl) {
                finalContent += `<br><img src="${imageUrl}" style="max-width: 100%; border-radius: 8px; margin: 8px 0; display: block;" onerror="this.src='https://ui-avatars.com/api/?name=João&size=200&background=3b7eff&color=fff&bold=true'">`;
            } else {
                finalContent += `<br><img src="https://ui-avatars.com/api/?name=João&size=200&background=3b7eff&color=fff&bold=true" style="max-width: 100%; border-radius: 8px; margin: 8px 0; display: block;">`;
            }
            
            if (caption) {
                finalContent += `<div style="font-size: 11px; color: var(--t3); margin-top: 4px; font-style: italic;">${caption}</div>`;
            }
            
            botMsg.innerHTML = `<span>${finalContent}</span><div class="wa-time">12:34</div>`;
        } else {
            botMsg.innerHTML = `<span>${msg}</span><div class="wa-time">12:34</div>`;
        }
    }
    
    setTimeout(() => {
        chat.scrollTop = chat.scrollHeight;
    }, 100);
};

document.getElementById('ov-wa-preview').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hide');
    }
});

document.querySelector('.wa-send').addEventListener('click', function() {
    document.getElementById('ov-wa-preview').classList.add('hide');
});

socket.on('qr_code', qr => {
    document.getElementById('qr-loader').classList.add('hide');
    document.getElementById('qr-box').classList.remove('hide');
    document.getElementById('qr-img').src =
        `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qr)}`;
});

socket.on('bot_online', ({ config, groups, commandsList }) => {
    document.getElementById('ov-qr').classList.add('hide');
    document.getElementById('sb-status').textContent = 'Online';
    document.getElementById('top-status').textContent = 'Online';
    document.getElementById('lat').textContent = '24ms';
    
    if (config && config.settings) {
        if (config.settings.welcome) {
            document.getElementById('pill-welcome')?.classList.toggle('on', config.settings.welcome.enabled);
            
            if (config.settings.welcome.message) {
                document.getElementById('welcome-msg').value = config.settings.welcome.message;
            }
            if (config.settings.welcome.caption) {
                document.getElementById('welcome-caption').value = config.settings.welcome.caption;
            }
            if (config.settings.welcome.autoDelete !== undefined) {
                document.getElementById('welcome-auto-delete').value = config.settings.welcome.autoDelete;
            }
            
            const withImage = config.settings.welcome.withImage || false;
            const imageUrl = config.settings.welcome.imageUrl || '';
            
            if (withImage) {
                document.getElementById('welcome-with-image')?.classList.add('on');
                document.getElementById('welcome-image-section').style.display = 'block';
                document.getElementById('welcome-image-status').textContent = 'Imagem personalizada ativada';
                document.getElementById('welcome-image-url').value = imageUrl;
                
                if (imageUrl) {
                    document.getElementById('welcome-url-preview-img').src = imageUrl;
                    document.getElementById('welcome-url-preview').style.display = 'block';
                }
            }
        }
        
        if (config.settings.farewell) {
            document.getElementById('pill-farewell')?.classList.toggle('on', config.settings.farewell.enabled);
            
            if (config.settings.farewell.message) {
                document.getElementById('farewell-msg').value = config.settings.farewell.message;
            }
            if (config.settings.farewell.caption) {
                document.getElementById('farewell-caption').value = config.settings.farewell.caption;
            }
            if (config.settings.farewell.autoDelete !== undefined) {
                document.getElementById('farewell-auto-delete').value = config.settings.farewell.autoDelete;
            }
            
            document.getElementById('farewell-mention')?.classList.toggle('on', config.settings.farewell.withMention);
            document.getElementById('farewell-reason')?.classList.toggle('on', config.settings.farewell.withReason);
            
            const withImage = config.settings.farewell.withImage || false;
            const imageUrl = config.settings.farewell.imageUrl || '';
            
            if (withImage) {
                document.getElementById('farewell-with-image')?.classList.add('on');
                document.getElementById('farewell-image-section').style.display = 'block';
                document.getElementById('farewell-image-status').textContent = 'Imagem personalizada ativada';
                document.getElementById('farewell-image-url').value = imageUrl;
                
                if (imageUrl) {
                    document.getElementById('farewell-url-preview-img').src = imageUrl;
                    document.getElementById('farewell-url-preview').style.display = 'block';
                }
            }
        }
    }
    
    renderCmds(commandsList || [], config || {});
    renderGrps(groups || []);
});

socket.on('realtime_update', ({ config }) => {
    if (!config) return;
    
    if (config.settings && config.settings.welcome) {
        document.getElementById('pill-welcome')?.classList.toggle('on', config.settings.welcome.enabled);
    }
    if (config.settings && config.settings.farewell) {
        document.getElementById('pill-farewell')?.classList.toggle('on', config.settings.farewell.enabled);
    }
});

socket.on('config_saved', (data) => {
    if (data.success) {
        toast('Configuração salva com sucesso!', 'ok');
    } else {
        toast('Erro: ' + data.error, 'err');
    }
});

function renderCmds(list, config) {
    const g = document.getElementById('cmd-grid');
    if (!list.length) {
        g.innerHTML = '<div class="empty"><svg width="30" height="30" fill="none" viewBox="0 0 24 24"><polyline points="4,7 9,12 4,17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="17" x2="20" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><p>Nenhum comando carregado.<br>Conecte o bot para ver.</p></div>';
        return;
    }
    g.innerHTML = '';
    list.forEach(cmd => {
        const on = config?.commands?.[cmd.name] !== false;
        const el = document.createElement('div');
        el.className = 'cc';
        el.innerHTML = `
            <div class="cc-top"><div>
                <div class="cc-name">!${escapeHtml(cmd.name)}</div>
                <div class="cc-desc">${escapeHtml(cmd.description || 'Sem descrição')}</div>
            </div></div>
            <div class="cc-foot">
                <span class="cc-state ${on?'on':''}">${on?'Ativo':'Inativo'}</span>
                <button class="pill ${on?'on':''}" data-name="${cmd.name}"></button>
            </div>`;
        el.querySelector('.pill').addEventListener('click', e => {
            const pill = e.currentTarget;
            const next = !pill.classList.contains('on');
            setPill(pill, next);
            socket.emit('toggle_command', { name: cmd.name, status: next });
            toast(next ? `!${cmd.name} ativado` : `!${cmd.name} desativado`, next ? 'ok' : 'err');
        });
        g.appendChild(el);
    });
}

function setPill(pill, on) {
    pill.classList.toggle('on', on);
    const st = pill.closest('.cc-foot')?.querySelector('.cc-state');
    if (st) { 
        st.textContent = on?'Ativo':'Inativo'; 
        st.className = `cc-state ${on?'on':''}`; 
    }
}

function renderGrps(groups) {
    const g = document.getElementById('grp-grid');
    const s = document.getElementById('grp-sub');
    if (!groups || !groups.length) { 
        s.textContent = 'Nenhum grupo encontrado';
        g.innerHTML = '<div class="empty"><svg width="30" height="30" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M2 21c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><p>Nenhum grupo encontrado.<br>O bot precisa estar em algum grupo.</p></div>';
        return; 
    }
    s.textContent = `${groups.length} grupo${groups.length!==1?'s':''}`;
    g.innerHTML = '';
    groups.forEach(gr => {
        const name = gr.subject || 'Sem nome';
        const el = document.createElement('div');
        el.className = 'gc';
        el.innerHTML = `
            <div class="gc-av">${escapeHtml(name[0]?.toUpperCase() || 'G')}</div>
            <div class="gc-body">
                <div class="gc-name">${escapeHtml(name)}</div>
                <div class="gc-id">${escapeHtml(gr.id?.split('@')[0] || '—')}</div>
            </div>
            <div class="gc-num">${gr.members || 0} membros</div>`;
        g.appendChild(el);
    });
}

document.getElementById('fab').addEventListener('click', () => {
    document.getElementById('ov-cmd').classList.remove('hide');
});

document.getElementById('cmd-cancel').addEventListener('click', () => {
    document.getElementById('ov-cmd').classList.add('hide');
    document.getElementById('in-trig').value = '';
    document.getElementById('in-resp').value = '';
});

document.getElementById('cmd-create').addEventListener('click', () => {
    const t = document.getElementById('in-trig').value.trim();
    const r = document.getElementById('in-resp').value.trim();
    if (!t || !r) return toast('Preencha todos os campos', 'err');
    socket.emit('create_command', { trigger: t, response: r });
    document.getElementById('ov-cmd').classList.add('hide');
    document.getElementById('in-trig').value = '';
    document.getElementById('in-resp').value = '';
    toast('Comando criado', 'ok');
});

let toastTimer;

function toast(msg, type = 'ok') {
    const el = document.getElementById('toast');
    el.className = `toast ${type}`;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;')
                     .replace(/</g, '&lt;')
                     .replace(/>/g, '&gt;')
                     .replace(/"/g, '&quot;')
                     .replace(/'/g, '&#039;');
}