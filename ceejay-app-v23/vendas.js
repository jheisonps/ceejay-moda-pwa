// ── VENDA ─────────────────────────────────────────────────────────────────────
window.addItem=function(){
  items.push({cod:'',nome:'',qtd:null,sz:null});renderItems();
  setTimeout(()=>{const inps=document.querySelectorAll('.vi-cod-inp');if(inps.length)inps[inps.length-1].focus();},80);
};
window.removeItem=function(i){items.splice(i,1);renderItems();playClick();};
function getProdByCod(cod){
  const c=parseInt(cod);if(!c)return null;
  return Object.values(produtos).find(p=>parseInt(p.cod)===c)||null;
}
function searchProds(q){
  q=q.toLowerCase().trim();if(!q)return[];
  return Object.values(produtos).filter(p=>p.nome.toLowerCase().includes(q)).slice(0,5);
}
function buildSzChips(i,p){
  if(!p||p.tipo==='unico')return '';
  const keys=['pp','p','m','g','gg','gp'];
  const labels=['PP','P','M','G','GG','G1+'];
  const sel=items[i].sz;
  const chips=keys.map((k,idx)=>{
    const qty=p[k]||0;
    const isSel=sel===k;
    const isZero=qty===0;
    return `<div class="vi-sz-chip${isSel?' selected':''}${isZero?' zero':''}" onclick="updSz(${i},'${k}')">${labels[idx]}<span class="vi-sz-stock">${qty} un</span></div>`;
  }).join('');
  return `<div class="vi-sz-row"><div class="vi-sz-lbl">📏 Tamanho</div><div class="vi-sz-chips">${chips}</div></div>`;
}
function renderItems(){
  const w=$('vi-wrap');
  if(!items.length){w.innerHTML='<div style="text-align:center;padding:16px 0;color:var(--text3);font-size:13px">Nenhum item. Toque em + para adicionar.</div>';calcTotals();return;}
  w.innerHTML=items.map((it,i)=>{
    const p=it.cod?getProdByCod(it.cod):null;
    const unit=p?p.valor:0;const comPct=p?(p.com||COM_PADRAO):COM_PADRAO;
    const qtd=it.qtd;const total=unit*(qtd||0);const com=total*comPct/100;
    const szHtml=p&&p.tipo!=='unico'?buildSzChips(i,p):'';
    return `<div class="vi">
      <button class="vi-rm" onclick="removeItem(${i})">×</button>
      <div class="vi-top">
        <div><div class="vi-lbl">Código</div>
          <input class="vi-inp vi-cod-inp${p?' found':''}" type="number" inputmode="numeric" placeholder="001"
            value="${it.cod||''}" oninput="updCod(${i},this.value)" style="text-align:center;font-weight:800;font-size:15px;padding:7px 4px"></div>
        <div style="position:relative"><div class="vi-lbl">${p?'✅ Produto':'Nome do produto'}</div>
          <div class="ac-wrap">
            <input class="vi-inp${p?' found':''}" type="text" placeholder="ou escreva o nome..."
              value="${p?p.nome:(it.nome||'')}" oninput="updNome(${i},this.value)"
              style="font-size:13px;padding:7px 8px;${p?'color:var(--text);font-weight:700':''}">
            <div class="ac-drop" id="ac-${i}" style="display:none"></div>
          </div></div>
        <div><div class="vi-lbl">Qtd.</div>
          <input class="vi-inp" type="number" inputmode="numeric" placeholder="0" min="1"
            value="${qtd!==null?qtd:''}" oninput="updQtd(${i},this.value)" style="text-align:center;font-weight:800;font-size:15px;padding:7px 4px"></div>
      </div>
      <div class="vi-bot">
        <div><div class="vi-lbl">Preço unit.</div><div class="vi-dsp gold">${unit>0?fmt(unit):'—'}</div></div>
        <div><div class="vi-lbl">Comissão</div>
          <div class="vi-dsp" style="color:var(--green);font-weight:800">${com>0?fmt(com):'—'}</div></div>
      </div>
      ${szHtml}
    </div>`;
  }).join('');
  calcTotals();
}
window.updCod=function(i,val){items[i].cod=val;items[i].nome='';items[i].sz=null;renderItems();};
window.updNome=function(i,val){
  items[i].nome=val;items[i].cod='';items[i].sz=null;
  const drop=$('ac-'+i);if(!drop)return;
  const results=val.length>=1?searchProds(val):[];
  if(results.length){
    drop.style.display='block';
    drop.innerHTML=results.map(p=>`<div class="ac-item" onclick="pickProd(${i},${p.cod});playClick()">
      <span>${p.nome}</span><span class="ac-cod">#${String(p.cod).padStart(3,'0')}</span></div>`).join('');
  }else{drop.style.display='none';}
  calcTotals();
};
window.pickProd=function(i,cod){items[i].cod=String(cod);items[i].nome='';items[i].sz=null;renderItems();};
window.updQtd=function(i,val){items[i].qtd=parseInt(val)||null;calcTotals();};
window.updSz=function(i,sz){items[i].sz=sz;renderItems();playClick();};
window.calcTotals=function(){
  let sub=0,com=0;
  items.forEach(it=>{const p=getProdByCod(it.cod);if(!p||!it.qtd)return;const t=p.valor*it.qtd;sub+=t;com+=t*(p.com||COM_PADRAO)/100;});
  $('tb-sub').textContent=fmt(sub);$('tb-com').textContent=fmt(com);$('tb-liq').textContent=fmt(sub-com);
  const disc=gf('disc-venda');const dp=$('disc-preview');
  if(disc>0&&sub>0){
    const sd=sub*(1-disc/100),cd=com*(1-disc/100);
    $('dp-total').textContent=fmt(sd);$('dp-com').textContent=fmt(cd);$('dp-liq').textContent=fmt(sd-cd);
    dp.style.display='block';
  }else{dp.style.display='none';}
};
window.finalizarVenda=async function(){
  if(!items.length){toast('Adicione ao menos um produto.',false);return;}
  if(!currentUser){toast('⚠️ Defina seu nome em ⚙️.',false);return;}
  for(const it of items){
    const p=getProdByCod(it.cod);
    if(!p){toast('Produto não encontrado: '+it.cod,false);return;}
    if(!it.qtd||it.qtd<1){toast('Informe a quantidade.',false);return;}
    if(p.tipo!=='unico'&&!it.sz){toast('Selecione o tamanho de: '+p.nome,false);return;}
  }
  let sub=0,com=0;const disc=gf('disc-venda');
  const szLabels={'pp':'PP','p':'P','m':'M','g':'G','gg':'GG','gp':'G1+'};
  const itens=items.map(it=>{const p=getProdByCod(it.cod);const t=p.valor*it.qtd;sub+=t;com+=t*(p.com||COM_PADRAO)/100;
    return{cod:it.cod,nome:p.nome,qtd:it.qtd,unitario:p.valor,total:t,tamanho:it.sz?szLabels[it.sz]:'Único'};
  });
  const totalFinal=disc>0?sub*(1-disc/100):sub;
  const comFinal=disc>0?com*(1-disc/100):com;
  dot.className='syncing';
  // Salvar venda
  await push(ref(db,'vendas'),{ts:Date.now(),vendedor:currentUser,clienteId:vendaClienteId||null,clienteNome:vendaClienteNome||null,itens,subtotal:sub,desconto:disc||0,temDesconto:disc>0,totalFinal,comissao:comFinal,liquido:totalFinal-comFinal});
  // Dar baixa no estoque
  for(const it of items){
    const p=getProdByCod(it.cod);
    if(!p)continue;
    const prodId=Object.keys(produtos).find(k=>parseInt(produtos[k].cod)===parseInt(it.cod));
    if(!prodId)continue;
    if(p.tipo==='unico'){
      const novoUni=Math.max(0,(p.uni||0)-it.qtd);
      await update(ref(db,'produtos/'+prodId),{uni:novoUni});
    }else{
      const sz=it.sz;
      if(sz){
        const atual=p[sz]||0;
        const novo=Math.max(0,atual-it.qtd);
        await update(ref(db,'produtos/'+prodId),{[sz]:novo});
      }
    }
  }
  items=[];$('disc-venda').value='';renderItems();limparCliVenda();playCash();
  // Verificar alertas de estoque após a venda
  const alertas=[];
  for(const it of itens){
    const prodId=Object.keys(produtos).find(k=>parseInt(produtos[k].cod)===parseInt(it.cod));
    if(!prodId)continue;
    const p=produtos[prodId];
    if(p.tipo==='unico'){
      const novoQty=(p.uni||0)-it.qtd;
      if(novoQty<0)alertas.push(`⚠️ ${p.nome}: estoque NEGATIVO (${novoQty})`);
      else if(novoQty===1)alertas.push(`⚠️ ${p.nome}: só 1 unidade restante`);
    }else if(it.tamanho!=='Único'){
      const szMap={'PP':'pp','P':'p','M':'m','G':'g','GG':'gg','G1+':'gp'};
      const szKey=szMap[it.tamanho];
      if(szKey){const novoQty=(p[szKey]||0)-it.qtd;if(novoQty<0)alertas.push(`⚠️ ${p.nome} (${it.tamanho}): estoque NEGATIVO`);else if(novoQty===1)alertas.push(`⚠️ ${p.nome} (${it.tamanho}): só 1 restante`);}
    }
  }
  if(alertas.length){setTimeout(()=>toast(alertas[0],false),1000);}
  else{toast('✅ Venda registrada!');}
};

// ── CLIENTE NA VENDA ──────────────────────────────────────────────────────────
let vendaClienteId=null;
let vendaClienteNome=null;

window.buscarCliVenda=function(q){
  const drop=$('venda-cli-drop');
  // Limpar seleção se usuário apagar
  if(vendaClienteId){vendaClienteId=null;vendaClienteNome=null;$('venda-cli-inp').classList.remove('selected');$('venda-cli-tag').style.display='none';$('venda-cli-clear').style.display='none';}
  if(!q||q.trim().length<1){drop.style.display='none';return;}
  const arr=Object.entries(clientes).map(([id,c])=>({id,...c}))
    .filter(c=>c.nome.toLowerCase().includes(q.toLowerCase()))
    .slice(0,6);
  if(!arr.length){drop.style.display='none';return;}
  drop.style.display='block';
  drop.innerHTML=
    `<div class="venda-cli-novo" onclick="cadastrarCliRapido()">➕ Cadastrar "${q}" como novo cliente</div>`+
    arr.map(c=>`<div class="ac-item" onclick="selecionarCliVenda('${c.id}','${c.nome.replace(/'/g,"\\'")}')">
      <span>${c.nome}</span>${c.tel?`<span class="ac-cod">${c.tel}</span>`:''}
    </div>`).join('');
};

window.selecionarCliVenda=function(id,nome){
  vendaClienteId=id;vendaClienteNome=nome;
  const inp=$('venda-cli-inp');
  inp.value=nome;inp.classList.add('selected');
  $('venda-cli-drop').style.display='none';
  $('venda-cli-clear').style.display='inline';
  const cli=clientes[id];
  let tag='✅ Cliente vinculado';
  if(cli&&cli.tel)tag+=` · 📱 ${cli.tel}`;
  if(cli&&cli.idade)tag+=` · 🎂 ${cli.idade} anos`;
  const tagEl=$('venda-cli-tag');tagEl.textContent=tag;tagEl.style.display='block';
  playClick();
};

window.limparCliVenda=function(){
  vendaClienteId=null;vendaClienteNome=null;
  const inp=$('venda-cli-inp');inp.value='';inp.classList.remove('selected');
  $('venda-cli-drop').style.display='none';
  $('venda-cli-clear').style.display='none';
  $('venda-cli-tag').style.display='none';
  inp.focus();
};

window.cadastrarCliRapido=function(){
  const nome=$('venda-cli-inp').value.trim();
  if(!nome)return;
  abrirModal(
    '👤 Cadastrar cliente',
    `Cadastrar <b>${nome}</b> como novo cliente?`,
    [
      {label:'✅ Sim',cls:'modal-btn-green',fn:async()=>{
        const nr=push(ref(db,'clientes'));
        await set(nr,{nome,tel:'',idade:0,nascimento:'',end:'',ts:Date.now()});
        const id=nr.key;
        // Aguarda um tick para o listener do Firebase atualizar clientes
        setTimeout(()=>selecionarCliVenda(id,nome),300);
        toast('✅ Cliente cadastrado e vinculado!');
      }},
      {label:'Cancelar',cls:'modal-btn-gray',fn:()=>{}}
    ]
  );
};

