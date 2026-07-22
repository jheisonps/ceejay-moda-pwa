// ── SORT ──────────────────────────────────────────────────────────────────────
window.setSort=function(mode){
  sortMode=mode;
  $('sort-cod').classList.toggle('active',mode==='cod');
  $('sort-az').classList.toggle('active',mode==='az');
  renderProds();playClick();
};

// ── TIPO ESTOQUE ──────────────────────────────────────────────────────────────
window.setTipo=function(tipo){
  cadTipo=tipo;
  $('tipo-tam').classList.toggle('active',tipo==='tamanhos');
  $('tipo-uni').classList.toggle('active',tipo==='unico');
  $('bloco-tamanhos').style.display=tipo==='tamanhos'?'block':'none';
  $('bloco-unico').style.display=tipo==='unico'?'block':'none';
  playClick();
};
window.setEditTipo=function(tipo){
  editTipo=tipo;
  $('e-tipo-tam').classList.toggle('active',tipo==='tamanhos');
  $('e-tipo-uni').classList.toggle('active',tipo==='unico');
  $('e-bloco-tamanhos').style.display=tipo==='tamanhos'?'block':'none';
  $('e-bloco-unico').style.display=tipo==='unico'?'block':'none';
  playClick();
};

// ── PRODUTOS ──────────────────────────────────────────────────────────────────
// Migração: corrigir produtos com comissão 10% (valor antigo padrão) para 15%
window.migrarComissao=async function(){
  const antigos=Object.entries(produtos).filter(([,p])=>p.com===10);
  if(!antigos.length){toast('Nenhum produto com comissão 10% encontrado.');return;}
  abrirModal(
    '🔧 Corrigir comissão',
    `<b>${antigos.length} produto(s)</b> estão com comissão em <b>10%</b>.<br><br>Deseja corrigir todos para <b>15%</b>?`,
    [
      {label:'✅ Corrigir todos',cls:'modal-btn-green',fn:async()=>{
        dot.className='syncing';
        for(const [id] of antigos){
          await update(ref(db,'produtos/'+id),{com:15});
        }
        $('mig-banner').style.display='none';
        toast(`✅ ${antigos.length} produto(s) corrigido(s) para 15%!`);
      }},
      {label:'Cancelar',cls:'modal-btn-gray',fn:()=>{}}
    ]
  );
};

window.renderProds=function(){
  const q=($('srch').value||'').toLowerCase();
  const disc=gf('disc-global');
  const list=$('prod-list');
  let arr=Object.entries(produtos).map(([id,p])=>({id,...p}));
  if(sortMode==='az')arr.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  else arr.sort((a,b)=>parseInt(a.cod)-parseInt(b.cod));
  const filtered=q?arr.filter(p=>p.nome.toLowerCase().includes(q)||String(p.cod).padStart(3,'0').includes(q)):arr;
  $('prod-empty').style.display=arr.length===0?'flex':'none';
  // Banner de migração de comissão
  const temCom10=arr.some(p=>p.com===10);
  const mig=$('mig-banner');if(mig)mig.style.display=temCom10?'flex':'none';
  list.querySelectorAll('.prod-card').forEach(c=>c.remove());
  filtered.forEach(p=>{
    const cod=String(p.cod).padStart(3,'0');
    const comPct=p.com||COM_PADRAO;
    const comVal=p.valor*comPct/100;
    const discVal=disc>0?p.valor*(1-disc/100):null;
    const discComVal=disc>0?discVal*comPct/100:null;
    let estoqueHtml='';
    let hasNegative=false,hasLow=false;
    if(p.tipo==='unico'){
      const uniQty=p.uni||0;
      hasNegative=uniQty<0;hasLow=uniQty===1;
      const uniClass=uniQty<0?' negative':uniQty===1?' low':uniQty===0?' zero':'';
      estoqueHtml=`<div class="stock-total">Estoque: <b style="${uniQty<0?'color:var(--red)':uniQty===1?'color:#9a7a00':''}">${uniQty} UN</b>${uniQty<0?' <span class="stock-alert-badge">⚠️ NEGATIVO</span>':uniQty===1?' <span class="stock-warn-badge">⚠️ Último!</span>':''}</div>`;
    }else{
      const keys=['pp','p','m','g','gg','gp'];
      const total=keys.reduce((s,k)=>(p[k]||0)+s,0);
      keys.forEach(k=>{const q=p[k]||0;if(q<0)hasNegative=true;if(q===1)hasLow=true;});
      estoqueHtml=`<div class="stock-total">Estoque: <b style="${hasNegative?'color:var(--red)':''}">${total} UN</b>${hasNegative?' <span class="stock-alert-badge">⚠️ Tem tamanho negativo</span>':hasLow?' <span class="stock-warn-badge">⚠️ Tem tamanho com 1 unidade</span>':''}</div>
      <div class="sizes-row">${['PP','P','M','G','GG','G1+'].map((s,i)=>{
        const q2=p[['pp','p','m','g','gg','gp'][i]]||0;
        const cls=q2<0?' negative':q2===1?' low':q2===0?' zero':'';
        return `<div class="sz-chip${cls}"><span class="sz-lbl">${s}</span><span class="sz-qty">${q2}</span></div>`;
      }).join('')}</div>`;
    }
    const div=document.createElement('div');
    div.className='prod-card'+(hasNegative?' stock-alert':'');div.id='card-'+p.id;
    div.innerHTML=`
      <div class="prod-row-main" onclick="toggleCard('${p.id}');playClick()">
        <span class="prod-cod">${cod}</span>
        <div class="prod-info">
          <div class="prod-name">${p.nome}</div>
          <div class="prod-price-line">
            <span class="prod-price">${fmt(p.valor)}</span>
            <span class="prod-com-badge">vendedor ganha ${fmt(comVal)} com esta venda</span>
            ${hasNegative?`<span class="stock-alert-badge">⚠️ Estoque negativo</span>`:hasLow?`<span class="stock-warn-badge">⚠️ Estoque baixo</span>`:''}
          </div>
          ${disc>0?`<div class="prod-price-line" style="margin-top:3px">
            <span class="disc-badge">-${disc}% → ${fmt(discVal)}</span>
            <span class="disc-com-badge">se vender com ${disc}%, vendedor ganha de comissão ${fmt(discComVal)} por este produto</span>
          </div>`:''}
        </div>
        <span class="prod-chevron">▼</span>
      </div>
      <div class="prod-detail">${estoqueHtml}
        <div class="detail-btns">
          <button class="d-btn d-btn-edit" onclick="abrirEdit('${p.id}');playClick()">✏️ Editar</button>
          <button class="d-btn d-btn-del" onclick="editId='${p.id}';excluirProd()">🗑️ Excluir</button>
        </div>
      </div>`;
    list.appendChild(div);
  });
};
window.toggleCard=function(id){
  const c=$('card-'+id);
  document.querySelectorAll('.prod-card.expanded').forEach(x=>{if(x.id!=='card-'+id)x.classList.remove('expanded');});
  c.classList.toggle('expanded');
};

// ── EDITAR PRODUTO ────────────────────────────────────────────────────────────
window.abrirEdit=function(id){
  editId=id;const p=produtos[id];
  $('edit-title').textContent='✏️ '+p.nome;
  $('e-nome').value=p.nome;$('e-valor').value=p.valor;$('e-com').value=p.com||COM_PADRAO;
  if(p.tipo==='unico'){setEditTipo('unico');$('e-uni').value=p.uni||0;}
  else{setEditTipo('tamanhos');$('e-pp').value=p.pp||0;$('e-p').value=p.p||0;$('e-m').value=p.m||0;$('e-g').value=p.g||0;$('e-gg').value=p.gg||0;$('e-gp').value=p.gp||0;}
  $('edit-ov').classList.add('open');
};
window.salvarEdit=async function(){
  if(!editId)return;
  const nome=$('e-nome').value.trim();const valor=parseFloat($('e-valor').value)||0;
  if(!nome||valor<=0){toast('Preencha nome e valor.',false);return;}
  const base={...produtos[editId],nome,valor,com:parseFloat($('e-com').value)||COM_PADRAO};
  if(editTipo==='unico'){base.tipo='unico';base.uni=gi('e-uni');base.pp=0;base.p=0;base.m=0;base.g=0;base.gg=0;base.gp=0;}
  else{base.tipo='tamanhos';base.uni=0;base.pp=gi('e-pp');base.p=gi('e-p');base.m=gi('e-m');base.g=gi('e-g');base.gg=gi('e-gg');base.gp=gi('e-gp');}
  dot.className='syncing';
  await set(ref(db,'produtos/'+editId),base);
  fecharOv('edit-ov');toast('✅ Produto atualizado!');
};
window.excluirProd=async function(){
  if(!editId)return;
  if(!confirm('Excluir este produto?'))return;
  dot.className='syncing';
  await remove(ref(db,'produtos/'+editId));
  fecharOv('edit-ov');toast('🗑️ Removido');editId=null;
};

// ── CAD PRODUTO ───────────────────────────────────────────────────────────────
function updateNextCod(){
  const cods=Object.values(produtos).map(p=>parseInt(p.cod)||0);
  $('next-cod').textContent='COD #'+String((cods.length?Math.max(...cods):0)+1).padStart(3,'0');
}
window.updatePreview=function(){
  const v=gf('c-valor'),com=gf('c-com'),disc=gf('pv-disc');
  const prev=$('cad-preview');
  if(v>0){
    prev.style.display='block';
    $('pv-v').textContent=fmt(v);
    $('pv-c').textContent=fmt(v*com/100)+' ('+com+'%)';
    if(disc>0){
      const dv=v*(1-disc/100),dc=dv*com/100;
      $('pv-dv').textContent=fmt(dv);$('pv-dc').textContent=fmt(dc);
      $('pv-drow').style.display='flex';$('pv-crow').style.display='flex';
    }else{$('pv-drow').style.display='none';$('pv-crow').style.display='none';}
  }else{prev.style.display='none';}
};
window.cadastrar=async function(){
  const nome=$('c-nome').value.trim();const valor=gf('c-valor');
  if(!nome){toast('Digite o nome da peça.',false);return;}
  if(valor<=0){toast('Digite o valor.',false);return;}
  const cods=Object.values(produtos).map(p=>parseInt(p.cod)||0);
  const cod=(cods.length?Math.max(...cods):0)+1;
  dot.className='syncing';
  const nr=push(ref(db,'produtos'));
  const base={cod,nome,valor,com:gf('c-com')||COM_PADRAO,tipo:cadTipo};
  if(cadTipo==='unico'){base.uni=gi('c-uni');base.pp=0;base.p=0;base.m=0;base.g=0;base.gg=0;base.gp=0;}
  else{base.uni=0;base.pp=gi('c-pp');base.p=gi('c-p');base.m=gi('c-m');base.g=gi('c-g');base.gg=gi('c-gg');base.gp=gi('c-gp');}
  await set(nr,base);
  ['c-nome','c-valor','c-pp','c-p','c-m','c-g','c-gg','c-gp','c-uni'].forEach(id=>$(id).value='');
  $('c-com').value=COM_PADRAO;$('pv-disc').value='';
  $('cad-preview').style.display='none';setTipo('tamanhos');
  toast('✅ Produto #'+String(cod).padStart(3,'0')+' cadastrado!');goHome();
};

