// ── HISTÓRICO ─────────────────────────────────────────────────────────────────
function getPeriodRange(period){
  const now=new Date();
  if(period==='today'){const s=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();return{start:s,end:Date.now()};}
  if(period==='week'){const day=now.getDay();const diff=now.getDate()-day+(day===0?-6:1);const s=new Date(now.getFullYear(),now.getMonth(),diff).getTime();return{start:s,end:Date.now()};}
  if(period==='month'){return{start:new Date(now.getFullYear(),now.getMonth(),1).getTime(),end:Date.now()};}
  if(period==='custom'){
    const from=$('hf-date-from').value;const to=$('hf-date-to').value;
    if(!from||!to)return null;
    const s=new Date(from+'T00:00:00').getTime();
    const e=new Date(to+'T23:59:59').getTime();
    return{start:s,end:e};
  }
  return null;
}
window.setHistPeriod=function(p){
  histPeriod=p;
  ['all','today','week','month','custom'].forEach(x=>{const el=$('hf-'+x);if(el)el.classList.toggle('active',x===p);});
  $('hf-custom-dates').style.display=p==='custom'?'block':'none';
  renderHist();playClick();
};
window.abrirHist=function(){
  const sellers=[...new Set(vendas.map(v=>v.vendedor).filter(Boolean))].sort();
  const sel=$('hf-seller');const cur=sel.value;
  sel.innerHTML='<option value="">Todos</option>'+sellers.map(s=>`<option value="${s}"${s===cur?' selected':''}>${s}</option>`).join('');
  renderHist();$('hist-ov').classList.add('open');
};
window.renderHist=function(){
  const sellerFilter=$('hf-seller').value;
  const range=getPeriodRange(histPeriod);
  let arr=vendas.filter(v=>{
    if(sellerFilter&&v.vendedor!==sellerFilter)return false;
    if(range&&(v.ts<range.start||v.ts>range.end))return false;
    return true;
  });
  histVendasFiltradas=arr;
  const sumBox=$('hist-summary');
  if(arr.length>0){
    sumBox.style.display='block';
    let totVend=0,totCom=0,comDesc=0,semDesc=0;
    arr.forEach(v=>{totVend+=(v.totalFinal||0);totCom+=(v.comissao||0);if(v.temDesconto||v.desconto>0)comDesc++;else semDesc++;});
    $('hs-count').textContent=arr.length+' venda(s)';
    $('hs-total').textContent=fmt(totVend);
    $('hs-desc').textContent=comDesc+' venda(s)';
    $('hs-nodesc').textContent=semDesc+' venda(s)';
    $('hs-com').textContent=fmt(totCom);
  }else{sumBox.style.display='none';}
  const c=$('hist-list');
  if(!arr.length){c.innerHTML='<div class="empty-st"><div class="empty-ico">📋</div><div class="empty-txt">Nenhuma venda neste filtro.</div></div>';return;}
  c.innerHTML=arr.slice(0,80).map(v=>{
    const d=new Date(v.ts);
    const ds=d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    const is=(v.itens||[]).map(i=>`${i.qtd}× ${i.nome}`).join(', ');
    const vend=v.vendedor?`<span class="hi-user">👤 ${v.vendedor}</span>`:'';
    const descTag=v.desconto>0?`<span class="disc-tag">-${v.desconto}%</span> `:'';
    return `<div class="hi">
      <button class="hi-del" onclick="apagarVenda('${v._key}')">🗑️</button>
      <div class="hi-head"><span class="hi-date">📅 ${ds}</span><span class="hi-total">${descTag}${fmt(v.totalFinal||v.subtotal||0)}</span></div>
      <div style="margin-bottom:4px">${vend}${v.clienteNome?`<span class="hi-user" style="background:rgba(39,174,96,.15);color:var(--green)">🧑 ${v.clienteNome}</span>`:''}</div>
      <div class="hi-items">${is}</div>
      <div class="hi-footer">${v.desconto>0?`<span>Desconto: ${v.desconto}%</span>`:''}<span style="color:var(--green)">Com: ${fmt(v.comissao||0)}</span><span>Líq: ${fmt(v.liquido||0)}</span></div>
    </div>`;
  }).join('');
};

