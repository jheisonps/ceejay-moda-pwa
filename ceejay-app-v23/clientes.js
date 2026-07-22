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

