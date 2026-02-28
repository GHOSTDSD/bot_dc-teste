module.exports = {
    name: 'menuadm',
    async execute(sock, m, dbs, args) {
        const jid = m.key.remoteJid;

        const menu = `
┌───────────────────────────┐
      [#] ARES BOT ELITE [#] 
└───────────────────────────┘

  [>] ADMINISTRAÇÃO
  
  [#] !ban @user
  [#] !add_parceria
  [#] !del_parceria
  [#] !parceria
  [#] !addcmdadm
  [#] !delcmdadm
  [#] !listacmdadm
  [#] !adverter @user
  [#] !rm_adv @user
  [#] !lista_adv
  [#] !ver_adv @user
  [#] !limpar_adv
  [#] !aceitar
  
  [#] !ausente [motivo]
  [#] !ativo
  [#] !anotar [texto]
  [#] !anotacoes
  [#] !rmnota [nome]
  [#] !banghost
  [#] !mute @user
  [#] !desmute @user
  [#] !prefixos
  [#] !add_palavra
  [#] !rm_palavra
  
  [#] !rg_aviso
  [#] !rm_aviso
  [#] !listanegra
  [#] !tirardalista
  [#] !listabranca
  [#] !rmlistabranca
  [#] !listafake
  [#] !listaban
  [#] !revelar
  [#] !promover @user
  [#] !rebaixar @user
  
  [#] !sh_num [DDI]
  [#] !linkgp
  [#] !sorteio
  [#] !sortear
  [#] !totag [texto]
  [#] !hidetag [texto]
  [#] !marcar
  [#] !marcarwa
  [#] !atividades
  [#] !msgadm [texto]
  
  [#] !sorteiogold
  [#] !resetvelha
  [#] !regras
  [#] !papof
  [#] !rv_forca
  [#] !revelar_anagrama
  [#] !revelar_gartic
  [#] !revelar_enigma
  [#] !banfake
  [#] !addcmdgold
  [#] !delcmdgold

  [>] CONFIGURAÇÃO
  
  [#] !gp [a/f]
  [#] !fundo_bemvindo
  [#] !fundo_saiu
  [#] !tempocmd [seg]
  [#] !opengp [hh:mm]
  [#] !closegp [hh:mm]
  [#] !time-status
  [#] !rm_opengp
  [#] !bemvindo [on/off]
  [#] !bemvindo2 [on/off]
  [#] !infobv
  [#] !criartabela
  [#] !info_adverter
  [#] !info_listanegra
  [#] !infocontador
  [#] !descgp [texto]
  [#] !fotogp
  [#] !gpinfo
  [#] !nomegp [nome]
  [#] !legendabv
  [#] !legendasaiu
  [#] !resetlink

  [>] SEGURANÇA / ATIVA
  
  [#] !status
  [#] !modoparceria
  [#] !autodl
  [#] !antilink
  [#] !advlink
  [#] !antibots
  [#] !antimarcar
  [#] !antilinkgp
  [#] !advlinkgp
  [#] !advflood
  [#] !autosticker
  [#] !antifake
  [#] !anti_notas
  [#] !anticontato
  [#] !antiloc
  [#] !limitcmd
  [#] !antipalavra
  [#] !so_adm
  [#] !antiimg
  [#] !antivideo
  [#] !antiaudio
  [#] !antidoc
  [#] !antisticker
  [#] !anticatalogo
  [#] !multiprefix
  [#] !autoban
  [#] !anagrama
  [#] !x9viewonce
  [#] !limitexto
  [#] !x9adm
  [#] !simih
  [#] !modorpg
  [#] !modogamer
  [#] !autoresposta
  [#] !+18

  [#] ARES-BOT © 2026`;

        await sock.sendMessage(jid, { text: menu.trim() }, { quoted: m });
    }
};