import{initializeApp}from'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import{getDatabase,ref,set,push,remove,onValue,update}from'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const firebaseConfig={
  apiKey:"AIzaSyCZJ4Y6qgx6G6YxjG3bIEKhBV1WTB3Yd2M",
  authDomain:"ceejay-moda.firebaseapp.com",
  databaseURL:"https://ceejay-moda-default-rtdb.firebaseio.com",
  projectId:"ceejay-moda",
  storageBucket:"ceejay-moda.firebasestorage.app",
  messagingSenderId:"509801249168",
  appId:"1:509801249168:web:ed64cb64975be3220adb15"
};
const app=initializeApp(firebaseConfig);
const db=getDatabase(app);
const dot=document.getElementById('sync-dot');

const COM_PADRAO=15;

// ── TAREFAS FIXAS ─────────────────────────────────────────────────────────────
const TAREFAS_PADRAO=[
  // Fase 1: Abrindo a Loja
  {id:'t01',cat:'Fase 1: Abertura',nome:'🏢 Portas Abertas',desc:'Postar o primeiro Story do dia escrito "Loja Aberta". Compartilhe o link do Story no grupo de WhatsApp da loja.',bonus:0.25,whatsapp:true},
  {id:'t02',cat:'Fase 1: Abertura',nome:'🏢 Loja Padrão VIP',desc:'Limpar e organizar a loja. Exige upload de um vídeo de 5 segundos (estilo Boomerang) da loja arrumada.',bonus:0.50,upload:'video'},
  {id:'t03',cat:'Fase 1: Abertura',nome:'🏢 Vitrine Combinada',desc:'Mudar o look do manequim principal. Exige upload da foto do manequim.',bonus:0.38,upload:'foto'},
  // Fase 2: Cadastro de Clientes
  {id:'t04',cat:'Fase 2: Clientes',nome:'👥 Primeiro Cliente',desc:'Cadastrar o 1º cliente novo na aba Clientes do app.',bonus:0.13},
  {id:'t05',cat:'Fase 2: Clientes',nome:'👥 Segundo Cliente',desc:'Cadastrar o 2º cliente novo na aba Clientes do app.',bonus:0.13},
  {id:'t06',cat:'Fase 2: Clientes',nome:'👥 Terceiro Cliente',desc:'Cadastrar o 3º cliente novo na aba Clientes do app.',bonus:0.13},
  {id:'t07',cat:'Fase 2: Clientes',nome:'👥 Cliente Extra',desc:'Cada cliente cadastrado além dos 3 primeiros vale +R$ 0,13. Para marcar mais de uma vez: marque, desmarque e marque novamente.',bonus:0.13,repetivel:true},
  // Fase 3: Stories no Instagram
  {id:'t08',cat:'Fase 3: Instagram',nome:'📸 Peça de Destaque',desc:'Story de um produto com preço e tamanhos visíveis.',bonus:0.05},
  {id:'t09',cat:'Fase 3: Instagram',nome:'📸 Próximo Round',desc:'Postar outra peça com intervalo mínimo de 40 minutos da anterior.',bonus:0.05},
  {id:'t10',cat:'Fase 3: Instagram',nome:'📸 Visual Completo',desc:'Postar um look combinado nos Stories.',bonus:0.05},
  {id:'t11',cat:'Fase 3: Instagram',nome:'📸 Batalha de Estilos',desc:'Postar dois produtos lado a lado com enquete do Instagram.',bonus:0.13},
  {id:'t12',cat:'Fase 3: Instagram',nome:'📸 Últimas Unidades',desc:'Story criando escassez ("Últimas peças no G!").',bonus:0.05},
  {id:'t13',cat:'Fase 3: Instagram',nome:'📸 Foto de Estilo',desc:'Foto estilosa focando nos detalhes de uma peça (no espelho ou em outro ponto da loja). Exige upload da foto.',bonus:0.05,upload:'foto'},
  // Fase 4: Vídeos e Mensagens
  {id:'t14',cat:'Fase 4: Vídeos',nome:'🎬 Giro na Loja (Reels)',desc:'Postar Reels curto (15–30s) das araras/balcão com áudio em alta.',bonus:0.13},
  {id:'t15',cat:'Fase 4: Vídeos',nome:'🎬 Caixa Secreta: Novidades',desc:'Missão Especial (ativa apenas em dias de mercadoria nova). Gravar unboxing/spoilers das peças que chegaram.',bonus:0.38,especial:true},
  {id:'t16',cat:'Fase 4: Vídeos',nome:'🎬 Inbox Limpo',desc:'Responder todos os Directs e comentários antes de fechar.',bonus:0.25},
  // Fase 5: Resultados e Fechamento
  {id:'t17',cat:'Fase 5: Resultados',nome:'🚀 Placar de Seguidores',desc:'Ativa das 13h às 18h. Anote os seguidores do @ceejaymoda ao começar e ao terminar o horário. Cada seguidor ganho vale R$ 0,03 de bônus (máx R$ 2,50). Clique em "Calcular e Registrar" ao fim.',bonus:2.50,automatico:true},
  {id:'t18',cat:'Fase 5: Resultados',nome:'🚀 Venda Casada',desc:'Cliente levar mais de uma peça na mesma compra. R$ 0,50 por ocorrência — missão repetível.',bonus:0.50,repetivel:true},
  {id:'t19',cat:'Fase 5: Resultados',nome:'🚀 Chefão do Dia',desc:'Meta do dia: vender pelo menos 3 produtos no dia (somando todas as vendas registradas no app). Quando atingir, marque como concluída!',bonus:1.00},
  {id:'t20',cat:'Fase 5: Resultados',nome:'🚀 Fim de Jogo',desc:'Postar Story de encerramento, trancar a loja e finalizar o dia no app.',bonus:0.05},
];

// STATE
let produtos={};
let vendas=[];
let items=[];
let editId=null;
let sortMode='cod';
let cadTipo='tamanhos';
let editTipo='tamanhos';
let histPeriod='all';
let histVendasFiltradas=[];
let tarFilter='all';
let cadFotos=[];
let editFotos=[];
const MAX_FOTOS=3;
// tarefasDone: { "YYYY-MM-DD_userId": { t01: true, t03: true, ... } }
let tarefasDone={};
let tarefasRep={}; // acumulador permanente de missões repetíveis
let placarBonusData={}; // bonus calculado do placar de seguidores

let currentUser=localStorage.getItem('cj_nome')||'';

const $=id=>document.getElementById(id);
const fmt=v=>'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const gf=id=>parseFloat($(id).value)||0;
const gi=id=>parseInt($(id).value)||0;

// Imagem de fundo/logo como arquivo separado (cacheável e leve)
const BG_SRC='bg.jpg';
document.getElementById('splash-bg').style.backgroundImage=`url('${BG_SRC}')`;
document.getElementById('home-bg').style.backgroundImage=`url('${BG_SRC}')`;
document.getElementById('hlogo-img').src=BG_SRC;

function toast(msg,ok=true){
  const t=$('toast');t.textContent=msg;
  t.style.background=ok?'#1A1A1A':'#8B0000';
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400);
}
window.fecharOv=id=>$(id).classList.remove('open');

// ── CONFIG ────────────────────────────────────────────────────────────────────
function refreshUserDisplay(){
  $('user-name-display').textContent=currentUser||'⚠️ Defina seu nome (⚙️)';
}
window.abrirConfig=function(){$('cfg-nome').value=currentUser;$('config-ov').classList.add('open');};
window.salvarConfig=function(){
  const nome=$('cfg-nome').value.trim();
  if(!nome){toast('Digite seu nome.',false);return;}
  currentUser=nome;localStorage.setItem('cj_nome',nome);
  refreshUserDisplay();fecharOv('config-ov');toast('✅ Nome salvo: '+nome);
};

// ── COMPARTILHAR ──────────────────────────────────────────────────────────────
window.compartilharApp=function(){
  const url='https://ceejay-app2.pages.dev';
  if(navigator.share){navigator.share({title:'Cee Jay Moda',text:'App da Cee Jay Moda',url}).catch(()=>{});}
  else{navigator.clipboard.writeText(url).then(()=>toast('🔗 Link copiado!')).catch(()=>{});}
};

window.compartilharHistorico=function(){
  if(!histVendasFiltradas.length){toast('Nenhuma venda.',false);return;}
  const sel=$('hf-seller').value;
  const perMap={all:'Tudo',today:'Hoje',week:'Semana',month:'Mês',custom:'Período personalizado'};
  let totVend=0,totCom=0;
  const linhas=histVendasFiltradas.map(v=>{
    const d=new Date(v.ts);
    const ds=d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    const itens=(v.itens||[]).map(i=>`  ${i.qtd}x ${i.nome}`).join('\n');
    const desc=v.desconto>0?` (-${v.desconto}%)`:'';
    totVend+=(v.totalFinal||0);totCom+=(v.comissao||0);
    return `📅 ${ds}${v.vendedor?' | '+v.vendedor:''}\n${itens}\n💰 Total: ${fmt(v.totalFinal||0)}${desc} | Com: ${fmt(v.comissao||0)}`;
  }).join('\n─────────\n');
  const txt=`*Cee Jay — Histórico*\n${sel?'Vendedor: '+sel+'\n':''}Período: ${perMap[histPeriod]||''}\n─────────\n${linhas}\n─────────\n*Total: ${fmt(totVend)}*\n*Comissão: ${fmt(totCom)}*`;
  if(navigator.share){navigator.share({title:'Histórico Cee Jay',text:txt}).catch(()=>{});}
  else{navigator.clipboard.writeText(txt).then(()=>toast('📋 Copiado!')).catch(()=>{});}
};

// ── MODAL CUSTOMIZADO ─────────────────────────────────────────────────────────
function abrirModal(titulo, corpo, botoes){
  $('modal-title').textContent=titulo;
  $('modal-body').innerHTML=corpo;
  const btnsEl=$('modal-btns');
  btnsEl.innerHTML='';
  botoes.forEach(b=>{
    const btn=document.createElement('button');
    btn.className='modal-btn '+b.cls;
    btn.textContent=b.label;
    btn.onclick=()=>{fecharModal();b.fn();};
    btnsEl.appendChild(btn);
  });
  $('modal-overlay').style.display='flex';
}
window.fecharModal=function(){$('modal-overlay').style.display='none';};

window.apagarFiltrados=function(){
  if(!histVendasFiltradas.length){toast('Nenhuma venda.',false);return;}
  abrirModal(
    '🗑️ Apagar vendas filtradas',
    `Apagar <b>${histVendasFiltradas.length} venda(s)</b>?<br>Os produtos <b>não</b> voltarão ao estoque.`,
    [
      {label:'Sim, apagar tudo',cls:'modal-btn-red',fn:()=>{
        histVendasFiltradas.forEach(v=>{if(v._key)remove(ref(db,'vendas/'+v._key));});
        toast('🗑️ Vendas apagadas');
      }},
      {label:'Cancelar',cls:'modal-btn-gray',fn:()=>{}}
    ]
  );
};

window.apagarVenda=function(key){
  const venda=vendas.find(v=>v._key===key);
  if(!venda){toast('Venda não encontrada.',false);return;}
  const itensDesc=venda.itens?venda.itens.map(it=>`• ${it.nome} ×${it.qtd}${it.tamanho&&it.tamanho!=='Único'?' ('+it.tamanho+')':''}`).join('<br>'):'';
  abrirModal(
    '🗑️ Apagar venda',
    `${itensDesc?itensDesc+'<br><br>':''}Os produtos devem voltar ao estoque?`,
    [
      {label:'✅ Sim — devolver ao estoque',cls:'modal-btn-green',fn:async()=>{
        await remove(ref(db,'vendas/'+key));
        if(venda.itens&&venda.itens.length){
          const szMap={'PP':'pp','P':'p','M':'m','G':'g','GG':'gg','G1+':'gp','Único':'uni'};
          for(const it of venda.itens){
            const prodId=Object.keys(produtos).find(k=>parseInt(produtos[k].cod)===parseInt(it.cod));
            if(!prodId)continue;
            const p=produtos[prodId];
            const szKey=szMap[it.tamanho]||'uni';
            const atual=p[szKey]||0;
            await update(ref(db,'produtos/'+prodId),{[szKey]:atual+it.qtd});
          }
          toast('✅ Venda apagada — estoque restaurado!');
        }else{toast('🗑️ Venda apagada');}
      }},
      {label:'❌ Não — só apagar o registro',cls:'modal-btn-red',fn:async()=>{
        await remove(ref(db,'vendas/'+key));
        toast('🗑️ Venda apagada');
      }},
      {label:'Cancelar',cls:'modal-btn-gray',fn:()=>{}}
    ]
  );
};

// ── SYNC ──────────────────────────────────────────────────────────────────────
onValue(ref(db,'produtos'),snap=>{
  dot.className='online';
  produtos=snap.val()||{};
  renderProds();updateNextCod();
},()=>dot.className='offline');

onValue(ref(db,'vendas'),snap=>{
  vendas=[];
  const v=snap.val()||{};
  Object.entries(v).forEach(([k,x])=>vendas.push({_key:k,...x}));
  vendas.sort((a,b)=>b.ts-a.ts);
  if($('hist-ov').classList.contains('open'))renderHist();
  if($('pane-resumo').classList.contains('active'))renderResumo();
});

onValue(ref(db,'tarefas'),snap=>{
  tarefasDone=snap.val()||{};
  renderTarefas();
});
onValue(ref(db,'tarefasRep'),snap=>{
  tarefasRep=snap.val()||{};
  renderTarefas();
});
onValue(ref(db,'placarBonus'),snap=>{
  placarBonusData=snap.val()||{};
  renderTarefas();
});

// ── NAVEGAÇÃO ─────────────────────────────────────────────────────────────────
function showInternalUI(show){
  $('header').classList.toggle('visible',show);
  $('tabs').classList.toggle('visible',show);
}
window.switchTab=function(tab,btn){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active'));
  $('pane-'+tab).classList.add('active');
  showInternalUI(true);playClick();
  if(tab==='resumo')renderResumo();
};
window.goHome=function(){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active'));
  $('pane-home').classList.add('active');showInternalUI(false);
};
window.navTo=function(tab){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active'));
  $('pane-'+tab).classList.add('active');
  const map={prod:0,venda:1,tarefas:2,resumo:3,clientes:4,cad:5};
  const btns=document.querySelectorAll('.tab-btn');
  if(btns[map[tab]]!==undefined)btns[map[tab]].classList.add('active');
  showInternalUI(true);playClick();
  if(tab==='resumo')renderResumo();
};

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

// ── FOTOS DO PRODUTO (até 3, com galeria, troca, exclusão e download) ───────
function comprimirImagem(file,maxDim=1600,quality=0.92){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('Falha ao ler arquivo'));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error('Falha ao carregar imagem'));
      img.onload=()=>{
        let w=img.width,h=img.height;
        if(w>h&&w>maxDim){h=Math.round(h*maxDim/w);w=maxDim;}
        else if(h>maxDim){w=Math.round(w*maxDim/h);h=maxDim;}
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg',quality));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Slots de foto usados no formulário de Cadastro e na Edição (estado local, só salva ao confirmar)
function renderFotoSlots(ctx){
  const arr=ctx==='cad'?cadFotos:editFotos;
  const wrap=$(ctx==='cad'?'c-foto-slots':'e-foto-slots');
  if(!wrap)return;
  let html='';
  arr.forEach((foto,i)=>{
    html+=`<div class="foto-slot">
      <img src="${foto}" onclick="abrirImagemGrandeLocal('${ctx}',${i})">
      <div class="foto-slot-actions">
        <button onclick="event.stopPropagation();trocarFotoSlot('${ctx}',${i})" title="Trocar">🔄</button>
        <button onclick="event.stopPropagation();excluirFotoSlotLocal('${ctx}',${i})" title="Excluir">🗑️</button>
      </div>
    </div>`;
  });
  if(arr.length<MAX_FOTOS){
    html+=`<div class="foto-slot empty" onclick="adicionarFotoSlot('${ctx}')">
      <span class="foto-slot-plus">+</span>
      <span class="foto-slot-label">Adicionar foto</span>
    </div>`;
  }
  wrap.innerHTML=html;
}
function wireFotoInput(id){
  const inp=$(id);
  if(!inp)return;
  inp.onchange=async function(){
    const file=this.files&&this.files[0];
    if(!file)return;
    if(!file.type.startsWith('image/')){toast('Selecione um arquivo de imagem.',false);this.value='';return;}
    const ctx=this.dataset.ctx,mode=this.dataset.mode,idx=this.dataset.index;
    try{
      toast('📷 Processando foto...');
      const dataUrl=await comprimirImagem(file);
      const arr=ctx==='cad'?cadFotos:editFotos;
      if(mode==='add'){if(arr.length<MAX_FOTOS)arr.push(dataUrl);}
      else if(mode==='trocar'){arr[parseInt(idx)]=dataUrl;}
      renderFotoSlots(ctx);
      toast('✅ Foto pronta!');playClick();
    }catch(e){toast('Não foi possível processar a foto.',false);}
    this.value='';
  };
}
window.adicionarFotoSlot=function(ctx){
  const inp=$(ctx==='cad'?'c-foto-input':'e-foto-input');
  inp.dataset.ctx=ctx;inp.dataset.mode='add';delete inp.dataset.index;
  inp.click();
};
window.trocarFotoSlot=function(ctx,i){
  const inp=$(ctx==='cad'?'c-foto-input':'e-foto-input');
  inp.dataset.ctx=ctx;inp.dataset.mode='trocar';inp.dataset.index=i;
  inp.click();
};
window.excluirFotoSlotLocal=function(ctx,i){
  const arr=ctx==='cad'?cadFotos:editFotos;
  arr.splice(i,1);
  renderFotoSlots(ctx);playClick();
};

// Galeria de fotos já salvas no produto (aba Produtos), com ações direto no banco
function renderProdFotoGallery(p){
  const fotos=p.fotos||(p.foto?[p.foto]:[]);
  let html='<div class="prod-foto-gallery">';
  fotos.forEach((foto,i)=>{
    html+=`<div class="prod-foto-item" onclick="event.stopPropagation();abrirImagemGrandeDB('${p.id}',${i})"><img src="${foto}"></div>`;
  });
  if(fotos.length<MAX_FOTOS){
    html+=`<div class="prod-foto-item prod-foto-add" onclick="event.stopPropagation();adicionarFotoProdutoDB('${p.id}')">
      <span class="foto-slot-plus">+</span><span class="foto-slot-label">Adicionar</span>
    </div>`;
  }
  html+='</div>';
  return html;
}
window.adicionarFotoProdutoDB=function(prodId){
  const inp=$('lightbox-file-input');
  inp.onchange=async function(){
    const file=this.files&&this.files[0];
    if(!file)return;
    if(!file.type.startsWith('image/')){toast('Selecione um arquivo de imagem.',false);this.value='';return;}
    try{
      toast('📷 Processando foto...');
      const dataUrl=await comprimirImagem(file);
      const p=produtos[prodId];
      const fotos=(p.fotos||(p.foto?[p.foto]:[])).slice();
      if(fotos.length>=MAX_FOTOS){toast('Este produto já tem 3 fotos.',false);this.value='';return;}
      fotos.push(dataUrl);
      dot.className='syncing';
      await update(ref(db,'produtos/'+prodId),{fotos,foto:null});
      toast('✅ Foto adicionada!');playClick();
    }catch(e){toast('Não foi possível processar a foto.',false);}
    this.value='';
  };
  inp.click();
};

// ── LIGHTBOX (visualização em tamanho grande, com navegação e ações) ────────
let lightboxCtx=null; // {mode:'local',ctx,index} | {mode:'db',prodId,index}
function lightboxGetArr(){
  if(!lightboxCtx)return[];
  if(lightboxCtx.mode==='local')return lightboxCtx.ctx==='cad'?cadFotos:editFotos;
  const p=produtos[lightboxCtx.prodId];
  return p?(p.fotos||(p.foto?[p.foto]:[])):[];
}
function renderLightbox(){
  const arr=lightboxGetArr();
  if(!arr.length){fecharImagemGrande();return;}
  if(lightboxCtx.index>=arr.length)lightboxCtx.index=arr.length-1;
  if(lightboxCtx.index<0)lightboxCtx.index=0;
  $('img-lightbox-img').src=arr[lightboxCtx.index];
  const multi=arr.length>1;
  $('lightbox-prev').style.display=multi?'flex':'none';
  $('lightbox-next').style.display=multi?'flex':'none';
  $('lightbox-counter').textContent=multi?(lightboxCtx.index+1)+' / '+arr.length:'';
  $('lightbox-counter').style.display=multi?'block':'none';
}
window.abrirImagemGrandeLocal=function(ctx,index){
  lightboxCtx={mode:'local',ctx,index};
  renderLightbox();$('img-lightbox').classList.add('open');
};
window.abrirImagemGrandeDB=function(prodId,index){
  lightboxCtx={mode:'db',prodId,index};
  renderLightbox();$('img-lightbox').classList.add('open');
};
window.fecharImagemGrande=function(){
  $('img-lightbox').classList.remove('open');
  lightboxCtx=null;
};
window.lightboxNav=function(delta){
  if(!lightboxCtx)return;
  const arr=lightboxGetArr();
  if(!arr.length)return;
  lightboxCtx.index=(lightboxCtx.index+delta+arr.length)%arr.length;
  renderLightbox();
};
window.lightboxBaixar=function(){
  const arr=lightboxGetArr();
  if(!arr.length||!lightboxCtx)return;
  const dataUrl=arr[lightboxCtx.index];
  let nomeArquivo='foto-produto.jpg';
  if(lightboxCtx.mode==='db'){
    const p=produtos[lightboxCtx.prodId];
    if(p)nomeArquivo=`produto-${String(p.cod).padStart(3,'0')}-${lightboxCtx.index+1}.jpg`;
  }
  const a=document.createElement('a');
  a.href=dataUrl;a.download=nomeArquivo;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  toast('⬇️ Baixando foto...');
};
window.lightboxTrocar=function(){
  if(!lightboxCtx)return;
  const inp=$('lightbox-file-input');
  inp.onchange=async function(){
    const file=this.files&&this.files[0];
    if(!file)return;
    if(!file.type.startsWith('image/')){toast('Selecione um arquivo de imagem.',false);this.value='';return;}
    try{
      toast('📷 Processando foto...');
      const dataUrl=await comprimirImagem(file);
      if(lightboxCtx.mode==='local'){
        const arr=lightboxCtx.ctx==='cad'?cadFotos:editFotos;
        arr[lightboxCtx.index]=dataUrl;
        renderFotoSlots(lightboxCtx.ctx);
      }else{
        const p=produtos[lightboxCtx.prodId];
        const fotos=(p.fotos||(p.foto?[p.foto]:[])).slice();
        fotos[lightboxCtx.index]=dataUrl;
        dot.className='syncing';
        await update(ref(db,'produtos/'+lightboxCtx.prodId),{fotos,foto:null});
      }
      renderLightbox();
      toast('✅ Foto atualizada!');playClick();
    }catch(e){toast('Não foi possível processar a foto.',false);}
    this.value='';
  };
  inp.click();
};
window.lightboxExcluir=function(){
  if(!lightboxCtx)return;
  abrirModal(
    '🗑️ Excluir foto',
    'Deseja excluir esta foto?',
    [
      {label:'Sim, excluir',cls:'modal-btn-red',fn:async()=>{
        if(lightboxCtx.mode==='local'){
          const arr=lightboxCtx.ctx==='cad'?cadFotos:editFotos;
          arr.splice(lightboxCtx.index,1);
          renderFotoSlots(lightboxCtx.ctx);
        }else{
          const p=produtos[lightboxCtx.prodId];
          const fotos=(p.fotos||(p.foto?[p.foto]:[])).slice();
          fotos.splice(lightboxCtx.index,1);
          dot.className='syncing';
          await update(ref(db,'produtos/'+lightboxCtx.prodId),{fotos,foto:null});
        }
        const arrAfter=lightboxGetArr();
        if(!arrAfter.length)fecharImagemGrande();
        else{if(lightboxCtx.index>=arrAfter.length)lightboxCtx.index=arrAfter.length-1;renderLightbox();}
        toast('🗑️ Foto excluída');
      }},
      {label:'Cancelar',cls:'modal-btn-gray',fn:()=>{}}
    ]
  );
};

// ── AJUDA ─────────────────────────────────────────────────────────────────────
window.abrirAjuda=function(){$('ajuda-ov').classList.add('open');playClick();};

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
      <div class="prod-detail">${renderProdFotoGallery(p)}${estoqueHtml}
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
  editFotos=(p.fotos||(p.foto?[p.foto]:[])).slice();
  renderFotoSlots('edit');
  if(p.tipo==='unico'){setEditTipo('unico');$('e-uni').value=p.uni||0;}
  else{setEditTipo('tamanhos');$('e-pp').value=p.pp||0;$('e-p').value=p.p||0;$('e-m').value=p.m||0;$('e-g').value=p.g||0;$('e-gg').value=p.gg||0;$('e-gp').value=p.gp||0;}
  $('edit-ov').classList.add('open');
};
window.salvarEdit=async function(){
  if(!editId)return;
  const nome=$('e-nome').value.trim();const valor=parseFloat($('e-valor').value)||0;
  if(!nome||valor<=0){toast('Preencha nome e valor.',false);return;}
  const base={...produtos[editId],nome,valor,com:parseFloat($('e-com').value)||COM_PADRAO,fotos:editFotos.slice(),foto:null};
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
  const base={cod,nome,valor,com:gf('c-com')||COM_PADRAO,tipo:cadTipo,fotos:cadFotos.slice()};
  if(cadTipo==='unico'){base.uni=gi('c-uni');base.pp=0;base.p=0;base.m=0;base.g=0;base.gg=0;base.gp=0;}
  else{base.uni=0;base.pp=gi('c-pp');base.p=gi('c-p');base.m=gi('c-m');base.g=gi('c-g');base.gg=gi('c-gg');base.gp=gi('c-gp');}
  await set(nr,base);
  ['c-nome','c-valor','c-pp','c-p','c-m','c-g','c-gg','c-gp','c-uni'].forEach(id=>$(id).value='');
  $('c-com').value=COM_PADRAO;$('pv-disc').value='';
  cadFotos=[];renderFotoSlots('cad');
  $('cad-preview').style.display='none';setTipo('tamanhos');
  toast('✅ Produto #'+String(cod).padStart(3,'0')+' cadastrado!');goHome();
};

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
  // Verificar se algum item já está com estoque zerado ou negativo ANTES de vender
  const szLabelsCheck={'pp':'PP','p':'P','m':'M','g':'G','gg':'GG','gp':'G1+'};
  const semEstoque=[];
  for(const it of items){
    const p=getProdByCod(it.cod);
    const atual=p.tipo==='unico'?(p.uni||0):(p[it.sz]||0);
    if(atual<=0){
      const tam=p.tipo!=='unico'?' ('+szLabelsCheck[it.sz]+')':'';
      semEstoque.push(`${p.nome}${tam}: estoque atual ${atual}`);
    }
  }
  if(semEstoque.length){
    abrirModal(
      '⚠️ Estoque zerado',
      `Os itens abaixo já estão sem estoque:<br><br>${semEstoque.map(s=>'• '+s).join('<br>')}<br><br>Deseja continuar a venda mesmo assim?`,
      [
        {label:'✅ Sim, continuar venda',cls:'modal-btn-green',fn:()=>executarVenda()},
        {label:'Cancelar',cls:'modal-btn-gray',fn:()=>{}}
      ]
    );
    return;
  }
  await executarVenda();
};
async function executarVenda(){
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
}

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

// ── CLIENTES ──────────────────────────────────────────────────────────────────
let clientes={};
let cliSort='az';

onValue(ref(db,'clientes'),snap=>{
  clientes=snap.val()||{};
  renderClientes();
});

function maskTel(inp){
  let v=inp.value.replace(/\D/g,'');
  if(v.length>11)v=v.slice(0,11);
  if(v.length>6)v='('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7);
  else if(v.length>2)v='('+v.slice(0,2)+') '+v.slice(2);
  else if(v.length>0)v='('+v;
  inp.value=v;
}
window.maskTel=maskTel;

function calcIdadeAnos(nascimento){
  if(!nascimento)return 0;
  const hoje=new Date();
  const nasc=new Date(nascimento+'T00:00:00');
  let idade=hoje.getFullYear()-nasc.getFullYear();
  const m=hoje.getMonth()-nasc.getMonth();
  if(m<0||(m===0&&hoje.getDate()<nasc.getDate()))idade--;
  return idade<0?0:idade;
}
window.calcIdadeDisplay=function(){
  const nasc=$('cli-nascimento').value;
  const el=$('cli-idade-display');
  if(nasc){
    const idade=calcIdadeAnos(nasc);
    el.textContent=idade>=0?'🎂 '+idade+' anos':'';
    el.style.display='block';
  }else{
    el.textContent='';el.style.display='none';
  }
};

window.updateCliPreview=function(){};

window.setCliSort=function(s){
  cliSort=s;
  ['az','za','young','old','new'].forEach(x=>$('clf-'+x).classList.toggle('active',x===s));
  renderClientes();playClick();
};

window.salvarCliente=async function(){
  const nome=$('cli-nome').value.trim();
  const tel=$('cli-tel').value.trim();
  const nascimento=$('cli-nascimento').value;
  const idadeV=nascimento?calcIdadeAnos(nascimento):0;
  const end=$('cli-end').value.trim();
  if(!nome){toast('Informe o nome do cliente.',false);return;}
  dot.className='syncing';
  await push(ref(db,'clientes'),{nome,tel,idade:idadeV,nascimento,end,ts:Date.now()});
  $('cli-nome').value='';$('cli-tel').value='';$('cli-nascimento').value='';$('cli-end').value='';
  $('cli-idade-display').textContent='';
  toast('✅ Cliente cadastrado!');playClick();
};

window.deletarCliente=async function(id){
  if(!confirm('Remover este cliente?'))return;
  await remove(ref(db,'clientes/'+id));
  toast('Cliente removido.');
};

function getSortedClientes(){
  const arr=Object.entries(clientes).map(([id,c])=>({id,...c}));
  if(cliSort==='az')arr.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  else if(cliSort==='za')arr.sort((a,b)=>b.nome.localeCompare(a.nome,'pt-BR'));
  else if(cliSort==='young')arr.sort((a,b)=>(a.idade||999)-(b.idade||999));
  else if(cliSort==='old')arr.sort((a,b)=>(b.idade||0)-(a.idade||0));
  else if(cliSort==='new')arr.sort((a,b)=>(b.ts||0)-(a.ts||0));
  return arr;
}

function renderClientes(){
  const arr=getSortedClientes();
  const count=arr.length;
  $('cli-count').textContent=count?`(${count} cadastrado${count>1?'s':''})` :'';
  const wrap=$('cli-list-wrap');
  if(!wrap)return;
  if(!arr.length){
    wrap.innerHTML='<div class="cli-empty">Nenhum cliente cadastrado ainda.</div>';
    return;
  }
  wrap.innerHTML=arr.map(c=>{
    const initials=c.nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    return `<div class="cli-card">
      <div class="cli-avatar">${initials}</div>
      <div class="cli-info">
        <div class="cli-name">${c.nome}</div>
        <div class="cli-meta">
          ${c.tel?`<span>📱 ${c.tel}</span>`:''}
          ${c.idade?`<span>🎂 ${c.idade} anos</span>`:''}
          ${c.end?`<br><span>📍 ${c.end}</span>`:''}
        </div>
      </div>
      <button class="cli-del" onclick="deletarCliente('${c.id}')">×</button>
    </div>`;
  }).join('');
}

window.compartilharClientes=function(){
  const arr=getSortedClientes();
  if(!arr.length){toast('Nenhum cliente cadastrado.',false);return;}
  const linhas=arr.map((c,i)=>{
    const partes=[`${i+1}. *${c.nome}*`];
    if(c.tel)partes.push(`📱 ${c.tel}`);
    if(c.idade)partes.push(`🎂 ${c.idade} anos`);
    if(c.end)partes.push(`📍 ${c.end}`);
    return partes.join(' | ');
  });
  const texto=[
    '👥 *CEE JAY MODA — Lista de Clientes*',
    `Total: ${arr.length} cliente${arr.length>1?'s':''}`,
    '',
    ...linhas,
  ].join('\n');
  const url='https://wa.me/?text='+encodeURIComponent(texto);
  window.open(url,'_blank');
};

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

// SPLASH
setTimeout(()=>{
  const s=document.getElementById('splash');
  s.style.opacity='0';setTimeout(()=>s.style.display='none',600);
},1800);

// INIT
function initTarDate(){
  const now=new Date();
  const y=now.getFullYear();const m=String(now.getMonth()+1).padStart(2,'0');const d=String(now.getDate()).padStart(2,'0');
  const today=`${y}-${m}-${d}`;
  $('tar-date').value=today;
  $('tar-date-end').value=today;
}
refreshUserDisplay();
addItem();
initTarDate();
initResDate();
wireFotoInput('c-foto-input');
wireFotoInput('e-foto-input');
renderFotoSlots('cad');
renderFotoSlots('edit');
// Define data máxima do campo nascimento como hoje
(function(){const hoje=new Date();const y=hoje.getFullYear();const m=String(hoje.getMonth()+1).padStart(2,'0');const d=String(hoje.getDate()).padStart(2,'0');const el=$('cli-nascimento');if(el)el.max=`${y}-${m}-${d}`;})();

// ===== OFFLINE CACHE E SINCRONIZAÇÃO =====
window.CJStorage = {
 save(key,data){ localStorage.setItem('cj_'+key, JSON.stringify(data)); },
 load(key,def=[]){
   try { return JSON.parse(localStorage.getItem('cj_'+key)) ?? def; }
   catch(e){ return def; }
 }
};

window.addEventListener('offline',()=>console.log('Modo offline ativo'));
window.addEventListener('online',()=>console.log('Internet restaurada'));

window.addEventListener('sync-pending',()=>{
  // ponto central para futuras sincronizações automáticas
  console.log('Verificando sincronização pendente...');
});
