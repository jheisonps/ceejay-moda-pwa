// ── TAREFAS ───────────────────────────────────────────────────────────────────
const TAR_XP_POR_ACAO=10;
const TAR_XP_POR_NIVEL=100;
const TAR_XP_INICIO='2026-06-29';
const TAR_SURPRESA_ID='surpresa';
const TAR_SURPRESA_BONUS=2.00;
const TAR_TITULOS=[
  {nivel:30,titulo:'Lenda Cee Jay'},
  {nivel:20,titulo:'Embaixador Cee Jay'},
  {nivel:10,titulo:'Influenciador'},
  {nivel:5,titulo:'Vendedor'},
  {nivel:1,titulo:'Novato'}
];
const TAR_MISSOES_SURPRESA=[
  'Grave um vídeo engraçado da loja.',
  'Monte um look completo para um cliente imaginário.',
  'Mostre a peça mais estilosa da loja nos Stories.',
  'Grave um antes e depois rápido de uma arara organizada.',
  'Faça uma enquete: look claro ou look escuro?',
  'Mostre 3 detalhes de acabamento de uma peça.',
  'Grave um vídeo curto chamando clientes para visitar a loja.'
];

function getTarKey(){
  const dt=$('tar-date').value;
  const user=currentUser||'anonimo';
  return dt+'_'+user.replace(/\s+/g,'_');
}
// Retorna o objeto done das tarefas normais (não repetíveis)
function getTarDone(){
  const dtStart=$('tar-date').value;
  const dtEnd=$('tar-date-end').value||dtStart;
  if(!dtStart)return {};
  const user=(currentUser||'anonimo').replace(/\s+/g,'_');
  if(dtStart===dtEnd){
    return tarefasDone[dtStart+'_'+user]||{};
  }
  const merged={};
  const s=new Date(dtStart),e=new Date(dtEnd);
  for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)){
    const dk=d.toISOString().slice(0,10)+'_'+user;
    Object.assign(merged,tarefasDone[dk]||{});
  }
  return merged;
}
// Retorna o acumulador de repetições {t07: 3, t18: 2, ...}
function getTarRep(){
  const dtStart=$('tar-date').value;
  const dtEnd=$('tar-date-end').value||dtStart;
  if(!dtStart)return {};
  const user=(currentUser||'anonimo').replace(/\s+/g,'_');
  if(dtStart===dtEnd){
    return tarefasRep[dtStart+'_'+user]||{};
  }
  // Para range: soma os contadores de todos os dias
  const merged={};
  const s=new Date(dtStart),e=new Date(dtEnd);
  for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)){
    const dk=d.toISOString().slice(0,10)+'_'+user;
    const dayRep=tarefasRep[dk]||{};
    for(const[k,v]of Object.entries(dayRep)){
      merged[k]=(merged[k]||0)+v;
    }
  }
  return merged;
}
function isRangeMode(){
  const dtStart=$('tar-date').value;
  const dtEnd=$('tar-date-end').value;
  return dtStart&&dtEnd&&dtEnd!==dtStart;
}
function getTarUserKey(){
  return (currentUser||'anonimo').replace(/\s+/g,'_');
}
function parseTarDate(dt){
  const [y,m,d]=(dt||'').split('-').map(Number);
  return new Date(y,(m||1)-1,d||1);
}
function formatTarDate(date){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function getTarDateKey(dt,user=getTarUserKey()){
  return dt+'_'+user;
}
function getMissaoSurpresa(dt){
  const seed=(dt||'').replace(/\D/g,'').split('').reduce((acc,n)=>acc+Number(n),0);
  return TAR_MISSOES_SURPRESA[seed%TAR_MISSOES_SURPRESA.length];
}
function getTarTitulo(nivel){
  return TAR_TITULOS.find(t=>nivel>=t.nivel)?.titulo||'Novato';
}
function getTarTotals(done,rep,key){
  let totalBonus=0,totalDone=0,totalXp=0;
  TAREFAS_PADRAO.forEach(t=>{
    if(t.repetivel){
      const cnt=rep[t.id]||0;
      totalBonus+=t.bonus*cnt;
      totalXp+=TAR_XP_POR_ACAO*cnt;
      if(cnt>0)totalDone++;
    }else if(done[t.id]){
      const pb=placarBonusData[key]||{};
      totalBonus+=t.automatico?(pb[t.id]||t.bonus):t.bonus;
      totalDone++;
      totalXp+=TAR_XP_POR_ACAO;
    }
  });
  if(done[TAR_SURPRESA_ID]){
    totalBonus+=TAR_SURPRESA_BONUS;
    totalDone++;
    totalXp+=TAR_XP_POR_ACAO;
  }
  return {totalBonus,totalDone,totalXp,totalTarefas:TAREFAS_PADRAO.length+1};
}
function getUserTotalXp(){
  if(!currentUser)return 0;
  const user=getTarUserKey();
  let xp=0;
  Object.entries(tarefasDone||{}).forEach(([key,done])=>{
    if(!key.endsWith('_'+user)||!done||!isTarXpEligibleKey(key))return;
    TAREFAS_PADRAO.forEach(t=>{if(!t.repetivel&&done[t.id])xp+=TAR_XP_POR_ACAO;});
    if(done[TAR_SURPRESA_ID])xp+=TAR_XP_POR_ACAO;
  });
  Object.entries(tarefasRep||{}).forEach(([key,rep])=>{
    if(!key.endsWith('_'+user)||!rep||!isTarXpEligibleKey(key))return;
    TAREFAS_PADRAO.forEach(t=>{if(t.repetivel)xp+=((rep[t.id]||0)*TAR_XP_POR_ACAO);});
  });
  return xp;
}
function getTarLevelInfo(){
  const xp=getUserTotalXp();
  const nivel=Math.floor(xp/TAR_XP_POR_NIVEL)+1;
  const atual=xp%TAR_XP_POR_NIVEL;
  return {xp,nivel,titulo:getTarTitulo(nivel),pct:Math.round((atual/TAR_XP_POR_NIVEL)*100),atual};
}
function isTarXpEligibleKey(key){
  return (key||'').slice(0,10)>=TAR_XP_INICIO;
}
function isTarDayComplete(dt,user=getTarUserKey()){
  const key=getTarDateKey(dt,user);
  const done=tarefasDone[key]||{};
  const rep=tarefasRep[key]||{};
  const tarefasOk=TAREFAS_PADRAO.every(t=>t.repetivel?(rep[t.id]||0)>0:!!done[t.id]);
  return tarefasOk&&!!done[TAR_SURPRESA_ID];
}
function getTarStreak(dtStart){
  if(!currentUser||!dtStart)return 0;
  const user=getTarUserKey();
  let streak=0;
  const d=parseTarDate(dtStart);
  for(let i=0;i<370;i++){
    const keyDate=formatTarDate(d);
    if(!isTarDayComplete(keyDate,user))break;
    streak++;
    d.setDate(d.getDate()-1);
  }
  return streak;
}

window.onTarDateChange=function(){
  // If end < start, swap
  const s=$('tar-date').value,e=$('tar-date-end').value;
  if(s&&e&&e<s){$('tar-date-end').value=s;$('tar-date').value=e;}
  renderTarefas();
};

window.setTarFilter=function(f){
  tarFilter=f;
  ['all','pending','done'].forEach(x=>$('tf-'+x).classList.toggle('active',x===f));
  renderTarefas();playClick();
};

window.toggleTarefaOpen=function(id){
  const card=document.getElementById('tarcard-'+id);
  if(!card)return;
  const isOpen=card.classList.contains('open');
  document.querySelectorAll('.tar-card.open').forEach(c=>c.classList.remove('open'));
  if(!isOpen)card.classList.add('open');
};

window.marcarTarefa=async function(id){
  if(!currentUser){toast('⚠️ Defina seu nome em ⚙️ na aba Venda.',false);return;}
  const key=getTarKey();
  const done=getTarDone();
  const tarefa=TAREFAS_PADRAO.find(t=>t.id===id);
  if(!tarefa)return;

  if(tarefa.repetivel){
    // Missão repetível: incrementa contador permanente, nunca some
    const repKey='tarefasRep/'+key;
    const rep=getTarRep();
    const atual=rep[id]||0;
    await update(ref(db,repKey),{[id]:atual+1});
    playBonus();
    toast(`🌟 +${fmt(tarefa.bonus)} e +${TAR_XP_POR_ACAO} XP! (${atual+1}× hoje)`);
  }else{
    if(done[id]){
      // desmarcar tarefa normal
      await update(ref(db,'tarefas/'+key),{[id]:null});
      toast('↩️ Tarefa desmarcada');
    }else{
      await update(ref(db,'tarefas/'+key),{[id]:Date.now()});
      // Verificar se TODAS não-repetíveis foram feitas
      setTimeout(()=>{
        const doneNow=getTarDone();
        const allDone=isTarDayComplete($('tar-date').value);
        if(allDone){playAllDone();toast('🏆 Todas as tarefas concluídas! Sequência +1 dia!');}
        else{playBonus();toast(`🌟 Bônus conquistado e +${TAR_XP_POR_ACAO} XP!`);}
      },400);
    }
  }
  document.querySelectorAll('.tar-card.open').forEach(c=>c.classList.remove('open'));
};

window.marcarSurpresa=async function(){
  if(!currentUser){toast('⚠️ Defina seu nome em ⚙️ na aba Venda.',false);return;}
  const key=getTarKey();
  const done=getTarDone();
  if(done[TAR_SURPRESA_ID]){
    await update(ref(db,'tarefas/'+key),{[TAR_SURPRESA_ID]:null});
    toast('↩️ Missão surpresa desmarcada');
    return;
  }
  await update(ref(db,'tarefas/'+key),{[TAR_SURPRESA_ID]:Date.now()});
  playBonus();
  setTimeout(()=>{
    if(isTarDayComplete($('tar-date').value)){playAllDone();toast('🔥 Dia perfeito! Sequência +1 dia!');}
    else{toast(`🎁 Missão surpresa feita: +${fmt(TAR_SURPRESA_BONUS)} e +${TAR_XP_POR_ACAO} XP!`);}
  },350);
};

window.desfazerRep=async function(id){
  if(!currentUser){toast('⚠️ Defina seu nome em ⚙️.',false);return;}
  const key=getTarKey();
  const rep=getTarRep();
  const cnt=rep[id]||0;
  if(cnt<=0){toast('Nenhuma ocorrência para desfazer.',false);return;}
  const tarefa=TAREFAS_PADRAO.find(t=>t.id===id);
  const novo=cnt-1;
  await update(ref(db,'tarefasRep/'+key),{[id]:novo||null});
  playClick();
  toast(`↩️ Ocorrência desfeita${novo>0?' — restam '+novo+'×':''}`);
  document.querySelectorAll('.tar-card.open').forEach(c=>c.classList.remove('open'));
};
window.atualizarPlacar=function(id){
  const ini=parseInt(document.getElementById('placar-inicio-'+id)?.value)||0;
  const fim=parseInt(document.getElementById('placar-fim-'+id)?.value)||0;
  const valEl=document.getElementById('placar-val-'+id);
  if(!valEl)return;
  if(!ini&&!fim){valEl.textContent='— / —';valEl.className='placar-result-val zero';return;}
  const diff=fim-ini;
  const bonus=Math.min(diff*0.03,2.50);
  valEl.className='placar-result-val '+(diff>0?'pos':diff<0?'neg':'zero');
  valEl.textContent=(diff>0?'+':'')+diff+' seg. / '+fmt(Math.max(bonus,0));
};

window.calcularPlacar=async function(id){
  if(!currentUser){toast('⚠️ Defina seu nome em ⚙️.',false);return;}
  const ini=parseInt(document.getElementById('placar-inicio-'+id)?.value)||0;
  const fim=parseInt(document.getElementById('placar-fim-'+id)?.value)||0;
  if(!ini||!fim){toast('Preencha os dois campos.',false);return;}
  const diff=Math.max(fim-ini,0);
  const bonus=Math.min(diff*0.03,2.50);
  // Salva como tarefa done com o bonus calculado
  const key=getTarKey();
  await update(ref(db,'tarefas/'+key),{[id]:Date.now()});
  // Salva o bonus real no nó placarBonus
  await update(ref(db,'placarBonus/'+key),{[id]:bonus,inicio:ini,fim:fim,ganho:diff});
  playBonus();
  toast(`🌟 +${diff} seguidores → bônus ${fmt(bonus)}!`);
  document.querySelectorAll('.tar-card.open').forEach(c=>c.classList.remove('open'));
};
window.renderTarefas=function(){
  const done=getTarDone();
  const rep=getTarRep();
  const range=isRangeMode();
  const dtStart=$('tar-date').value;
  const dtEnd=$('tar-date-end').value||dtStart;
  const cats=[...new Set(TAREFAS_PADRAO.map(t=>t.cat))];
  const totals=getTarTotals(done,rep,getTarKey());
  const {totalBonus,totalDone,totalXp,totalTarefas}=totals;
  const level=getTarLevelInfo();
  const streak=getTarStreak(dtStart);

  // update header
  $('tar-bonus-total').textContent=fmt(totalBonus);
  const pct=Math.round((totalDone/totalTarefas)*100);
  $('tar-progress').style.width=pct+'%';
  $('tar-progress-lbl').textContent=totalDone+' de '+totalTarefas+' tarefas — '+pct+'%';
  const xpPanel=$('tar-xp-panel');
  if(xpPanel){
    xpPanel.innerHTML=`
      <div class="tar-xp-top"><span>🏆 Nível ${level.nivel} — ${level.titulo}</span><span>${level.xp} XP</span></div>
      <div class="tar-xp-bar"><div class="tar-xp-fill" style="width:${level.pct}%"></div></div>
      <div class="tar-xp-foot"><span>${level.pct}% para o próximo nível</span><span>+${totalXp} XP no dia</span></div>
      <div class="tar-streak-mini">🔥 Sequência atual: ${streak} ${streak===1?'dia':'dias'}</div>`;
  }

  const surpriseWrap=$('tar-surprise-wrap');
  if(surpriseWrap){
    const surpriseDone=!!done[TAR_SURPRESA_ID];
    surpriseWrap.innerHTML=range?'':`
      <div class="tar-surprise-card ${surpriseDone?'done':''}">
        <div class="tar-surprise-head">
          <div>
            <div class="tar-surprise-kicker">🎁 Missão surpresa</div>
            <div class="tar-surprise-title">${getMissaoSurpresa(dtStart)}</div>
          </div>
          <span class="tar-bonus-tag">${fmt(TAR_SURPRESA_BONUS)} · ${TAR_XP_POR_ACAO} XP</span>
        </div>
        <button class="${surpriseDone?'tar-undo-btn':'tar-confirm-btn'}" onclick="marcarSurpresa()">${surpriseDone?'↩️ Desmarcar missão':'✅ Concluir missão surpresa'}</button>
      </div>`;
  }

  const wrap=$('tar-list-wrap');
  wrap.innerHTML='';

  cats.forEach(cat=>{
    const catTasks=TAREFAS_PADRAO.filter(t=>{
      if(tarFilter==='done'){
        if(t.repetivel)return t.cat===cat&&(rep[t.id]||0)>0;
        return t.cat===cat&&done[t.id];
      }
      if(tarFilter==='pending'){
        if(t.repetivel)return t.cat===cat; // repetíveis sempre disponíveis
        return t.cat===cat&&!done[t.id];
      }
      return t.cat===cat;
    });
    if(!catTasks.length)return;
    const sec=document.createElement('div');
    sec.className='tar-section';
    const catIco={'Fase 1: Abertura':'🏢','Fase 2: Clientes':'👥','Fase 3: Instagram':'📸','Fase 4: Vídeos':'🎬','Fase 5: Resultados':'🚀'}[cat]||'📌';
    sec.textContent=catIco+' '+cat;
    wrap.appendChild(sec);
    catTasks.forEach(t=>{
      const repCnt=rep[t.id]||0;
      const isDone=t.repetivel?(repCnt>0):!!done[t.id];
      const div=document.createElement('div');
      div.className='tar-card'+(isDone?' done':'');
      div.id='tarcard-'+t.id;
      const repTag=t.repetivel&&repCnt>0
        ?`<span class="tar-badge tar-badge-rep">🔁 ×${repCnt} = ${fmt(t.bonus*repCnt)}</span>`
        :t.repetivel?'<span class="tar-badge tar-badge-rep">🔁 Repetível</span>':'';
      const badges=[
        repTag,
        t.upload==='video'?'<span class="tar-badge tar-badge-upload">📹 Vídeo</span>':'',
        t.upload==='foto'?'<span class="tar-badge tar-badge-upload">📷 Foto</span>':'',
        t.especial?'<span class="tar-badge tar-badge-esp">⭐ Especial</span>':'',
        t.automatico?'<span class="tar-badge tar-badge-auto">⚡ Auto</span>':'',
        t.whatsapp?'<span class="tar-badge tar-badge-wpp">💬 WhatsApp</span>':'',
        `<span class="tar-badge tar-badge-xp">⭐ ${TAR_XP_POR_ACAO} XP</span>`,
      ].filter(Boolean).join('');
      const btnHtml=t.repetivel
        ?`<div style="display:flex;flex-direction:column;gap:6px">
            <button class="tar-confirm-btn" onclick="marcarTarefa('${t.id}')">✅ +1 ocorrência (+${fmt(t.bonus)} · +${TAR_XP_POR_ACAO} XP)${repCnt>0?' — já: '+repCnt+'×':''}</button>
            ${repCnt>0?`<button class="tar-undo-btn" onclick="desfazerRep('${t.id}')">↩️ Desfazer última (−${fmt(t.bonus)})</button>`:''}
          </div>`
        :(!isDone
          ?`<button class="tar-confirm-btn" onclick="marcarTarefa('${t.id}')">✅ Marcar como feita (+${fmt(t.bonus)} · +${TAR_XP_POR_ACAO} XP)</button>`
          :`<button class="tar-undo-btn" onclick="marcarTarefa('${t.id}')">↩️ Desmarcar tarefa</button>`
        );
      const proofHtml=t.automatico?`
        <div class="tar-proof-area">
          <div class="tar-proof-title">📊 Registrar seguidores</div>
          <div class="tar-proof-note">${t.desc}</div>
          <div class="placar-wrap">
            <div class="placar-row">
              <div class="placar-field">
                <label>Seguidores às 13h</label>
                <input class="placar-inp" id="placar-inicio-${t.id}" type="number" inputmode="numeric" placeholder="0" oninput="atualizarPlacar('${t.id}')">
              </div>
              <div class="placar-field">
                <label>Seguidores às 18h</label>
                <input class="placar-inp" id="placar-fim-${t.id}" type="number" inputmode="numeric" placeholder="0" oninput="atualizarPlacar('${t.id}')">
              </div>
            </div>
            <div class="placar-result" id="placar-result-${t.id}">
              <span class="placar-result-lbl">Ganho / Bônus</span>
              <span class="placar-result-val zero" id="placar-val-${t.id}">— / —</span>
            </div>
            ${!isDone
              ?`<button class="placar-btn" onclick="calcularPlacar('${t.id}')">✅ Calcular e Registrar bônus</button>`
              :`<button class="tar-undo-btn" onclick="marcarTarefa('${t.id}')">↩️ Desmarcar</button>`
            }
          </div>
        </div>`:
        `<div class="tar-proof-area">
          <div class="tar-proof-title">Como confirmar</div>
          <div class="tar-proof-note">${t.desc}</div>
          ${btnHtml}
        </div>`;
      div.innerHTML=`
        <div class="tar-card-top" onclick="toggleTarefaOpen('${t.id}')">
          <div class="tar-check"><span class="tar-check-mark">${t.repetivel&&repCnt>0?repCnt:"✓"}</span></div>
          <div class="tar-info">
            <div class="tar-name">${t.nome}</div>
            ${badges?`<div class="tar-badges-row">${badges}</div>`:""}
            <div class="tar-desc">${t.desc}</div>
          </div>
          <span class="tar-bonus-tag">${t.automatico&&isDone?fmt((placarBonusData[getTarKey()]||{})[t.id]||t.bonus):t.repetivel&&repCnt>0?fmt(t.bonus*repCnt):'+'+fmt(t.bonus)}</span>
        </div>
        ${proofHtml}`;
      wrap.appendChild(div);
    });
  });

  // Resumo no final
  const dtLabel=range?(dtStart+' → '+dtEnd):dtStart;
  const sumWrap=$('tar-summary-wrap');
  sumWrap.innerHTML=`
    <div class="tar-summary-box">
      <div class="tar-sum-title">📊 ${range?'Resumo do período':'Resumo do dia'}</div>
      ${range?`<div class="tar-sum-row"><span class="tar-sum-lbl">Período</span><span class="tar-sum-val" style="font-size:11px">${dtLabel}</span></div>`:''}
      <div class="tar-sum-row"><span class="tar-sum-lbl">Tarefas concluídas</span><span class="tar-sum-val">${totalDone} / ${totalTarefas}</span></div>
      <div class="tar-sum-row"><span class="tar-sum-lbl">Progresso</span><span class="tar-sum-val">${pct}%</span></div>
      <div class="tar-sum-row"><span class="tar-sum-lbl">⭐ XP do dia</span><span class="tar-sum-val">+${totalXp} XP</span></div>
      <div class="tar-sum-row"><span class="tar-sum-lbl">🔥 Sequência atual</span><span class="tar-sum-val">${'🔥'.repeat(Math.min(streak,8))||'—'} ${streak} ${streak===1?'dia':'dias'}</span></div>
      <div class="tar-sum-row tar-sum-big"><span class="tar-sum-lbl">💰 Total de bônus</span><span class="tar-sum-val">${fmt(totalBonus)}</span></div>
    </div>`;
};

window.compartilharTarefas=function(via){
  const done=getTarDone();
  const rep=getTarRep();
  const dtStart=$('tar-date').value;
  const dtEnd=$('tar-date-end').value||dtStart;
  const range=isRangeMode();
  const dtLabel=range?(dtStart.split('-').reverse().join('/')+' até '+dtEnd.split('-').reverse().join('/')):(dtStart.split('-').reverse().join('/'));

  let totalBonus=0,totalDone=0,totalXp=0;
  const linhas=[];
  TAREFAS_PADRAO.forEach(t=>{
    if(t.repetivel){
      const cnt=rep[t.id]||0;
      if(cnt>0){
        totalBonus+=t.bonus*cnt;totalDone++;totalXp+=TAR_XP_POR_ACAO*cnt;
        linhas.push('🔁 '+t.nome+' ×'+cnt+' ('+fmt(t.bonus*cnt)+' · '+(TAR_XP_POR_ACAO*cnt)+' XP)');
      }
    }else{
      if(done[t.id]){
        totalBonus+=t.bonus;totalDone++;totalXp+=TAR_XP_POR_ACAO;
        linhas.push('✅ '+t.nome+' (+'+fmt(t.bonus)+' · '+TAR_XP_POR_ACAO+' XP)');
      }
    }
  });
  if(done[TAR_SURPRESA_ID]){
    totalBonus+=TAR_SURPRESA_BONUS;totalDone++;totalXp+=TAR_XP_POR_ACAO;
    linhas.push('🎁 Missão surpresa: '+getMissaoSurpresa(dtStart)+' (+'+fmt(TAR_SURPRESA_BONUS)+' · '+TAR_XP_POR_ACAO+' XP)');
  }

  if(!totalDone){toast('Nenhuma tarefa concluída ainda.',false);return;}

  const texto=[
    '⭐ *CEE JAY MODA — Tarefas Concluídas*',
    '📅 '+dtLabel,
    '',
    ...linhas,
    '',
    '─────────────────',
    '🏆 Total: '+totalDone+' de '+(TAREFAS_PADRAO.length+1)+' tarefas',
    '💰 Bônus acumulado: *'+fmt(totalBonus)+'*',
    '⭐ XP ganho: *'+totalXp+' XP*',
    '🔥 Sequência atual: *'+getTarStreak(dtStart)+' dias*',
  ].join('\n');

  if(via==='whatsapp'){
    window.open('https://wa.me/?text='+encodeURIComponent(texto),'_blank');
  }else{
    if(navigator.clipboard){
      navigator.clipboard.writeText(texto).then(()=>toast('📋 Copiado! Cole no Instagram Stories.')).catch(()=>prompt('Copie:',texto));
    }else{prompt('Copie:',texto);}
  }
};
