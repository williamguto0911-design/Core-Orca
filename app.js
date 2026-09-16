const SUPABASE_URL = "https://vihhktumvtfdcnthekic.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpaGhrdHVtdnRmZGNudGhla2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY5NTksImV4cCI6MjEwNTE0Mjk1OX0.F6dsoPwigniSvr6CwA8S91tr7KAH-utME0uAwr4etpo";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let clientes=[], materiais=[], servicos=[], orcamentos=[], ordens=[], agenda=[], financeiro=[], currentPage="dashboard";
let editorItens=[];

const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const money=n=>(Number(n)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const toast=msg=>{const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3000)};
const today=()=>new Date().toISOString().slice(0,10);
const statusLabel=s=>String(s||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());

async function init(){
  const {data:{session}}=await sb.auth.getSession();
  if(session) await showApp(session); else showLogin();
  sb.auth.onAuthStateChange(async(event,session)=>{if(session)await showApp(session);else showLogin()});
}
function showLogin(){$("login-screen").classList.remove("hidden");$("app").classList.add("hidden")}
async function showApp(session){$("login-screen").classList.add("hidden");$("app").classList.remove("hidden");$("user-email").textContent=session.user.email||"";await refreshAll()}
async function refreshAll(){
  await Promise.all([loadClientes(),loadMateriais(),loadServicos(),loadOrcamentos(),loadOrdens(),loadAgenda(),loadFinanceiro()]);
  renderDashboard(); renderCurrent();
}
function renderCurrent(){
  if(currentPage==="clientes")renderClientes();
  if(currentPage==="materiais")renderMateriais();
  if(currentPage==="servicos")renderServicos();
  if(currentPage==="estoque")renderEstoque();
  if(currentPage==="orcamentos")renderOrcamentos();
  if(currentPage==="os")renderOS();
  if(currentPage==="agenda")renderAgenda();
  if(currentPage==="financeiro")renderFinanceiro();
}
async function loadClientes(){const {data,error}=await sb.from("clientes").select("*").eq("ativo",true).order("nome");if(error)return toast("Clientes: "+error.message);clientes=data||[]}
async function loadMateriais(){const {data,error}=await sb.from("materiais").select("*").eq("ativo",true).order("nome");if(error)return toast("Materiais: "+error.message);materiais=data||[]}
async function loadServicos(){const {data,error}=await sb.from("servicos").select("*").eq("ativo",true).order("nome");if(error)return toast("Serviços: execute o SQL da V2 no Supabase. "+error.message);servicos=data||[]}
async function loadOrcamentos(){const {data,error}=await sb.from("orcamentos").select("*,clientes(nome)").order("created_at",{ascending:false});if(error){orcamentos=[];return}orcamentos=data||[]}
async function loadOrdens(){const {data,error}=await sb.from("ordens_servico").select("*,clientes(nome)").order("created_at",{ascending:false});if(error){ordens=[];return}ordens=data||[]}

async function loadAgenda(){const {data,error}=await sb.from("agenda").select("*,clientes(nome),ordens_servico(numero)").order("inicio",{ascending:true});if(error){agenda=[];return}agenda=data||[]}
async function loadFinanceiro(){const {data,error}=await sb.from("financeiro").select("*,clientes(nome),ordens_servico(numero)").order("vencimento",{ascending:true});if(error){financeiro=[];return}financeiro=data||[]}


function renderDashboard(){
  $("stat-clientes").textContent=clientes.length;
  $("stat-materiais").textContent=materiais.length;
  $("stat-baixo").textContent=materiais.filter(m=>Number(m.estoque_atual)<=Number(m.estoque_minimo)).length;
  $("stat-valor").textContent=money(materiais.reduce((s,m)=>s+Number(m.estoque_atual)*Number(m.custo),0));
  $("stat-orcamentos").textContent=orcamentos.filter(o=>!["aprovado","reprovado","cancelado"].includes(o.status)).length;
  $("stat-os").textContent=ordens.filter(o=>!["concluida","cancelada"].includes(o.status)).length;
}
function navigate(page){
  currentPage=page;document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));$("page-"+page).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  $("page-title").textContent={dashboard:"Dashboard",clientes:"Clientes",materiais:"Materiais",servicos:"Serviços",estoque:"Estoque",orcamentos:"Orçamentos",os:"Ordens de Serviço",agenda:"Agenda",financeiro:"Financeiro"}[page];
  renderCurrent();$("sidebar").classList.remove("open");
}
function renderClientes(){
 const q=$("cliente-search").value.toLowerCase();const rows=clientes.filter(c=>[c.nome,c.documento,c.telefone,c.celular,c.email].some(v=>String(v||"").toLowerCase().includes(q)));
 $("clientes-table").innerHTML=rows.map(c=>`<tr><td><b>${esc(c.nome)}</b><br><span class="muted">${esc(c.email||"")}</span></td><td>${esc(c.tipo_pessoa)}</td><td>${esc(c.documento||"-")}</td><td>${esc(c.celular||c.telefone||"-")}</td><td>${esc([c.cidade,c.estado].filter(Boolean).join("/ ")||"-")}</td><td><div class="actions"><button class="action-btn" onclick="editCliente('${c.id}')">Editar</button><button class="action-btn" onclick="deleteCliente('${c.id}')">Excluir</button></div></td></tr>`).join("")||`<tr><td colspan="6">Nenhum cliente encontrado.</td></tr>`;
}
function renderMateriais(){
 const q=$("material-search").value.toLowerCase();const rows=materiais.filter(m=>[m.codigo,m.nome,m.categoria,m.fabricante].some(v=>String(v||"").toLowerCase().includes(q)));
 $("materiais-table").innerHTML=rows.map(m=>`<tr><td>${esc(m.codigo||"-")}</td><td><b>${esc(m.nome)}</b><br><span class="muted">${esc(m.fabricante||"")}</span></td><td>${esc(m.categoria||"-")}</td><td>${esc(m.unidade)}</td><td class="${Number(m.estoque_atual)<=Number(m.estoque_minimo)?"low":"ok"}">${Number(m.estoque_atual).toLocaleString("pt-BR")}</td><td>${money(m.custo)}</td><td>${money(m.preco_venda)}</td><td><div class="actions"><button class="action-btn" onclick="editMaterial('${m.id}')">Editar</button><button class="action-btn" onclick="deleteMaterial('${m.id}')">Excluir</button></div></td></tr>`).join("")||`<tr><td colspan="8">Nenhum material encontrado.</td></tr>`;
}
function renderServicos(){
 const q=$("servico-search").value.toLowerCase();const rows=servicos.filter(s=>[s.codigo,s.nome,s.categoria,s.descricao].some(v=>String(v||"").toLowerCase().includes(q)));
 $("servicos-table").innerHTML=rows.map(s=>`<tr><td>${esc(s.codigo||"-")}</td><td><b>${esc(s.nome)}</b><br><span class="muted">${esc(s.descricao||"")}</span></td><td>${esc(s.categoria||"-")}</td><td>${esc(s.unidade||"SV")}</td><td>${money(s.valor)}</td><td><div class="actions"><button class="action-btn" onclick="editServico('${s.id}')">Editar</button><button class="action-btn" onclick="deleteServico('${s.id}')">Excluir</button></div></td></tr>`).join("")||`<tr><td colspan="6">Nenhum serviço encontrado.</td></tr>`;
}
function renderEstoque(){
 const q=$("estoque-search").value.toLowerCase();const rows=materiais.filter(m=>[m.codigo,m.nome,m.categoria].some(v=>String(v||"").toLowerCase().includes(q)));
 $("estoque-table").innerHTML=rows.map(m=>{const low=Number(m.estoque_atual)<=Number(m.estoque_minimo);return `<tr><td><b>${esc(m.nome)}</b><br><span class="muted">${esc(m.codigo||"")}</span></td><td>${Number(m.estoque_atual).toLocaleString("pt-BR")} ${esc(m.unidade)}</td><td>${Number(m.estoque_minimo).toLocaleString("pt-BR")}</td><td class="${low?"low":"ok"}">${low?"ESTOQUE BAIXO":"OK"}</td><td>${new Date(m.updated_at).toLocaleString("pt-BR")}</td></tr>`}).join("")||`<tr><td colspan="5">Nenhum material encontrado.</td></tr>`;
}
function renderOrcamentos(){
 const q=$("orcamento-search").value.toLowerCase();const rows=orcamentos.filter(o=>[o.numero,o.clientes?.nome,o.status].some(v=>String(v||"").toLowerCase().includes(q)));
 $("orcamentos-table").innerHTML=rows.map(o=>`<tr><td><b>${esc(o.numero)}</b></td><td>${esc(o.clientes?.nome||"-")}</td><td>${new Date(o.data_orcamento+"T12:00:00").toLocaleDateString("pt-BR")}</td><td><span class="badge ${esc(o.status)}">${statusLabel(o.status)}</span></td><td>${money(o.total)}</td><td><div class="actions"><button class="action-btn" onclick="viewOrcamento('${o.id}')">Abrir</button><button class="action-btn" onclick="convertOrcamento('${o.id}')">Gerar OS</button></div></td></tr>`).join("")||`<tr><td colspan="6">Nenhum orçamento encontrado.</td></tr>`;
}
function renderOS(){
 const q=$("os-search").value.toLowerCase();const rows=ordens.filter(o=>[o.numero,o.clientes?.nome,o.responsavel,o.status].some(v=>String(v||"").toLowerCase().includes(q)));
 $("os-table").innerHTML=rows.map(o=>`<tr><td><b>${esc(o.numero)}</b></td><td>${esc(o.clientes?.nome||"-")}</td><td>${new Date(o.data_abertura+"T12:00:00").toLocaleDateString("pt-BR")}</td><td>${esc(o.responsavel||"-")}</td><td><span class="badge ${esc(o.status)}">${statusLabel(o.status)}</span></td><td>${money(o.total)}</td><td><div class="actions"><button class="action-btn" onclick="viewOS('${o.id}')">Abrir</button>${o.status!=="concluida"&&o.status!=="cancelada"?`<button class="action-btn" onclick="concluirOS('${o.id}')">Concluir</button>`:""}</div></td></tr>`).join("")||`<tr><td colspan="7">Nenhuma OS encontrada.</td></tr>`;
}


function renderAgenda(){
 const q=$("agenda-search").value.toLowerCase();
 const rows=agenda.filter(a=>[a.titulo,a.responsavel,a.status,a.clientes?.nome,a.ordens_servico?.numero].some(v=>String(v||"").toLowerCase().includes(q)));
 $("agenda-table").innerHTML=rows.map(a=>`<tr><td>${new Date(a.inicio).toLocaleString("pt-BR")}</td><td><b>${esc(a.titulo)}</b><br><span class="muted">${esc(a.ordens_servico?.numero||"")}</span></td><td>${esc(a.clientes?.nome||"-")}</td><td>${esc(a.responsavel||"-")}</td><td><span class="badge ${esc(a.status)}">${statusLabel(a.status)}</span></td><td><button class="action-btn" onclick="deleteAgenda('${a.id}')">Excluir</button></td></tr>`).join("")||`<tr><td colspan="6">Nenhum agendamento.</td></tr>`;
}
function renderFinanceiro(){
 const q=$("financeiro-search").value.toLowerCase(), now=new Date().toISOString().slice(0,10);
 const rows=financeiro.filter(f=>[f.descricao,f.status,f.clientes?.nome,f.ordens_servico?.numero].some(v=>String(v||"").toLowerCase().includes(q)));
 $("financeiro-table").innerHTML=rows.map(f=>`<tr><td><b>${esc(f.descricao)}</b><br><span class="muted">${esc(f.ordens_servico?.numero||"")}</span></td><td>${esc(f.clientes?.nome||"-")}</td><td>${f.vencimento?new Date(f.vencimento+"T12:00:00").toLocaleDateString("pt-BR"):"-"}</td><td>${money(f.valor)}</td><td><span class="badge ${esc(f.status)}">${statusLabel(f.status)}</span></td><td><div class="actions">${f.status!=="pago"?`<button class="action-btn" onclick="markPaid('${f.id}')">Receber</button>`:""}<button class="action-btn" onclick="deleteFinance('${f.id}')">Excluir</button></div></td></tr>`).join("")||`<tr><td colspan="6">Nenhum lançamento.</td></tr>`;
 const receber=financeiro.filter(f=>f.status!=="pago").reduce((s,f)=>s+Number(f.valor),0);
 const recebido=financeiro.filter(f=>f.status==="pago").reduce((s,f)=>s+Number(f.valor),0);
 const vencido=financeiro.filter(f=>f.status!=="pago"&&f.vencimento&&f.vencimento<now).reduce((s,f)=>s+Number(f.valor),0);
 $("fin-receber").textContent=money(receber);$("fin-recebido").textContent=money(recebido);$("fin-vencido").textContent=money(vencido);
}
function agendaForm(){
 openModal("Novo agendamento",`<form id="entity-form"><div class="form-grid"><label>Título*<input id="f-titulo" required></label><label>Cliente<select id="f-cliente"><option value="">Sem cliente</option>${clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select></label><label>OS<select id="f-os"><option value="">Sem OS</option>${ordens.map(o=>`<option value="${o.id}">${esc(o.numero)} — ${esc(o.clientes?.nome||"")}</option>`).join("")}</select></label><label>Responsável<input id="f-responsavel"></label><label>Início*<input id="f-inicio" type="datetime-local" required></label><label>Fim<input id="f-fim" type="datetime-local"></label><label>Status<select id="f-status"><option value="agendado">Agendado</option><option value="confirmado">Confirmado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select></label><label class="span-2">Observações<textarea id="f-obs"></textarea></label></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={titulo:$("f-titulo").value.trim(),cliente_id:$("f-cliente").value||null,ordem_servico_id:$("f-os").value||null,responsavel:$("f-responsavel").value.trim(),inicio:new Date($("f-inicio").value).toISOString(),fim:$("f-fim").value?new Date($("f-fim").value).toISOString():null,status:$("f-status").value,observacoes:$("f-obs").value.trim()};const {error}=await sb.from("agenda").insert(obj);if(error)return toast(error.message);closeModal();await loadAgenda();renderAgenda();toast("Agendamento criado")};
}
async function deleteAgenda(id){if(!confirm("Excluir agendamento?"))return;const {error}=await sb.from("agenda").delete().eq("id",id);if(error)return toast(error.message);await loadAgenda();renderAgenda()}
function financeiroForm(){
 openModal("Novo lançamento",`<form id="entity-form"><div class="form-grid"><label>Descrição*<input id="f-descricao" required></label><label>Cliente<select id="f-cliente"><option value="">Sem cliente</option>${clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select></label><label>OS<select id="f-os"><option value="">Sem OS</option>${ordens.map(o=>`<option value="${o.id}">${esc(o.numero)}</option>`).join("")}</select></label><label>Valor*<input id="f-valor" type="number" min="0" step="0.01" required></label><label>Vencimento<input id="f-vencimento" type="date"></label><label>Status<select id="f-status"><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="cancelado">Cancelado</option></select></label><label class="span-2">Observações<textarea id="f-obs"></textarea></label></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const status=$("f-status").value,obj={descricao:$("f-descricao").value.trim(),cliente_id:$("f-cliente").value||null,ordem_servico_id:$("f-os").value||null,valor:Number($("f-valor").value),vencimento:$("f-vencimento").value||null,status,data_pagamento:status==="pago"?new Date().toISOString():null,observacoes:$("f-obs").value.trim()};const {error}=await sb.from("financeiro").insert(obj);if(error)return toast(error.message);closeModal();await loadFinanceiro();renderFinanceiro();toast("Lançamento criado")};
}
async function markPaid(id){const {error}=await sb.from("financeiro").update({status:"pago",data_pagamento:new Date().toISOString()}).eq("id",id);if(error)return toast(error.message);await loadFinanceiro();renderFinanceiro()}
async function deleteFinance(id){if(!confirm("Excluir lançamento?"))return;const {error}=await sb.from("financeiro").delete().eq("id",id);if(error)return toast(error.message);await loadFinanceiro();renderFinanceiro()}

async function uploadOSPhoto(osId,file,tipo){
 if(!file)return;
 const ext=(file.name.split(".").pop()||"jpg").toLowerCase(), path=`${osId}/${crypto.randomUUID()}.${ext}`;
 const up=await sb.storage.from("os-fotos").upload(path,file,{contentType:file.type||"image/jpeg"});
 if(up.error)return toast("Foto: "+up.error.message);
 const {error}=await sb.from("os_fotos").insert({ordem_servico_id:osId,storage_path:path,tipo,descricao:file.name});
 if(error)return toast(error.message);
 toast("Foto enviada");await viewOS(osId);
}
async function deleteOSPhoto(id,path,osId){
 if(!confirm("Excluir esta foto?"))return;
 await sb.storage.from("os-fotos").remove([path]);const {error}=await sb.from("os_fotos").delete().eq("id",id);if(error)return toast(error.message);await viewOS(osId);
}
async function openSignature(osId){
 openModal("Assinatura do cliente",`<label>Nome do cliente<input id="sig-name"></label><div class="signature-wrap"><canvas id="signature-canvas" width="850" height="190"></canvas></div><div class="modal-actions"><button type="button" id="sig-clear" class="btn secondary">Limpar</button><button type="button" class="btn secondary" onclick="viewOS('${osId}')">Cancelar</button><button type="button" id="sig-save" class="btn primary">Salvar assinatura</button></div>`);
 const pad=new SignaturePad($("signature-canvas"),{minWidth:1,maxWidth:2.5});
 $("sig-clear").onclick=()=>pad.clear();
 $("sig-save").onclick=async()=>{if(pad.isEmpty())return toast("Faça a assinatura.");const {error}=await sb.from("ordens_servico").update({assinatura_nome:$("sig-name").value.trim(),assinatura_data_url:pad.toDataURL("image/png"),assinatura_em:new Date().toISOString()}).eq("id",osId);if(error)return toast(error.message);toast("Assinatura salva");await loadOrdens();await viewOS(osId)};
}
function printDocument(title,header,items,notes){
 const w=window.open("","_blank");if(!w)return toast("Permita pop-ups para gerar o PDF.");
 const rows=items.map(i=>`<tr><td>${esc(statusLabel(i.tipo))}</td><td>${esc(i.descricao)}</td><td>${i.quantidade}</td><td>${money(i.valor_unitario)}</td><td>${money(i.quantidade*i.valor_unitario)}</td></tr>`).join("");
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{margin-bottom:4px}p{margin:5px 0}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f3f4f6}.total{text-align:right;font-size:18px;font-weight:bold;margin-top:18px}.muted{color:#666}</style></head><body><h1>Core-Orca</h1><h2>${esc(title)}</h2>${header}<table><thead><tr><th>Tipo</th><th>Descrição</th><th>Qtd.</th><th>Unitário</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>${notes||""}<script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);w.document.close();
}
async function printOrcamento(id){
 const o=orcamentos.find(x=>x.id===id);const {data,error}=await sb.from("orcamento_itens").select("*").eq("orcamento_id",id).order("ordem");if(error)return toast(error.message);
 printDocument(`Orçamento ${o.numero}`,`<p><b>Cliente:</b> ${esc(o.clientes?.nome||"-")}</p><p><b>Data:</b> ${new Date(o.data_orcamento+"T12:00:00").toLocaleDateString("pt-BR")}</p><p><b>Validade:</b> ${o.validade_dias} dias</p>`,data||[],`<p class="total">Total: ${money(o.total)}</p><p class="muted">${esc(o.observacoes||"")}</p>`);
}
async function printOS(id){
 const o=ordens.find(x=>x.id===id);const {data,error}=await sb.from("ordem_servico_itens").select("*").eq("ordem_servico_id",id).order("ordem");if(error)return toast(error.message);
 printDocument(`Ordem de Serviço ${o.numero}`,`<p><b>Cliente:</b> ${esc(o.clientes?.nome||"-")}</p><p><b>Status:</b> ${esc(statusLabel(o.status))}</p><p><b>Responsável:</b> ${esc(o.responsavel||"-")}</p><p><b>Local:</b> ${esc(o.local_servico||"-")}</p><p><b>Solicitação:</b> ${esc(o.descricao_problema||"-")}</p>`,data||[],`<p class="total">Total: ${money(o.total)}</p><p><b>Assinatura:</b> ${esc(o.assinatura_nome||"Não registrada")}</p>`);
}

function openModal(title,body){$("modal-title").textContent=title;$("modal-body").innerHTML=body;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden");editorItens=[]}

function clienteForm(c={}){
 openModal(c.id?"Editar cliente":"Novo cliente",`<form id="entity-form"><div class="form-grid">
 <label>Tipo<select id="f-tipo"><option ${c.tipo_pessoa==="PF"?"selected":""}>PF</option><option ${c.tipo_pessoa==="PJ"?"selected":""}>PJ</option></select></label>
 <label>Nome / Razão social*<input id="f-nome" required value="${esc(c.nome)}"></label><label>CPF / CNPJ<input id="f-documento" value="${esc(c.documento)}"></label>
 <label>Telefone<input id="f-telefone" value="${esc(c.telefone)}"></label><label>Celular<input id="f-celular" value="${esc(c.celular)}"></label>
 <label>E-mail<input id="f-email" type="email" value="${esc(c.email)}"></label><label>E-mail cobrança<input id="f-cobranca" type="email" value="${esc(c.email_cobranca)}"></label>
 <label>CEP<input id="f-cep" value="${esc(c.cep)}"></label><label>Endereço<input id="f-endereco" value="${esc(c.endereco)}"></label>
 <label>Número<input id="f-numero" value="${esc(c.numero)}"></label><label>Complemento<input id="f-complemento" value="${esc(c.complemento)}"></label>
 <label>Bairro<input id="f-bairro" value="${esc(c.bairro)}"></label><label>Cidade<input id="f-cidade" value="${esc(c.cidade)}"></label>
 <label>Estado<input id="f-estado" maxlength="2" value="${esc(c.estado)}"></label><label class="span-2">Observações<textarea id="f-obs">${esc(c.observacoes)}</textarea></label>
 </div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={tipo_pessoa:$("f-tipo").value,nome:$("f-nome").value.trim(),documento:$("f-documento").value.trim(),telefone:$("f-telefone").value.trim(),celular:$("f-celular").value.trim(),email:$("f-email").value.trim(),email_cobranca:$("f-cobranca").value.trim(),cep:$("f-cep").value.trim(),endereco:$("f-endereco").value.trim(),numero:$("f-numero").value.trim(),complemento:$("f-complemento").value.trim(),bairro:$("f-bairro").value.trim(),cidade:$("f-cidade").value.trim(),estado:$("f-estado").value.trim().toUpperCase(),observacoes:$("f-obs").value.trim()};const res=c.id?await sb.from("clientes").update(obj).eq("id",c.id):await sb.from("clientes").insert(obj);if(res.error)return toast("Erro: "+res.error.message);closeModal();toast("Cliente salvo");await loadClientes();renderClientes();renderDashboard()};
}
function editCliente(id){const c=clientes.find(x=>x.id===id);if(c)clienteForm(c)}
async function deleteCliente(id){if(!confirm("Excluir este cliente?"))return;const {error}=await sb.from("clientes").update({ativo:false}).eq("id",id);if(error)return toast("Erro: "+error.message);await loadClientes();renderClientes();renderDashboard()}

function materialForm(m={}){
 openModal(m.id?"Editar material":"Novo material",`<form id="entity-form"><div class="form-grid">
 <label>Código<input id="f-codigo" value="${esc(m.codigo)}"></label><label>Nome*<input id="f-nome" required value="${esc(m.nome)}"></label>
 <label>Descrição<input id="f-descricao" value="${esc(m.descricao)}"></label><label>Categoria<input id="f-categoria" value="${esc(m.categoria)}"></label>
 <label>Fabricante<input id="f-fabricante" value="${esc(m.fabricante)}"></label><label>Unidade<input id="f-unidade" value="${esc(m.unidade||"UN")}"></label>
 <label>Estoque atual<input id="f-estoque" type="number" step="0.001" value="${m.estoque_atual??0}"></label><label>Estoque mínimo<input id="f-minimo" type="number" step="0.001" value="${m.estoque_minimo??0}"></label>
 <label>Custo<input id="f-custo" type="number" step="0.01" value="${m.custo??0}"></label><label>Preço de venda<input id="f-preco" type="number" step="0.01" value="${m.preco_venda??0}"></label>
 </div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={codigo:$("f-codigo").value.trim()||null,nome:$("f-nome").value.trim(),descricao:$("f-descricao").value.trim(),categoria:$("f-categoria").value.trim(),fabricante:$("f-fabricante").value.trim(),unidade:$("f-unidade").value.trim()||"UN",estoque_atual:Number($("f-estoque").value)||0,estoque_minimo:Number($("f-minimo").value)||0,custo:Number($("f-custo").value)||0,preco_venda:Number($("f-preco").value)||0};const res=m.id?await sb.from("materiais").update(obj).eq("id",m.id):await sb.from("materiais").insert(obj);if(res.error)return toast("Erro: "+res.error.message);closeModal();await loadMateriais();renderMateriais();renderDashboard();toast("Material salvo")};
}
function editMaterial(id){const m=materiais.find(x=>x.id===id);if(m)materialForm(m)}
async function deleteMaterial(id){if(!confirm("Excluir este material?"))return;const {error}=await sb.from("materiais").update({ativo:false}).eq("id",id);if(error)return toast("Erro: "+error.message);await loadMateriais();renderMateriais();renderDashboard()}

function servicoForm(s={}){
 openModal(s.id?"Editar serviço":"Novo serviço",`<form id="entity-form"><div class="form-grid"><label>Código<input id="f-codigo" value="${esc(s.codigo)}"></label><label>Nome*<input id="f-nome" required value="${esc(s.nome)}"></label><label>Categoria<input id="f-categoria" value="${esc(s.categoria)}"></label><label>Unidade<input id="f-unidade" value="${esc(s.unidade||"SV")}"></label><label>Valor<input id="f-valor" type="number" min="0" step="0.01" value="${s.valor??0}"></label><label class="span-2">Descrição<textarea id="f-descricao">${esc(s.descricao)}</textarea></label></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={codigo:$("f-codigo").value.trim()||null,nome:$("f-nome").value.trim(),categoria:$("f-categoria").value.trim(),unidade:$("f-unidade").value.trim()||"SV",valor:Number($("f-valor").value)||0,descricao:$("f-descricao").value.trim()};const res=s.id?await sb.from("servicos").update(obj).eq("id",s.id):await sb.from("servicos").insert(obj);if(res.error)return toast("Erro: "+res.error.message);closeModal();await loadServicos();renderServicos();toast("Serviço salvo")};
}
function editServico(id){const s=servicos.find(x=>x.id===id);if(s)servicoForm(s)}
async function deleteServico(id){if(!confirm("Excluir este serviço?"))return;const {error}=await sb.from("servicos").update({ativo:false}).eq("id",id);if(error)return toast("Erro: "+error.message);await loadServicos();renderServicos()}

function movementForm(){
 openModal("Movimentar estoque",`<form id="entity-form"><label>Material<select id="f-material" required>${materiais.map(m=>`<option value="${m.id}">${esc(m.codigo?m.codigo+" - ":"")}${esc(m.nome)} — estoque: ${m.estoque_atual} ${esc(m.unidade)}</option>`).join("")}</select></label><label>Tipo<select id="f-tipo"><option>ENTRADA</option><option>SAIDA</option><option>AJUSTE</option></select></label><label>Quantidade*<input id="f-qtd" type="number" step="0.001" min="0.001" required></label><label>Motivo<input id="f-motivo"></label><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Registrar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const {error}=await sb.rpc("registrar_movimentacao_estoque",{p_material_id:$("f-material").value,p_tipo:$("f-tipo").value,p_quantidade:Number($("f-qtd").value),p_motivo:$("f-motivo").value.trim()});if(error)return toast("Erro: "+error.message);closeModal();await loadMateriais();renderEstoque();renderDashboard();toast("Movimentação registrada")};
}

function itemEditorHTML(){
 return `<div class="item-builder"><b>Itens</b><div class="form-grid"><label>Tipo<select id="item-tipo"><option value="material">Material</option><option value="servico">Serviço</option></select></label><label>Pesquisar<input id="item-search" autocomplete="off" placeholder="Digite parte do código ou nome..."><div id="item-suggestions" class="suggestions hidden"></div></label><label>Quantidade<input id="item-qtd" type="number" min="0.001" step="0.001" value="1"></label><label>Valor unitário<input id="item-valor" type="number" min="0" step="0.01"></label></div><input id="item-id" type="hidden"><button type="button" id="add-item" class="btn secondary">Adicionar item</button><div class="items-table"><table><thead><tr><th>Tipo</th><th>Descrição</th><th>Qtd.</th><th>Unitário</th><th>Total</th><th></th></tr></thead><tbody id="editor-itens"></tbody></table></div><div class="totals"><span>Subtotal: <span id="editor-subtotal">R$ 0,00</span></span><span>Total: <span id="editor-total">R$ 0,00</span></span></div></div>`;
}
function setupItemEditor(){
 const search=$("item-search"), suggestions=$("item-suggestions");
 function clearSelection(){$("item-id").value="";$("item-valor").value=""}
 function suggest(){
  const q=search.value.trim().toLowerCase();clearSelection();if(!q){suggestions.classList.add("hidden");return}
  const tipo=$("item-tipo").value;const source=tipo==="material"?materiais:servicos;
  const found=source.filter(x=>[x.codigo,x.nome,x.categoria].some(v=>String(v||"").toLowerCase().includes(q))).slice(0,20);
  suggestions.innerHTML=found.map(x=>`<div class="suggestion" data-id="${x.id}"><b>${esc(x.codigo||"")}</b> ${esc(x.nome)} <span class="muted">— ${money(tipo==="material"?x.preco_venda:x.valor)}</span></div>`).join("")||`<div class="suggestion muted">Nenhum resultado</div>`;
  suggestions.classList.remove("hidden");
  suggestions.querySelectorAll("[data-id]").forEach(el=>el.onclick=()=>{const x=source.find(y=>y.id===el.dataset.id);$("item-id").value=x.id;search.value=`${x.codigo?x.codigo+" - ":""}${x.nome}`;$("item-valor").value=tipo==="material"?Number(x.preco_venda||0):Number(x.valor||0);suggestions.classList.add("hidden")});
 }
 search.oninput=suggest;$("item-tipo").onchange=()=>{search.value="";clearSelection();suggestions.classList.add("hidden")};
 $("add-item").onclick=()=>{const tipo=$("item-tipo").value,id=$("item-id").value,qtd=Number($("item-qtd").value),valor=Number($("item-valor").value);if(!id||qtd<=0)return toast("Selecione um item pela pesquisa.");const source=tipo==="material"?materiais:servicos;const x=source.find(y=>y.id===id);editorItens.push({tipo,referencia_id:id,descricao:x.nome,quantidade:qtd,valor_unitario:valor});search.value="";$("item-id").value="";$("item-valor").value="";$("item-qtd").value=1;renderEditorItens()};
 renderEditorItens();
}
function renderEditorItens(){
 const tb=$("editor-itens");if(!tb)return;
 tb.innerHTML=editorItens.map((i,n)=>`<tr><td>${i.tipo==="material"?"Material":"Serviço"}</td><td>${esc(i.descricao)}</td><td>${i.quantidade}</td><td>${money(i.valor_unitario)}</td><td>${money(i.quantidade*i.valor_unitario)}</td><td><button type="button" class="action-btn" onclick="removeEditorItem(${n})">Remover</button></td></tr>`).join("")||`<tr><td colspan="6">Nenhum item adicionado.</td></tr>`;
 const subtotal=editorItens.reduce((s,i)=>s+i.quantidade*i.valor_unitario,0);$("editor-subtotal").textContent=money(subtotal);calcEditorTotal();
}
function removeEditorItem(n){editorItens.splice(n,1);renderEditorItens()}
function calcEditorTotal(){if(!$("editor-total"))return;const sub=editorItens.reduce((s,i)=>s+i.quantidade*i.valor_unitario,0);const desc=Number($("f-desconto")?.value)||0;$("editor-total").textContent=money(Math.max(0,sub-desc))}

function orcamentoForm(){
 editorItens=[];openModal("Novo orçamento",`<form id="entity-form"><div class="form-grid"><label>Cliente*<select id="f-cliente" required><option value="">Selecione...</option>${clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select></label><label>Data<input id="f-data" type="date" value="${today()}"></label><label>Validade (dias)<input id="f-validade" type="number" min="0" value="15"></label><label>Status<select id="f-status"><option value="rascunho">Rascunho</option><option value="enviado">Enviado</option><option value="aprovado">Aprovado</option><option value="reprovado">Reprovado</option></select></label><label>Desconto (R$)<input id="f-desconto" type="number" min="0" step="0.01" value="0"></label><label class="span-2">Observações<textarea id="f-obs"></textarea></label></div>${itemEditorHTML()}<div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar orçamento</button></div></form>`);
 setupItemEditor();$("f-desconto").oninput=calcEditorTotal;
 $("entity-form").onsubmit=async e=>{e.preventDefault();if(!editorItens.length)return toast("Adicione pelo menos um item.");const subtotal=editorItens.reduce((s,i)=>s+i.quantidade*i.valor_unitario,0),desconto=Number($("f-desconto").value)||0;const header={cliente_id:$("f-cliente").value,data_orcamento:$("f-data").value,validade_dias:Number($("f-validade").value)||0,status:$("f-status").value,observacoes:$("f-obs").value.trim(),subtotal,desconto,total:Math.max(0,subtotal-desconto)};const {data,error}=await sb.from("orcamentos").insert(header).select().single();if(error)return toast("Erro: "+error.message);const itens=editorItens.map((i,n)=>({orcamento_id:data.id,tipo:i.tipo,material_id:i.tipo==="material"?i.referencia_id:null,servico_id:i.tipo==="servico"?i.referencia_id:null,descricao:i.descricao,quantidade:i.quantidade,valor_unitario:i.valor_unitario,ordem:n}));const r=await sb.from("orcamento_itens").insert(itens);if(r.error)return toast("Orçamento criado, mas houve erro nos itens: "+r.error.message);closeModal();await loadOrcamentos();renderOrcamentos();renderDashboard();toast("Orçamento criado: "+data.numero)};
}
async function viewOrcamento(id){
 const o=orcamentos.find(x=>x.id===id);const {data,error}=await sb.from("orcamento_itens").select("*").eq("orcamento_id",id).order("ordem");if(error)return toast(error.message);
 openModal("Orçamento "+o.numero,`<div class="form-grid"><p><b>Cliente:</b> ${esc(o.clientes?.nome)}</p><p><b>Status:</b> ${statusLabel(o.status)}</p><p><b>Data:</b> ${new Date(o.data_orcamento+"T12:00:00").toLocaleDateString("pt-BR")}</p><p><b>Total:</b> ${money(o.total)}</p></div><div class="table-wrap"><table><thead><tr><th>Tipo</th><th>Descrição</th><th>Qtd.</th><th>Unitário</th><th>Total</th></tr></thead><tbody>${(data||[]).map(i=>`<tr><td>${statusLabel(i.tipo)}</td><td>${esc(i.descricao)}</td><td>${i.quantidade}</td><td>${money(i.valor_unitario)}</td><td>${money(i.quantidade*i.valor_unitario)}</td></tr>`).join("")}</tbody></table></div><div class="modal-actions"><button class="btn secondary" onclick="closeModal()">Fechar</button><button class="btn primary" onclick="printOrcamento(\'${o.id}\')">PDF / Imprimir</button></div>`);
}
async function convertOrcamento(id){
 if(!confirm("Gerar uma Ordem de Serviço a partir deste orçamento?"))return;
 const {data,error}=await sb.rpc("converter_orcamento_em_os",{p_orcamento_id:id});if(error)return toast("Erro: "+error.message);await Promise.all([loadOrcamentos(),loadOrdens()]);renderOrcamentos();renderDashboard();toast("OS criada: "+data);
}

function osForm(){
 editorItens=[];openModal("Nova Ordem de Serviço",`<form id="entity-form"><div class="form-grid"><label>Cliente*<select id="f-cliente" required><option value="">Selecione...</option>${clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select></label><label>Data de abertura<input id="f-data" type="date" value="${today()}"></label><label>Responsável<input id="f-responsavel"></label><label>Status<select id="f-status"><option value="aberta">Aberta</option><option value="em_andamento">Em andamento</option><option value="aguardando_material">Aguardando material</option></select></label><label class="span-2">Endereço/local do serviço<input id="f-local"></label><label class="span-2">Problema / solicitação<textarea id="f-problema" required></textarea></label><label>Desconto (R$)<input id="f-desconto" type="number" min="0" step="0.01" value="0"></label><label>Previsão<input id="f-previsao" type="date"></label><label class="span-2">Observações<textarea id="f-obs"></textarea></label></div>${itemEditorHTML()}<div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar OS</button></div></form>`);
 setupItemEditor();$("f-desconto").oninput=calcEditorTotal;
 $("entity-form").onsubmit=async e=>{e.preventDefault();const subtotal=editorItens.reduce((s,i)=>s+i.quantidade*i.valor_unitario,0),desconto=Number($("f-desconto").value)||0;const header={cliente_id:$("f-cliente").value,data_abertura:$("f-data").value,responsavel:$("f-responsavel").value.trim(),status:$("f-status").value,local_servico:$("f-local").value.trim(),descricao_problema:$("f-problema").value.trim(),previsao_conclusao:$("f-previsao").value||null,observacoes:$("f-obs").value.trim(),subtotal,desconto,total:Math.max(0,subtotal-desconto)};const {data,error}=await sb.from("ordens_servico").insert(header).select().single();if(error)return toast("Erro: "+error.message);if(editorItens.length){const itens=editorItens.map((i,n)=>({ordem_servico_id:data.id,tipo:i.tipo,material_id:i.tipo==="material"?i.referencia_id:null,servico_id:i.tipo==="servico"?i.referencia_id:null,descricao:i.descricao,quantidade:i.quantidade,valor_unitario:i.valor_unitario,ordem:n}));const r=await sb.from("ordem_servico_itens").insert(itens);if(r.error)return toast("OS criada, mas houve erro nos itens: "+r.error.message)}closeModal();await loadOrdens();renderOS();renderDashboard();toast("OS criada: "+data.numero)};
}
async function viewOS(id){
 const o=ordens.find(x=>x.id===id);
 const [{data:itens,error},{data:fotos,error:fotoError}]=await Promise.all([
   sb.from("ordem_servico_itens").select("*").eq("ordem_servico_id",id).order("ordem"),
   sb.from("os_fotos").select("*").eq("ordem_servico_id",id).order("created_at",{ascending:false})
 ]);
 if(error)return toast(error.message);if(fotoError)return toast(fotoError.message);
 const photoCards=(fotos||[]).map(f=>{const {data:u}=sb.storage.from("os-fotos").getPublicUrl(f.storage_path);return `<div class="photo-card"><img src="${u.publicUrl}" alt="Foto da OS"><div>${esc(statusLabel(f.tipo))}<br><button class="action-btn" onclick="deleteOSPhoto('${f.id}','${f.storage_path}','${id}')">Excluir</button></div></div>`}).join("");
 openModal("Ordem de Serviço "+o.numero,`<div class="form-grid"><p><b>Cliente:</b> ${esc(o.clientes?.nome)}</p><p><b>Status:</b> ${statusLabel(o.status)}</p><p><b>Responsável:</b> ${esc(o.responsavel||"-")}</p><p><b>Total:</b> ${money(o.total)}</p><p class="span-2"><b>Local:</b> ${esc(o.local_servico||"-")}</p><p class="span-2"><b>Solicitação:</b> ${esc(o.descricao_problema||"-")}</p></div><div class="table-wrap"><table><thead><tr><th>Tipo</th><th>Descrição</th><th>Qtd.</th><th>Unitário</th><th>Total</th></tr></thead><tbody>${(itens||[]).map(i=>`<tr><td>${statusLabel(i.tipo)}</td><td>${esc(i.descricao)}</td><td>${i.quantidade}</td><td>${money(i.valor_unitario)}</td><td>${money(i.quantidade*i.valor_unitario)}</td></tr>`).join("")||`<tr><td colspan="5">Sem itens.</td></tr>`}</tbody></table></div>
 <h4 class="section-title">Fotos</h4><div class="form-grid"><label>Tipo<select id="photo-type"><option value="antes">Antes</option><option value="durante">Durante</option><option value="depois">Depois</option></select></label><label>Adicionar foto<input id="photo-file" type="file" accept="image/*" capture="environment"></label></div><div class="photo-grid">${photoCards||'<span class="muted">Nenhuma foto.</span>'}</div>
 <h4 class="section-title">Assinatura</h4><p>${o.assinatura_nome?`Assinado por <b>${esc(o.assinatura_nome)}</b> em ${new Date(o.assinatura_em).toLocaleString("pt-BR")}`:"Ainda não assinada."}</p>
 ${o.status!=="concluida"&&o.status!=="cancelada"?`<div class="warning">Ao concluir, os materiais desta OS serão baixados automaticamente do estoque.</div>`:""}
 <div class="modal-actions"><button class="btn secondary" onclick="closeModal()">Fechar</button><button class="btn secondary" onclick="printOS('${o.id}')">PDF / Imprimir</button><button class="btn secondary" onclick="openSignature('${o.id}')">Assinatura</button>${o.status!=="concluida"&&o.status!=="cancelada"?`<button class="btn success" onclick="concluirOS('${o.id}')">Concluir OS</button>`:""}</div>`);
 $("photo-file").onchange=e=>uploadOSPhoto(id,e.target.files[0],$("photo-type").value);
}
async function concluirOS(id){
 if(!confirm("Concluir esta OS e baixar os materiais do estoque?"))return;
 const {data,error}=await sb.rpc("concluir_ordem_servico",{p_ordem_id:id});if(error)return toast("Não foi possível concluir: "+error.message);
 closeModal();await Promise.all([loadMateriais(),loadOrdens(),loadFinanceiro()]);renderOS();renderDashboard();toast(data||"OS concluída.");
}

async function importCSV(file){
 const text=await file.text();const lines=text.split(/\r?\n/).filter(x=>x.trim());if(lines.length<2)return toast("CSV vazio.");
 const delimiter=lines[0].includes(";")?";":",";
 const parse=line=>{const out=[];let cur="",quote=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quote&&line[i+1]==='"'){cur+='"';i++}else quote=!quote}else if(ch===delimiter&&!quote){out.push(cur.trim());cur=""}else cur+=ch}out.push(cur.trim());return out};
 const headers=parse(lines[0]).map(h=>h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"_"));
 const aliases={codigo:["codigo","cod"],nome:["nome","material","descricao_material"],descricao:["descricao"],categoria:["categoria"],fabricante:["fabricante","marca"],unidade:["unidade","un"],estoque_atual:["estoque_atual","estoque","quantidade"],estoque_minimo:["estoque_minimo","minimo","estoque_min"],custo:["custo","valor_custo"],preco_venda:["preco_venda","preco","valor_venda"]};
 const idx=k=>headers.findIndex(h=>aliases[k].includes(h));const num=v=>{let s=String(v||"0").trim();if(s.includes(",")&&s.includes("."))s=s.replace(/\./g,"").replace(",",".");else if(s.includes(","))s=s.replace(",",".");return Number(s.replace(/[^\d.-]/g,""))||0};
 const rows=[];for(let i=1;i<lines.length;i++){const a=parse(lines[i]),obj={};Object.keys(aliases).forEach(k=>{const j=idx(k);if(j>=0)obj[k]=a[j]});if(!obj.nome)continue;obj.codigo=obj.codigo||null;obj.unidade=obj.unidade||"UN";["estoque_atual","estoque_minimo","custo","preco_venda"].forEach(k=>obj[k]=num(obj[k]));rows.push(obj)}
 if(!rows.length)return toast("Nenhum material válido.");
 let count=0;
 for(let i=0;i<rows.length;i+=300){const batch=rows.slice(i,i+300);for(const row of batch){let res;if(row.codigo)res=await sb.from("materiais").upsert(row,{onConflict:"codigo"});else res=await sb.from("materiais").insert(row);if(res.error)return toast("Erro na importação: "+res.error.message);count++}}
 await loadMateriais();renderMateriais();renderDashboard();toast(`${count} materiais importados/atualizados`);
}

$("login-form").onsubmit=async e=>{e.preventDefault();$("login-error").textContent="";const {error}=await sb.auth.signInWithPassword({email:$("login-email").value.trim(),password:$("login-password").value});if(error)$("login-error").textContent="E-mail ou senha inválidos."};
$("logout-btn").onclick=async()=>{await sb.auth.signOut();showLogin()};
$("refresh-btn").onclick=refreshAll;$("modal-close").onclick=closeModal;$("modal").onclick=e=>{if(e.target===$("modal"))closeModal()};
$("novo-cliente").onclick=()=>clienteForm();$("novo-material").onclick=()=>materialForm();$("novo-servico").onclick=()=>servicoForm();$("nova-movimentacao").onclick=movementForm;
$("novo-orcamento").onclick=orcamentoForm;$("nova-os").onclick=osForm;
$("novo-agendamento").onclick=agendaForm;$("novo-lancamento").onclick=financeiroForm;
$("importar-csv").onclick=()=>$("csv-file").click();$("csv-file").onchange=e=>{if(e.target.files[0])importCSV(e.target.files[0]);e.target.value=""};
$("cliente-search").oninput=renderClientes;$("material-search").oninput=renderMateriais;$("servico-search").oninput=renderServicos;$("estoque-search").oninput=renderEstoque;$("orcamento-search").oninput=renderOrcamentos;$("os-search").oninput=renderOS;
$("agenda-search").oninput=renderAgenda;$("financeiro-search").oninput=renderFinanceiro;
$("menu-btn").onclick=()=>$("sidebar").classList.toggle("open");document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>navigate(b.dataset.page));
init();
