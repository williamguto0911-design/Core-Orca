/* V057.3 — fila fiscal preparatória, sem transmissão externa */
let fiscalRows=[];
const fiscalSources=()=>({orcamento:orcamentos,recibo:recibos,os:ordens,lista:listasMateriais});
const fiscalLabels={orcamento:'Orçamento',recibo:'Recibo',os:'OS',lista:'Lista de materiais'};
function fiscalDiagnostic(d){
  if(!d)return;
  const el=$('fiscal-cert-diagnostic');if(!el)return;
  const fmt=v=>v?new Date(v).toLocaleString('pt-BR',{timeZone:'UTC'})+' UTC':'Não interpretada';
  const lines=['Diagnóstico V'+d.versao,'Relógio do servidor: '+fmt(d.servidor),'Certificados no PFX: '+d.total+' | Correspondentes à chave: '+d.correspondentes];
  for(const c of d.candidatos||[])lines.push('Série '+c.serial+(c.ca?' (autoridade certificadora)':' (titular)')+' — início: '+fmt(c.inicio)+' | vencimento: '+fmt(c.fim));
  if(d.selecionado)lines.push('Selecionado: série '+d.selecionado.serial+' — vigente até '+fmt(d.selecionado.fim));
  el.textContent=lines.join('\n');el.hidden=false;
}
async function fiscalCall(action,body={}){
  const {data,error}=await sb.functions.invoke('core-orca-fiscal',{body:{action,...body}});
  if(error){
    const ctx=error.context;
    const status=ctx?.status;
    let detail='';
    if(typeof ctx?.json==='function'){
      try{const payload=await ctx.json();if(action==='cert-import')fiscalDiagnostic(payload?.diagnostico);if(typeof payload?.error==='string')detail=payload.error+(typeof payload.code==='string'?' ['+payload.code+']':'');}catch{}
    }
    const fallback={400:'Dados inválidos. Confira os campos e o certificado.',401:'Sessão inválida. Entre novamente.',403:'Sem permissão para esta operação.',404:'Função fiscal ou registro não encontrado.',429:'Muitas solicitações. Tente novamente.',500:'Falha interna na operação fiscal.',503:'Serviço fiscal indisponível ou chave de criptografia não configurada.'};
    throw Error((detail||fallback[status]||'Não foi possível comunicar com o serviço fiscal.')+(status?' (HTTP '+status+')':''));
  }
  if(data?.error)throw Error(data.error);
  if(action==='cert-import')fiscalDiagnostic(data?.diagnostico);
  return data;
}
async function fiscalLoad(){fiscalRows=[];fiscalRender();try{const {data,error}=await sb.from('fiscal_notas').select('*').order('programada_para',{ascending:false});if(error)throw error;fiscalRows=data||[];fiscalRender()}catch(e){$('fiscal-rows').textContent='Não foi possível carregar: '+e.message}}
function fiscalRender(){const q=$('fiscal-busca').value; $('fiscal-rows').innerHTML=fiscalRows.filter(r=>smartSearch(r,q)).map(r=>`<tr><td>${esc(new Date(r.programada_para).toLocaleString('pt-BR'))}</td><td>${esc(fiscalLabels[r.origem_tipo]||r.origem_tipo)} ${esc(r.origem_numero)}</td><td>${esc(r.cliente)}</td><td>${money(r.valor)}</td><td>${esc(r.status)}</td><td>${esc(r.numero_nota||'—')}</td><td>${r.status==='aguardando_integracao'&&currentUserProfile?.tipo==='gerente'?`<button class="action-btn" onclick="fiscalCancelar('${r.id}')">Cancelar programação</button>`:''}</td></tr>`).join('')||'<tr><td colspan="7">Nenhuma programação registrada.</td></tr>'}
function fiscalSelect(includeList=false){return Object.entries(fiscalSources()).filter(([k])=>includeList||k!=='lista').map(([k,rows])=>`<optgroup label="${fiscalLabels[k]}">${rows.map(r=>`<option value="${k}:${esc(r.id)}">${esc(r.numero||r.nome||r.id)} — ${esc(r.clientes?.nome||'')}</option>`).join('')}</optgroup>`).join('')}
function fiscalNova(){if(currentUserProfile?.tipo!=='gerente')return toast('Somente gerente pode programar.');openModal('Programar nota fiscal',`<form id="fiscal-new"><p class="muted">Registro preparatório: não será enviado à Receita até a integração ser habilitada.</p><label>Documento<select id="fiscal-source" required>${fiscalSelect()}</select></label><label>Data e hora local<input id="fiscal-date" type="datetime-local" required></label><label>Descrição do serviço<textarea id="fiscal-desc" required></textarea></label><div class="modal-actions"><button class="btn primary">Salvar programação</button></div></form>`);$('fiscal-new').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{const [tipo,id]=$('fiscal-source').value.split(':');await fiscalCall('schedule',{tipo,id,programada_para:new Date($('fiscal-date').value).toISOString(),descricao:$('fiscal-desc').value});closeModal();await fiscalLoad();toast('Programação registrada, sem transmissão fiscal.')}catch(e){toast(e.message)}finally{b.disabled=false}}}
async function fiscalCancelar(id){if(!confirm('Cancelar somente a programação interna?'))return;try{await fiscalCall('cancel',{id});await fiscalLoad()}catch(e){toast(e.message)}}
async function fiscalCertStatus(){try{const r=await fiscalCall('cert-status');$('fiscal-cert-status').textContent=r.certificado?'Certificado armazenado: '+r.certificado.nome+' — validade '+r.certificado.validade:'Nenhum certificado importado.'}catch(e){$('fiscal-cert-status').textContent=e.message}}
function fiscalBase64(file){return file.arrayBuffer().then(b=>{let s='';for(const x of new Uint8Array(b))s+=String.fromCharCode(x);return btoa(s)})}
function fiscalAssinar(){if(currentUserProfile?.tipo!=='gerente')return toast('Somente gerente.');openModal('Assinatura digital',`<form id="fiscal-sign"><p>Selecione o PDF final exportado do documento. A assinatura PAdES ainda depende do serviço de assinatura.</p><label>Documento<select id="fiscal-sign-source" required>${fiscalSelect(true)}</select></label><label>PDF<input type="file" id="fiscal-sign-file" accept="application/pdf" required></label><div class="modal-actions"><button class="btn primary">Verificar disponibilidade</button></div></form>`);$('fiscal-sign').onsubmit=async e=>{e.preventDefault();toast('Assinatura PAdES indisponível nesta versão; nenhum arquivo foi assinado.')}}
document.addEventListener('DOMContentLoaded',()=>{document.querySelector('[data-config-tab="certificado"]').addEventListener('click',fiscalCertStatus);$('fiscal-cert-form').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{$('fiscal-cert-diagnostic').hidden=true;$('fiscal-cert-diagnostic').textContent='';const f=$('fiscal-cert-file').files[0];if(!f||f.size>1048576)throw Error('Arquivo inválido ou maior que 1 MB.');await fiscalCall('cert-import',{nome:f.name,pfx:await fiscalBase64(f),senha:$('fiscal-cert-password').value});toast('Certificado importado.');await fiscalCertStatus()}catch(e){toast(e.message)}finally{$('fiscal-cert-password').value='';$('fiscal-cert-file').value='';b.disabled=false}}});

const fiscalUFs='AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RO RR RS SC SE SP TO'.split(' ');
let fiscalCityRequest=0;
async function fiscalCities(uf,selected=''){const seq=++fiscalCityRequest;const el=$('fiscal-municipio');el.innerHTML='<option value="">Carregando...</option>';try{const r=await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/'+encodeURIComponent(uf)+'/municipios?orderBy=nome');if(!r.ok)throw Error('IBGE indisponível');const cities=await r.json();if(seq!==fiscalCityRequest)return;el.innerHTML='<option value="">Selecione</option>'+cities.map(c=>`<option value="${Number(c.id)}">${esc(c.nome)}</option>`).join('');el.value=selected}catch(e){if(seq===fiscalCityRequest)el.innerHTML='<option value="">Falha ao consultar IBGE</option>';}}
async function fiscalConfigLoad(){try{const {config:c}=await fiscalCall('config-get');$('fiscal-uf').value=c?.uf||'SC';await fiscalCities($('fiscal-uf').value,c?.municipio||'');$('fiscal-regime').value=c?.regime||'MEI';$('fiscal-im').value=c?.im||'';$('fiscal-ctn').value=c?.ctn||'';$('fiscal-ctm').value=c?.ctm||'';$('fiscal-amb').value=c?.ambiente||'restrita'}catch(e){toast(e.message)}}
document.addEventListener('DOMContentLoaded',()=>{$('fiscal-uf').innerHTML=fiscalUFs.map(u=>`<option>${u}</option>`).join('');$('fiscal-uf').onchange=()=>fiscalCities($('fiscal-uf').value);document.querySelector('[data-config-tab="certificado"]').addEventListener('click',fiscalConfigLoad);$('fiscal-config-form').onsubmit=async e=>{e.preventDefault();e.submitter.disabled=true;try{await fiscalCall('config-save',{uf:$('fiscal-uf').value,municipio:$('fiscal-municipio').value,regime:$('fiscal-regime').value,im:$('fiscal-im').value,ctn:$('fiscal-ctn').value,ctm:$('fiscal-ctm').value,ambiente:$('fiscal-amb').value});toast('Dados fiscais salvos. Transmissão ainda desativada.')}catch(e){toast(e.message)}finally{e.submitter.disabled=false}}});
