// ── RESUMO DO DIA ─────────────────────────────────────────────────────────────
let resPeriod='today';

function initResDate(){
  const now=new Date();
  const y=now.getFullYear();const m=String(now.getMonth()+1).padStart(2,'0');const d=String(now.getDate()).padStart(2,'0');
  const today=`${y}-${m}-${d}`;
  $('res-date-from').value=today;$('res-date-to').value=today;
}

window.setResPeriod=function(p){
  resPeriod=p;
  ['today','week','month','custom'].forEach(x=>{const el=$('rp-'+x);if(el)el.classList.toggle('active',x===p);});
  const now=new Date();
  const pad=n=>String(n).padStart(2,'0');
  const fmt2=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  if(p==='today'){const t=fmt2(now);$('res-date-from').value=t;$('res-date-to').value=t;}
  else if(p==='week'){const day=now.getDay();const diff=now.getDate()-day+(day===0?-6:1);const start=new Date(now.getFullYear(),now.getMonth(),diff);$('res-date-from').value=fmt2(start);$('res-date-to').value=fmt2(now);}
  else if(p==='month'){$('res-date-from').value=`${now.getFullYear()}-${pad(now.getMonth()+1)}-01`;$('res-date-to').value=fmt2(now);}
  renderResumo();playClick();
};

window.renderResumo=function(){
  const from=$('res-date-from').value;
  const to=$('res-date-to').value||from;
  if(!from){$('res-body').innerHTML='<div class="res-empty">Selecione um período.</div>';return;}
  const dtStart=new Date(from+'T00:00:00').getTime();
  const dtEnd=new Date(to+'T23:59:59').getTime();
  const periodLabel=(from===to)?from.split('-').reverse().join('/'):(from.split('-').reverse().join('/')+' até '+to.split('-').reverse().join('/'));

  // Filtrar vendas do período
  const vendasPeriod=vendas.filter(v=>v.ts>=dtStart&&v.ts<=dtEnd);
  const totalBruto=vendasPeriod.reduce((s,v)=>s+(v.totalFinal||0),0);
  const totalCom=vendasPeriod.reduce((s,v)=>s+(v.comissao||0),0);
  const totalLiq=totalBruto-totalCom;
  const qtdVendas=vendasPeriod.length;
  const comDesc=vendasPeriod.filter(v=>v.temDesconto||v.desconto>0).length;
  const semDesc=qtdVendas-comDesc;

  // Produtos mais vendidos
  const prodCount={};
  vendasPeriod.forEach(v=>{(v.itens||[]).forEach(it=>{const k=it.nome||('COD '+it.cod);prodCount[k]=(prodCount[k]||{qtd:0,val:0});prodCount[k].qtd+=it.qtd||0;prodCount[k].val+=(it.total||0);});});
  const topProds=Object.entries(prodCount).sort((a,b)=>b[1].qtd-a[1].qtd).slice(0,5);

  // Tarefas do dia (usa data de início do período)
  const user=(currentUser||'anonimo').replace(/\s+/g,'_');
  const tarKey=from+'_'+user;
  const done=tarefasDone[tarKey]||{};
  const rep=tarefasRep[tarKey]||{};
  const placar=placarBonusData[tarKey]||{};
  let tarBonus=0,tarDone=0;
  const surpresaId=(typeof TAR_SURPRESA_ID!=='undefined')?TAR_SURPRESA_ID:'surpresa';
  const surpresaBonus=(typeof TAR_SURPRESA_BONUS!=='undefined')?TAR_SURPRESA_BONUS:2.00;
  TAREFAS_PADRAO.forEach(t=>{
    if(t.repetivel){const cnt=rep[t.id]||0;if(cnt>0){tarDone++;tarBonus+=t.bonus*cnt;}}
    else if(done[t.id]){tarDone++;if(t.automatico){tarBonus+=placar[t.id]||t.bonus;}else{tarBonus+=t.bonus;}}
  });
  if(done[surpresaId]){tarDone++;tarBonus+=surpresaBonus;}

  // Montar HTML
  let html='';

  // BLOCO 1: Visão geral financeira
  html+=`<div class="res-section-lbl">💰 Financeiro — ${periodLabel}</div>`;
  if(!qtdVendas){
    html+=`<div class="res-card"><div class="res-empty" style="padding:16px">Nenhuma venda neste período ainda.</div></div>`;
  }else{
    html+=`<div class="res-big-row">
      <div class="res-big-box gold"><div class="res-big-lbl">Entrou na loja</div><div class="res-big-val">${fmt(totalBruto)}</div><div class="res-big-sub">${qtdVendas} venda(s)</div></div>
      <div class="res-big-box green"><div class="res-big-lbl">Fica pra loja</div><div class="res-big-val">${fmt(totalLiq)}</div><div class="res-big-sub">após comissões</div></div>
    </div>
    <div class="res-card">
      <div class="res-row"><span class="res-row-lbl">Total vendido (bruto)</span><span class="res-row-val gold">${fmt(totalBruto)}</span></div>
      <div class="res-row"><span class="res-row-lbl">Total de comissões pagas</span><span class="res-row-val red">− ${fmt(totalCom)}</span></div>
      <div class="res-row"><span class="res-row-lbl">💚 Fica na loja (líquido)</span><span class="res-row-val green">${fmt(totalLiq)}</span></div>
      <div class="res-row"><span class="res-row-lbl">Vendas sem desconto</span><span class="res-row-val">${semDesc}</span></div>
      <div class="res-row"><span class="res-row-lbl">Vendas com desconto</span><span class="res-row-val">${comDesc}</span></div>
      ${qtdVendas>0?`<div class="res-row"><span class="res-row-lbl">Ticket médio por venda</span><span class="res-row-val gold">${fmt(totalBruto/qtdVendas)}</span></div>`:''}
      <div class="res-explain">📖 <b>Como ler:</b> "Total vendido" é tudo que entrou. "Comissões" é o que o vendedor ganha. "Fica na loja" é o que sobra — é o dinheiro da loja mesmo.</div>
    </div>`;
  }

  // BLOCO 2: Produtos mais vendidos
  html+=`<div class="res-section-lbl">👔 Peças mais vendidas</div>`;
  if(!topProds.length){
    html+=`<div class="res-card"><div class="res-empty" style="padding:16px">Nenhuma peça vendida neste período.</div></div>`;
  }else{
    html+=`<div class="res-card">${topProds.map(([nome,d],i)=>`
      <div class="res-prod-row">
        <span style="font-size:12px;font-weight:800;color:var(--text3);width:18px;flex-shrink:0">${i+1}º</span>
        <span class="res-prod-name">${nome}</span>
        <span class="res-prod-qty">${d.qtd} un</span>
        <span class="res-prod-val">${fmt(d.val)}</span>
      </div>`).join('')}
      <div class="res-explain">📖 Mostra quais peças venderam mais. Se uma peça aparece sempre no topo, vale ter ela sempre em estoque!</div>
    </div>`;
  }

  // BLOCO 3: Tarefas do dia
  html+=`<div class="res-section-lbl">⭐ Tarefas — ${from.split('-').reverse().join('/')}</div>`;
  html+=`<div class="res-card">
    <div class="res-big-row" style="margin-bottom:10px">
      <div class="res-big-box gold"><div class="res-big-lbl">Bônus tarefas</div><div class="res-big-val">${fmt(tarBonus)}</div></div>
      <div class="res-big-box"><div class="res-big-lbl">Concluídas</div><div class="res-big-val">${tarDone} / ${TAREFAS_PADRAO.length+1}</div></div>
    </div>
    ${TAREFAS_PADRAO.map(t=>{
      const isRep=t.repetivel;const cnt=rep[t.id]||0;
      const isDone=isRep?cnt>0:!!done[t.id];
      const bonusVal=isRep?t.bonus*cnt:(t.automatico?(placar[t.id]||0):t.bonus);
      return `<div class="res-tar-row">
        <div class="res-tar-check ${isDone?'done':'pending'}">${isDone?(isRep?cnt:'✓'):'—'}</div>
        <span class="res-tar-name">${t.nome}</span>
        <span class="res-tar-bonus">${isDone?'+'+fmt(bonusVal):'—'}</span>
      </div>`;
    }).join('')}
    <div class="res-tar-row">
      <div class="res-tar-check ${done[surpresaId]?'done':'pending'}">${done[surpresaId]?'✓':'—'}</div>
      <span class="res-tar-name">🎁 Missão surpresa</span>
      <span class="res-tar-bonus">${done[surpresaId]?'+'+fmt(surpresaBonus):'—'}</span>
    </div>
    <div class="res-explain">📖 Aqui você vê de uma vez o que foi feito nas tarefas e quanto bônus foi ganho no dia.</div>
  </div>`;

  // Botão compartilhar resumo
  html+=`<div class="res-share-wrap">
    <button class="res-share-btn" onclick="compartilharResumo()">💬 Compartilhar resumo via WhatsApp</button>
  </div>`;

  $('res-body').innerHTML=html;
};

window.compartilharResumo=function(){
  const from=$('res-date-from').value;
  const to=$('res-date-to').value||from;
  const dtStart=new Date(from+'T00:00:00').getTime();
  const dtEnd=new Date(to+'T23:59:59').getTime();
  const periodLabel=(from===to)?from.split('-').reverse().join('/'):(from.split('-').reverse().join('/')+' a '+to.split('-').reverse().join('/'));
  const vendasP=vendas.filter(v=>v.ts>=dtStart&&v.ts<=dtEnd);
  const totalBruto=vendasP.reduce((s,v)=>s+(v.totalFinal||0),0);
  const totalCom=vendasP.reduce((s,v)=>s+(v.comissao||0),0);
  const totalLiq=totalBruto-totalCom;
  const user=(currentUser||'anonimo').replace(/\s+/g,'_');
  const done=tarefasDone[from+'_'+user]||{};
  const rep=tarefasRep[from+'_'+user]||{};
  const placar=placarBonusData[from+'_'+user]||{};
  const surpresaId=(typeof TAR_SURPRESA_ID!=='undefined')?TAR_SURPRESA_ID:'surpresa';
  const surpresaBonus=(typeof TAR_SURPRESA_BONUS!=='undefined')?TAR_SURPRESA_BONUS:2.00;
  let tarBonus=0,tarDone=0;
  TAREFAS_PADRAO.forEach(t=>{if(t.repetivel){const c=rep[t.id]||0;if(c>0){tarDone++;tarBonus+=t.bonus*c;}}else if(done[t.id]){tarDone++;tarBonus+=t.automatico?(placar[t.id]||t.bonus):t.bonus;}});
  if(done[surpresaId]){tarDone++;tarBonus+=surpresaBonus;}
  const texto=[
    `📊 *CEE JAY MODA — Resumo*`,`📅 ${periodLabel}`,'',
    `💰 *Financeiro*`,
    `Vendas: ${vendasP.length}`,`Total bruto: ${fmt(totalBruto)}`,`Comissões: ${fmt(totalCom)}`,`Líquido da loja: *${fmt(totalLiq)}*`,'',
    `⭐ *Tarefas*`,`Concluídas: ${tarDone}/${TAREFAS_PADRAO.length+1}`,`Bônus: *${fmt(tarBonus)}*`,
  ].join('\n');
  window.open('https://wa.me/?text='+encodeURIComponent(texto),'_blank');
};
