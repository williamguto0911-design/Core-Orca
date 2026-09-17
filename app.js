let catalogoBase=[];
const SUPABASE_URL = "https://vihhktumvtfdcnthekic.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpaGhrdHVtdnRmZGNudGhla2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY5NTksImV4cCI6MjEwNTE0Mjk1OX0.F6dsoPwigniSvr6CwA8S91tr7KAH-utME0uAwr4etpo";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let clientes=[], materiais=[], servicos=[], orcamentos=[], ordens=[], agenda=[], financeiro=[], tecnicos=[], fornecedores=[], compras=[], usuarios=[], recibos=[], cargos=[], empresasSaas=[], empresa=null, currentUserProfile=null, currentSession=null, currentPage="dashboard";
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
async function showApp(session){
 currentSession=session;
 $("login-screen").classList.add("hidden");$("app").classList.remove("hidden");
 $("user-email").textContent=session.user.email||"";
 await loadCurrentProfile(session.user);
 if(currentUserProfile?.deve_trocar_senha){forcePasswordChange();return}
 await refreshAll();
}
async function refreshAll(){
  if(!currentSession)return;
  await loadCurrentProfile(currentSession.user);
  if(currentUserProfile?.is_platform_admin){
    await loadSaasAdmin();
    applyPermissions();
    navigate("admin-plataforma");
    return;
  }
  await Promise.all([loadClientes(),loadMateriais(),loadServicos(),loadOrcamentos(),loadOrdens(),loadAgenda(),loadFinanceiro(),loadTecnicos(),loadFornecedores(),loadCompras(),loadUsuarios(),loadEmpresa(),loadRecibos(),loadCargos()]);
  applyPermissions();renderDashboard();renderCurrent();
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
  if(currentPage==="tecnicos")renderTecnicos();
  if(currentPage==="configuracoes")renderEmpresa();
  if(currentPage==="fornecedores")renderFornecedores();
  if(currentPage==="compras")renderCompras();
  if(currentPage==="usuarios")renderUsuarios();
  if(currentPage==="relatorios")renderRelatorios();
  if(currentPage==="recibos")renderRecibos();
  if(currentPage==="cargos")renderCargos();
  if(currentPage==="admin-plataforma")renderSaasAdmin();
}
async function loadClientes(){
 const empresaId=currentUserProfile?.empresa_id;
 if(!empresaId){clientes=[];return}
 const {data,error}=await sb.from("clientes").select("*")
   .eq("empresa_id",empresaId).eq("ativo",true).order("nome");
 if(error)return toast("Clientes: "+error.message);
 clientes=data||[];
}
async function loadMateriais(){
 try{
   let all=[],from=0,pageSize=1000;
   while(true){
     const {data,error}=await sb.from("materiais").select("*").eq("ativo",true).order("nome").range(from,from+pageSize-1);
     if(error)throw error;
     const rows=data||[];
     all.push(...rows);
     if(rows.length<pageSize)break;
     from+=pageSize;
   }
   materiais=all;
 }catch(error){
   console.error("Materiais:",error);
   toast("Materiais: "+error.message);
 }
}
async function loadServicos(){const {data,error}=await sb.from("servicos").select("*").eq("ativo",true).order("nome");if(error)return toast("Serviços: execute o SQL da V2 no Supabase. "+error.message);servicos=data||[]}
async function loadOrcamentos(){const {data,error}=await sb.from("orcamentos").select("*,clientes(nome)").order("created_at",{ascending:false});if(error){orcamentos=[];return}orcamentos=data||[]}
async function loadOrdens(){const {data,error}=await sb.from("ordens_servico").select("*,clientes(nome)").order("created_at",{ascending:false});if(error){ordens=[];return}ordens=data||[]}

async function loadAgenda(){const {data,error}=await sb.from("agenda").select("*,clientes(nome),ordens_servico(numero)").order("inicio",{ascending:true});if(error){agenda=[];return}agenda=data||[]}
async function loadFinanceiro(){const {data,error}=await sb.from("financeiro").select("*,clientes(nome),ordens_servico(numero)").order("vencimento",{ascending:true});if(error){financeiro=[];return}financeiro=data||[]}
async function loadTecnicos(){const {data,error}=await sb.from("tecnicos").select("*").order("nome");if(error){tecnicos=[];return}tecnicos=data||[]}
async function loadEmpresa(){const {data,error}=await sb.from("empresa_config").select("*").limit(1).maybeSingle();if(error){empresa=null;return}empresa=data||null}

async function loadCurrentProfile(user){
 const {data,error}=await sb.rpc("core_orca_context");
 if(error){
   console.error("Erro ao carregar contexto do usuário:",error);
   currentUserProfile={email:user.email,is_platform_admin:false,tipo:"sem_acesso",permissions:{},context_error:error.message};
   return;
 }
 currentUserProfile=data||{email:user.email,is_platform_admin:false,tipo:"sem_acesso",permissions:{}};
}
async function loadFornecedores(){const {data,error}=await sb.from("fornecedores").select("*").eq("ativo",true).order("nome");if(error){fornecedores=[];return}fornecedores=data||[]}
async function loadCompras(){const {data,error}=await sb.from("compras").select("*,fornecedores(nome)").order("created_at",{ascending:false});if(error){compras=[];return}compras=data||[]}
async function loadUsuarios(){const {data,error}=await sb.from("empresa_usuarios").select("*,cargos(nome)").order("nome");if(error){usuarios=[];return}usuarios=data||[]}
async function loadRecibos(){const {data,error}=await sb.from("recibos").select("*,clientes(nome)").order("created_at",{ascending:false});if(error){recibos=[];return}recibos=data||[]}
async function loadCargos(){const {data,error}=await sb.from("cargos").select("*").order("nome");if(error){cargos=[];return}cargos=data||[]}
async function loadSaasAdmin(){const {data,error}=await sb.rpc("admin_list_empresas");if(error){empresasSaas=[];return}empresasSaas=data||[]}
function can(module,action="read"){
 if(currentUserProfile?.is_platform_admin)return false;
 if(currentUserProfile?.tipo==="gerente")return true;
 const p=currentUserProfile?.permissions||{};
 return p[module]===true || p[module]?.[action]===true || p[module]?.all===true;
}
function applyPermissions(){
 const platform=!!currentUserProfile?.is_platform_admin;
 const manager=currentUserProfile?.tipo==="gerente";
 const noAccess=!platform && (!currentUserProfile?.empresa_id || currentUserProfile?.tipo==="sem_acesso");

 document.querySelectorAll(".platform-only").forEach(el=>el.classList.toggle("hidden",!platform));
 document.querySelectorAll(".manager-only").forEach(el=>el.classList.toggle("hidden",platform||!manager));

 document.querySelectorAll("[data-module]").forEach(el=>{
   const allowed=!platform && !noAccess && (manager || can(el.dataset.module,"read"));
   el.classList.toggle("hidden",!allowed);
 });

 if(platform){
   document.querySelectorAll(".nav-item:not(.platform-only)").forEach(el=>el.classList.add("hidden"));
 }else{
   document.querySelectorAll(".nav-item:not(.platform-only)").forEach(el=>{
     if(!el.dataset.module&&!el.classList.contains("manager-only"))el.classList.remove("hidden");
   });
 }

 if(noAccess){
   console.warn("Usuário autenticado sem vínculo ativo com empresa:",currentUserProfile);
   setTimeout(()=>toast("Seu login não possui vínculo ativo com uma empresa. Execute a correção V9 no Supabase."),250);
 }
}




function renderDashboard(){
 if(currentUserProfile?.tipo==="sem_acesso"){
   const alertBox=$("dashboard-alerts");
   if(alertBox)alertBox.innerHTML='<div class="alert-item danger"><strong>Acesso da empresa não configurado</strong><span>Seu usuário está autenticado, mas ainda não está vinculado como Gerente ou Colaborador de uma empresa. Execute o arquivo supabase-v9.sql.</span></div>';
 }
  $("stat-clientes").textContent=clientes.length;
  $("stat-materiais").textContent=materiais.length;
  $("stat-baixo").textContent=materiais.filter(m=>Number(m.estoque_atual)<=Number(m.estoque_minimo)).length;
  $("stat-valor").textContent=money(materiais.reduce((s,m)=>s+Number(m.estoque_atual)*Number(m.custo),0));
  $("stat-orcamentos").textContent=orcamentos.filter(o=>!["aprovado","reprovado","cancelado"].includes(o.status)).length;
  $("stat-os").textContent=ordens.filter(o=>!["concluida","cancelada"].includes(o.status)).length;
  const recebido=financeiro.filter(f=>f.tipo!=="despesa"&&f.status==="pago").reduce((s,f)=>s+Number(f.valor),0);
  const receber=financeiro.filter(f=>f.tipo!=="despesa"&&f.status==="pendente").reduce((s,f)=>s+Number(f.valor),0);
  const despesas=financeiro.filter(f=>f.tipo==="despesa"&&f.status==="pago").reduce((s,f)=>s+Number(f.valor),0);
  $("dash-recebido").textContent=money(recebido);$("dash-receber").textContent=money(receber);$("dash-despesas").textContent=money(despesas);$("dash-resultado").textContent=money(recebido-despesas);
  $("dash-os-recentes").innerHTML=ordens.slice(0,6).map(o=>`<div class="compact-item"><span><b>${esc(o.numero)}</b><br><small>${esc(o.clientes?.nome||"-")}</small></span><span class="badge ${esc(o.status)}">${statusLabel(o.status)}</span></div>`).join("")||'<span class="muted">Nenhuma OS.</span>';
  renderAlerts();
}
function navigate(page){
  currentPage=page;document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));$("page-"+page).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  $("page-title").textContent={dashboard:"Dashboard",clientes:"Clientes",materiais:"Materiais",servicos:"Serviços",estoque:"Estoque",orcamentos:"Orçamentos",os:"Ordens de Serviço",agenda:"Agenda",financeiro:"Financeiro",tecnicos:"Técnicos",fornecedores:"Fornecedores",compras:"Compras",relatorios:"Relatórios",recibos:"Recibos",cargos:"Cargos e Permissões","admin-plataforma":"Empresas e Licenças",usuarios:"Usuários",configuracoes:"Configurações"}[page];
  renderCurrent();$("sidebar").classList.remove("open");
}

/* V15.6 — busca inteligente global: texto + números */
function searchNormalize(v){
 return String(v??"")
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
function searchDigits(v){
 return String(v??"").replace(/\D/g,"");
}
function searchFlatten(v,out=[]){
 if(v==null)return out;
 if(Array.isArray(v)){v.forEach(x=>searchFlatten(x,out));return out}
 if(typeof v==="object"){Object.values(v).forEach(x=>searchFlatten(x,out));return out}
 out.push(String(v));return out;
}
function smartSearch(record,query,extra=[]){
 const rawQuery=String(query??"").trim();
 if(!rawQuery)return true;

 const values=[...searchFlatten(record),...extra.map(x=>String(x??""))];
 const normalizedText=searchNormalize(values.join(" "));
 const words=normalizedText.split(/\s+/).filter(Boolean);

 // Uma versão somente numérica de cada campo e também do registro completo.
 // Isso permite procurar CPF/CNPJ/CEP/telefone/códigos com ou sem máscara.
 const numericFields=values.map(searchDigits).filter(Boolean);
 const allDigits=numericFields.join(" ");

 const queryTokens=searchNormalize(rawQuery).split(/\s+/).filter(Boolean);

 return queryTokens.every(term=>{
   const termDigits=searchDigits(term);
   const isNumeric=/^\d+$/.test(term);

   if(isNumeric){
     return numericFields.some(v=>v.includes(termDigits)) || allDigits.includes(termDigits);
   }

   // Termos alfanuméricos como LM0928 também podem localizar LM-0928.
   const compactTerm=term.replace(/[^a-z0-9]/g,"");
   const compactText=normalizedText.replace(/\s+/g,"");
   return words.some(w=>w.startsWith(term)||w.includes(term))
       || compactText.includes(compactTerm);
 });
}

function renderClientes(){
 const q=$("cliente-search").value;const rows=clientes.filter(c=>smartSearch(c,q));
 $("clientes-table").innerHTML=rows.map(c=>`<tr><td><b>${esc(c.nome)}</b><br><span class="muted">${esc(c.email||"")}</span></td><td>${esc(c.tipo_pessoa)}</td><td>${esc(c.documento||"-")}</td><td>${esc(c.celular||c.telefone||"-")}</td><td>${esc([c.cidade,c.estado].filter(Boolean).join("/ ")||"-")}</td><td><div class="actions"><button class="action-btn" onclick="editCliente('${c.id}')">Editar</button><button class="action-btn" onclick="deleteCliente('${c.id}')">Excluir</button></div></td></tr>`).join("")||`<tr><td colspan="6">Nenhum cliente encontrado.</td></tr>`;
}
function renderMateriais(){
 const q=$("material-search").value;const rows=materiais.filter(m=>smartSearch(m,q));
 $("materiais-table").innerHTML=rows.map(m=>`<tr><td>${esc(m.codigo||"-")}</td><td><b>${esc(m.nome)}</b><br><span class="muted">${esc(m.fabricante||"")}</span></td><td>${esc(m.categoria||"-")}</td><td>${esc(m.unidade)}</td><td class="${Number(m.estoque_atual)<=Number(m.estoque_minimo)?"low":"ok"}">${Number(m.estoque_atual).toLocaleString("pt-BR")}</td><td>${money(m.custo)}</td><td>${money(m.preco_venda)}</td><td>${money(m.lucro_valor??(Number(m.preco_venda)-Number(m.custo)))}</td><td>${Number(m.lucro_percentual??(Number(m.custo)>0?((Number(m.preco_venda)-Number(m.custo))/Number(m.custo)*100):0)).toLocaleString("pt-BR",{maximumFractionDigits:2})}%</td><td><div class="actions"><button class="action-btn" onclick="editMaterial('${m.id}')">Editar</button><button class="action-btn" onclick="materialPhotos('${m.id}')">Fotos</button><button class="action-btn" onclick="deleteMaterial('${m.id}')">Excluir</button></div></td></tr>`).join("")||`<tr><td colspan="10">Nenhum material encontrado.</td></tr>`;
}
function renderServicos(){
 const q=$("servico-search").value;const rows=servicos.filter(s=>smartSearch(s,q));
 $("servicos-table").innerHTML=rows.map(s=>`<tr><td>${esc(s.codigo||"-")}</td><td><b>${esc(s.nome)}</b><br><span class="muted">${esc(s.descricao||"")}</span></td><td>${esc(s.categoria||"-")}</td><td>${esc(s.unidade||"SV")}</td><td>${money(s.valor)}</td><td><div class="actions"><button class="action-btn" onclick="editServico('${s.id}')">Editar</button><button class="action-btn" onclick="deleteServico('${s.id}')">Excluir</button></div></td></tr>`).join("")||`<tr><td colspan="6">Nenhum serviço encontrado.</td></tr>`;
}
function renderEstoque(){
 const q=$("estoque-search").value;const rows=materiais.filter(m=>smartSearch(m,q));
 $("estoque-table").innerHTML=rows.map(m=>{const low=Number(m.estoque_atual)<=Number(m.estoque_minimo);return `<tr><td><b>${esc(m.nome)}</b><br><span class="muted">${esc(m.codigo||"")}</span></td><td>${Number(m.estoque_atual).toLocaleString("pt-BR")} ${esc(m.unidade)}</td><td>${Number(m.estoque_minimo).toLocaleString("pt-BR")}</td><td class="${low?"low":"ok"}">${low?"ESTOQUE BAIXO":"OK"}</td><td>${new Date(m.updated_at).toLocaleString("pt-BR")}</td></tr>`}).join("")||`<tr><td colspan="5">Nenhum material encontrado.</td></tr>`;
}
function renderOrcamentos(){
 const q=$("orcamento-search").value;const rows=orcamentos.filter(o=>smartSearch(o,q));
 $("orcamentos-table").innerHTML=rows.map(o=>`<tr><td><b>${esc(o.numero)}</b></td><td>${esc(o.clientes?.nome||"-")}</td><td>${new Date(o.data_orcamento+"T12:00:00").toLocaleDateString("pt-BR")}</td><td><span class="badge ${esc(o.status)}">${statusLabel(o.status)}</span></td><td>${money(o.total)}</td><td><div class="actions"><button class="action-btn" onclick="viewOrcamento('${o.id}')">Abrir</button><button class="action-btn" onclick="editOrcamento('${o.id}')">Editar</button><button class="action-btn" onclick="duplicateOrcamento('${o.id}')">Duplicar</button><button class="action-btn" onclick="convertOrcamento('${o.id}')">Gerar OS</button><button class="action-btn danger" onclick="deleteOrcamento('${o.id}')">Excluir</button></div></td></tr>`).join("")||`<tr><td colspan="6">Nenhum orçamento encontrado.</td></tr>`;
}
async function deleteOrcamento(id){const o=orcamentos.find(x=>x.id===id);if(!o||!confirm(`Excluir o orçamento ${o.numero}?`))return;const {error}=await sb.from("orcamentos").delete().eq("id",id);if(error)return toast(error.message);await loadOrcamentos();renderOrcamentos();renderDashboard();toast("Orçamento excluído")}
function renderOS(){
 const q=$("os-search").value, sf=$("os-status-filter").value;const rows=ordens.filter(o=>(!sf||o.status===sf)&&smartSearch(o,q));
 $("os-table").innerHTML=rows.map(o=>`<tr><td><b>${esc(o.numero)}</b></td><td>${esc(o.clientes?.nome||"-")}</td><td>${new Date(o.data_abertura+"T12:00:00").toLocaleDateString("pt-BR")}</td><td>${esc(o.responsavel||"-")}</td><td><span class="badge ${esc(o.status)}">${statusLabel(o.status)}</span></td><td>${money(o.total)}</td><td><div class="actions"><button class="action-btn" onclick="viewOS('${o.id}')">Abrir</button><button class="action-btn" onclick="editOS('${o.id}')">Editar</button><button class="action-btn danger" onclick="deleteOS('${o.id}')">Excluir</button>${o.status!=="concluida"&&o.status!=="cancelada"?`<button class="action-btn" onclick="concluirOS('${o.id}')">Concluir</button>`:""}</div></td></tr>`).join("")||`<tr><td colspan="7">Nenhuma OS encontrada.</td></tr>`;
}


async function deleteOS(id){const o=ordens.find(x=>x.id===id);if(!o||!confirm(`Excluir a OS ${o.numero}?`))return;const {error}=await sb.from("ordens_servico").delete().eq("id",id);if(error)return toast(error.message);await Promise.all([loadOrdens(),loadRecibos()]);renderOS();renderDashboard();toast("OS excluída")}
function renderAgenda(){
 const q=$("agenda-search").value.toLowerCase();
 const rows=agenda.filter(a=>[a.titulo,a.responsavel,a.status,a.clientes?.nome,a.ordens_servico?.numero].some(v=>String(v||"").toLowerCase().includes(q)));
 $("agenda-table").innerHTML=rows.map(a=>`<tr><td>${new Date(a.inicio).toLocaleString("pt-BR")}</td><td><b>${esc(a.titulo)}</b><br><span class="muted">${esc(a.ordens_servico?.numero||"")}</span></td><td>${esc(a.clientes?.nome||"-")}</td><td>${esc(a.responsavel||"-")}</td><td><span class="badge ${esc(a.status)}">${statusLabel(a.status)}</span></td><td><button class="action-btn" onclick="deleteAgenda('${a.id}')">Excluir</button></td></tr>`).join("")||`<tr><td colspan="6">Nenhum agendamento.</td></tr>`;
}
function renderFinanceiro(){
 const q=$("financeiro-search").value.toLowerCase(), now=new Date().toISOString().slice(0,10);
 const rows=financeiro.filter(f=>[f.tipo,f.descricao,f.status,f.forma_pagamento,f.clientes?.nome,f.ordens_servico?.numero].some(v=>String(v||"").toLowerCase().includes(q)));
 $("financeiro-table").innerHTML=rows.map(f=>`<tr><td class="${f.tipo==="despesa"?"type-despesa":"type-receita"}">${statusLabel(f.tipo||"receita")}</td><td><b>${esc(f.descricao)}</b><br><span class="muted">${esc(f.ordens_servico?.numero||"")}</span></td><td>${esc(f.clientes?.nome||"-")}</td><td>${f.vencimento?new Date(f.vencimento+"T12:00:00").toLocaleDateString("pt-BR"):"-"}</td><td>${money(f.valor)}</td><td>${esc(statusLabel(f.forma_pagamento||"-"))}</td><td><span class="badge ${esc(f.status)}">${statusLabel(f.status)}</span></td><td><div class="actions">${f.status!=="pago"?`<button class="action-btn" onclick="markPaid('${f.id}')">Baixar</button>`:""}<button class="action-btn" onclick="deleteFinance('${f.id}')">Excluir</button></div></td></tr>`).join("")||`<tr><td colspan="8">Nenhum lançamento.</td></tr>`;
 const receber=financeiro.filter(f=>f.tipo!=="despesa"&&f.status!=="pago"&&f.status!=="cancelado").reduce((s,f)=>s+Number(f.valor),0);
 const recebido=financeiro.filter(f=>f.tipo!=="despesa"&&f.status==="pago").reduce((s,f)=>s+Number(f.valor),0);
 const vencido=financeiro.filter(f=>f.tipo!=="despesa"&&f.status!=="pago"&&f.status!=="cancelado"&&f.vencimento&&f.vencimento<now).reduce((s,f)=>s+Number(f.valor),0);
 $("fin-receber").textContent=money(receber);$("fin-recebido").textContent=money(recebido);$("fin-vencido").textContent=money(vencido);
}
function agendaForm(){
 openModal("Novo agendamento",`<form id="entity-form"><div class="form-grid"><label>Título*<input id="f-titulo" required></label><label>Cliente<select id="f-cliente"><option value="">Sem cliente</option>${clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select></label><label>OS<select id="f-os"><option value="">Sem OS</option>${ordens.map(o=>`<option value="${o.id}">${esc(o.numero)} — ${esc(o.clientes?.nome||"")}</option>`).join("")}</select></label><label>Responsável<select id="f-responsavel"><option value="">Selecione...</option>${tecnicos.filter(t=>t.ativo).map(t=>`<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join("")}</select></label><label>Início*<input id="f-inicio" type="datetime-local" required></label><label>Fim<input id="f-fim" type="datetime-local"></label><label>Status<select id="f-status"><option value="agendado">Agendado</option><option value="confirmado">Confirmado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select></label><label class="span-2">Observações<textarea id="f-obs"></textarea></label></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={titulo:$("f-titulo").value.trim(),cliente_id:$("f-cliente").value||null,ordem_servico_id:$("f-os").value||null,responsavel:$("f-responsavel").value.trim(),inicio:new Date($("f-inicio").value).toISOString(),fim:$("f-fim").value?new Date($("f-fim").value).toISOString():null,status:$("f-status").value,observacoes:$("f-obs").value.trim()};const {error}=await sb.from("agenda").insert(obj);if(error)return toast(error.message);closeModal();await loadAgenda();renderAgenda();toast("Agendamento criado")};
}
async function deleteAgenda(id){if(!confirm("Excluir agendamento?"))return;const {error}=await sb.from("agenda").delete().eq("id",id);if(error)return toast(error.message);await loadAgenda();renderAgenda()}
function financeiroForm(){
 openModal("Novo lançamento",`<form id="entity-form"><div class="form-grid"><label>Tipo<select id="f-tipo"><option value="receita">Receita</option><option value="despesa">Despesa</option></select></label><label>Descrição*<input id="f-descricao" required></label><label>Cliente<select id="f-cliente"><option value="">Sem cliente</option>${clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select></label><label>OS<select id="f-os"><option value="">Sem OS</option>${ordens.map(o=>`<option value="${o.id}">${esc(o.numero)}</option>`).join("")}</select></label><label>Valor*<input id="f-valor" type="number" min="0" step="0.01" required></label><label>Vencimento<input id="f-vencimento" type="date"></label><label>Forma de pagamento<select id="f-pagamento"><option value="">Não definida</option><option value="pix">PIX</option><option value="dinheiro">Dinheiro</option><option value="cartao_credito">Cartão de crédito</option><option value="cartao_debito">Cartão de débito</option><option value="boleto">Boleto</option><option value="transferencia">Transferência</option></select></label><label>Status<select id="f-status"><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="cancelado">Cancelado</option></select></label><label class="span-2">Observações<textarea id="f-obs"></textarea></label></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const status=$("f-status").value,obj={tipo:$("f-tipo").value,descricao:$("f-descricao").value.trim(),cliente_id:$("f-cliente").value||null,ordem_servico_id:$("f-os").value||null,valor:Number($("f-valor").value),vencimento:$("f-vencimento").value||null,forma_pagamento:$("f-pagamento").value||null,status,data_pagamento:status==="pago"?new Date().toISOString():null,observacoes:$("f-obs").value.trim()};const {error}=await sb.from("financeiro").insert(obj);if(error)return toast(error.message);closeModal();await loadFinanceiro();renderFinanceiro();renderDashboard();toast("Lançamento criado")};
}
async function markPaid(id){const {error}=await sb.from("financeiro").update({status:"pago",data_pagamento:new Date().toISOString()}).eq("id",id);if(error)return toast(error.message);await loadFinanceiro();renderFinanceiro()}
async function deleteFinance(id){if(!confirm("Excluir lançamento?"))return;const {error}=await sb.from("financeiro").delete().eq("id",id);if(error)return toast(error.message);await loadFinanceiro();renderFinanceiro()}




function renderAlerts(){
 const box=$("dashboard-alerts");if(!box)return;
 const todayStr=today(), in7=new Date();in7.setDate(in7.getDate()+7);const in7s=in7.toISOString().slice(0,10);
 const alerts=[];
 const low=materiais.filter(m=>Number(m.estoque_atual)<=Number(m.estoque_minimo));
 if(low.length)alerts.push({type:"warning",title:`${low.length} material(is) com estoque baixo`,text:low.slice(0,4).map(m=>`${m.codigo?m.codigo+" - ":""}${m.nome}`).join(", ")+(low.length>4?"...":"")});
 const overdue=financeiro.filter(f=>f.status==="pendente"&&f.vencimento&&f.vencimento<todayStr);
 if(overdue.length)alerts.push({type:"danger",title:`${overdue.length} lançamento(s) financeiro(s) vencido(s)`,text:`Total vencido: ${money(overdue.reduce((s,f)=>s+Number(f.valor),0))}`});
 const soon=financeiro.filter(f=>f.status==="pendente"&&f.vencimento&&f.vencimento>=todayStr&&f.vencimento<=in7s);
 if(soon.length)alerts.push({type:"info",title:`${soon.length} vencimento(s) nos próximos 7 dias`,text:`Total: ${money(soon.reduce((s,f)=>s+Number(f.valor),0))}`});
 const ag=agenda.filter(a=>a.status!=="cancelado"&&a.status!=="concluido"&&String(a.inicio).slice(0,10)===todayStr);
 if(ag.length)alerts.push({type:"info",title:`${ag.length} compromisso(s) hoje`,text:ag.slice(0,4).map(a=>a.titulo).join(", ")});
 box.innerHTML=alerts.map(a=>`<div class="alert-item ${a.type}"><strong>${esc(a.title)}</strong><span>${esc(a.text)}</span></div>`).join("")||'<div class="alert-item"><strong>Nenhum alerta crítico</strong><span>Estoque, agenda e financeiro sem alertas para exibir.</span></div>';
}
function reportRange(){
 let ini=$("rel-inicio")?.value, fim=$("rel-fim")?.value;
 if(!ini||!fim){const d=new Date(), first=new Date(d.getFullYear(),d.getMonth(),1);ini=first.toISOString().slice(0,10);fim=today();if($("rel-inicio"))$("rel-inicio").value=ini;if($("rel-fim"))$("rel-fim").value=fim}
 return {ini,fim};
}
function renderRelatorios(){
 const {ini,fim}=reportRange();
 const fin=financeiro.filter(f=>{const d=String(f.data_pagamento||f.vencimento||f.created_at||"").slice(0,10);return d>=ini&&d<=fim});
 const receitas=fin.filter(f=>f.tipo!=="despesa"&&f.status==="pago").reduce((s,f)=>s+Number(f.valor),0);
 const despesas=fin.filter(f=>f.tipo==="despesa"&&f.status==="pago").reduce((s,f)=>s+Number(f.valor),0);
 const os=ordens.filter(o=>o.status==="concluida"&&String(o.data_conclusao||"").slice(0,10)>=ini&&String(o.data_conclusao||"").slice(0,10)<=fim);
 $("rel-receitas").textContent=money(receitas);$("rel-despesas").textContent=money(despesas);$("rel-resultado").textContent=money(receitas-despesas);$("rel-os").textContent=os.length;
 const groups=["pendente","pago","cancelado"].map(st=>({st,total:fin.filter(f=>f.status===st).reduce((s,f)=>s+Number(f.valor),0),n:fin.filter(f=>f.status===st).length}));
 $("rel-fin-status").innerHTML=groups.map(g=>`<div class="compact-item"><span>${statusLabel(g.st)} (${g.n})</span><b>${money(g.total)}</b></div>`).join("");
 const low=materiais.filter(m=>Number(m.estoque_atual)<=Number(m.estoque_minimo)).sort((a,b)=>Number(a.estoque_atual)-Number(b.estoque_atual));
 $("rel-low-stock").innerHTML=low.slice(0,20).map(m=>`<div class="compact-item"><span>${esc(m.codigo||"")} ${esc(m.nome)}</span><b>${m.estoque_atual} ${esc(m.unidade||"")}</b></div>`).join("")||'<span class="muted">Nenhum material abaixo do mínimo.</span>';
}
function csvCell(v){const s=String(v??"");return `"${s.replaceAll('"','""')}"`}
function downloadCSV(filename,headers,rows){
 const content="\ufeff"+[headers.map(csvCell).join(";"),...rows.map(r=>r.map(csvCell).join(";"))].join("\r\n");
 const blob=new Blob([content],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
}
function exportFinanceiro(){
 const {ini,fim}=reportRange(), rows=financeiro.filter(f=>{const d=String(f.data_pagamento||f.vencimento||f.created_at||"").slice(0,10);return d>=ini&&d<=fim});
 downloadCSV(`financeiro_${ini}_${fim}.csv`,["Tipo","Descrição","Cliente","OS","Vencimento","Valor","Forma de pagamento","Status","Data pagamento"],rows.map(f=>[statusLabel(f.tipo||"receita"),f.descricao,f.clientes?.nome||"",f.ordens_servico?.numero||"",f.vencimento||"",Number(f.valor).toFixed(2),statusLabel(f.forma_pagamento||""),statusLabel(f.status),f.data_pagamento?new Date(f.data_pagamento).toLocaleString("pt-BR"):""]));
}
function exportOS(){
 const {ini,fim}=reportRange(),rows=ordens.filter(o=>{const d=String(o.data_conclusao||o.created_at||"").slice(0,10);return d>=ini&&d<=fim});
 downloadCSV(`ordens_servico_${ini}_${fim}.csv`,["Número","Cliente","Status","Responsável","Local","Total","Conclusão"],rows.map(o=>[o.numero,o.clientes?.nome||"",statusLabel(o.status),o.responsavel||"",o.local_servico||"",Number(o.total).toFixed(2),o.data_conclusao?new Date(o.data_conclusao).toLocaleString("pt-BR"):""]));
}
function exportMateriais(){
 downloadCSV(`materiais_${today()}.csv`,["Código","Nome","Categoria","Unidade","Estoque atual","Estoque mínimo","Custo","Preço venda"],materiais.map(m=>[m.codigo||"",m.nome,m.categoria||"",m.unidade||"",m.estoque_atual,m.estoque_minimo,Number(m.custo).toFixed(2),Number(m.preco_venda).toFixed(2)]));
}


function renderRecibos(){
 const q=$("recibo-search").value,rows=recibos.filter(r=>smartSearch(r,q));
 $("recibos-table").innerHTML=rows.map(r=>`<tr><td><b>${esc(r.numero)}</b></td><td>${esc(r.clientes?.nome||"-")}</td><td>${new Date(r.data_emissao+"T12:00:00").toLocaleDateString("pt-BR")}</td><td>${money(r.total)}</td><td>${money(r.valor_pago||0)}</td><td><span class="badge">${statusLabel(r.status)}</span></td><td><div class="actions"><button class="action-btn" onclick="viewRecibo('${r.id}')">Abrir</button><button class="action-btn" onclick="editRecibo('${r.id}')">Editar</button><button class="action-btn" onclick="printRecibo('${r.id}')">PDF / Imprimir</button><button class="action-btn danger" onclick="deleteRecibo('${r.id}')">Excluir</button></div></td></tr>`).join("")||'<tr><td colspan="7">Nenhum recibo.</td></tr>';
}
function reciboForm(){
 editorItens=[];let pagamentos=[{data:today(),valor:0}];
 openModal("Novo recibo",`<form id="entity-form"><div class="form-grid"><label>Cliente*<select id="f-cliente" required><option value="">Selecione...</option>${clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select></label><label>Emissão<input id="f-data" type="date" value="${today()}"></label><label>Vincular à OS<select id="f-os"><option value="">Sem vínculo</option>${ordens.map(o=>`<option value="${o.id}">${esc(o.numero)} — ${esc(o.clientes?.nome||"")}</option>`).join("")}</select></label><label class="span-2">Referente a / observações<textarea id="f-obs"></textarea></label></div>${itemEditorHTML()}<div class="item-builder"><div class="panel-head"><b>Pagamentos / parcelamento</b><button type="button" id="add-payment" class="btn secondary">+ Parcela</button></div><div id="payments-box"></div><div class="form-grid"><label>Nº parcelas automáticas<input id="auto-n" type="number" min="1" value="1"></label><label>Intervalo<select id="auto-int"><option value="30">Mensal (30 dias)</option><option value="15">15 dias</option><option value="7">Semanal</option></select></label></div><button type="button" id="auto-split" class="btn secondary">Gerar parcelamento pelo total</button></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar recibo</button></div></form>`);
 setupItemEditor();
 const draw=()=>{const b=$("payments-box");b.innerHTML=pagamentos.map((p,n)=>`<div class="payment-row"><label>Data<input data-pn="${n}" data-pk="data" type="date" value="${p.data||""}"></label><label>Valor<input data-pn="${n}" data-pk="valor" type="number" min="0" step="0.01" value="${p.valor||0}"></label><label>Status<select data-pn="${n}" data-pk="status"><option value="pendente" ${p.status!=="pago"?"selected":""}>Pendente</option><option value="pago" ${p.status==="pago"?"selected":""}>Pago</option></select></label><button type="button" class="action-btn" data-prm="${n}">Remover</button></div>`).join("");b.querySelectorAll("[data-pn]").forEach(i=>i.onchange=()=>pagamentos[Number(i.dataset.pn)][i.dataset.pk]=i.dataset.pk==="valor"?Number(i.value):i.value);b.querySelectorAll("[data-prm]").forEach(x=>x.onclick=()=>{pagamentos.splice(Number(x.dataset.prm),1);draw()})};
 $("add-payment").onclick=()=>{pagamentos.push({data:today(),valor:0,status:"pendente"});draw()};
 $("auto-split").onclick=()=>{const total=editorItens.reduce((s,i)=>s+i.quantidade*i.valor_unitario,0),n=Math.max(1,Number($("auto-n").value)||1),days=Number($("auto-int").value)||30,base=new Date($("f-data").value+"T12:00:00"),each=Math.floor(total*100/n)/100;pagamentos=[];let used=0;for(let i=0;i<n;i++){const d=new Date(base);d.setDate(d.getDate()+days*i);const val=i===n-1?Math.round((total-used)*100)/100:each;used+=val;pagamentos.push({data:d.toISOString().slice(0,10),valor:val,status:"pendente"})}draw()};draw();
 $("entity-form").onsubmit=async e=>{e.preventDefault();if(!editorItens.length)return toast("Adicione ao menos um item.");const total=editorItens.reduce((s,i)=>s+i.quantidade*i.valor_unitario,0);const soma=pagamentos.reduce((s,p)=>s+Number(p.valor||0),0);if(Math.abs(soma-total)>0.02)return toast("A soma das parcelas deve ser igual ao total do recibo.");const {data,error}=await sb.from("recibos").insert({cliente_id:$("f-cliente").value,ordem_servico_id:$("f-os").value||null,data_emissao:$("f-data").value,observacoes:$("f-obs").value.trim(),total,status:pagamentos.every(p=>p.status==="pago")?"pago":"aberto"}).select().single();if(error)return toast(error.message);let r=await sb.from("recibo_itens").insert(editorItens.map((i,n)=>({recibo_id:data.id,tipo:i.tipo,material_id:i.tipo==="material"?i.referencia_id:null,servico_id:i.tipo==="servico"?i.referencia_id:null,descricao:i.descricao,quantidade:i.quantidade,valor_unitario:i.valor_unitario,ordem:n})));if(r.error)return toast(r.error.message);r=await sb.from("recibo_pagamentos").insert(pagamentos.map((p,n)=>({recibo_id:data.id,parcela:n+1,vencimento:p.data,data_pagamento:p.status==="pago"?p.data:null,valor:p.valor,status:p.status})));if(r.error)return toast(r.error.message);closeModal();await loadRecibos();renderRecibos();toast("Recibo criado: "+data.numero)};
}
async function editRecibo(id){
 const r=recibos.find(x=>x.id===id);if(!r)return;
 openModal("Editar "+r.numero,`<form id="edit-receipt-form"><div class="form-grid"><label>Cliente<select id="er-client">${clientes.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select></label><label>Emissão<input id="er-date" type="date" value="${r.data_emissao||today()}"></label><label>OS vinculada<select id="er-os"><option value="">Sem vínculo</option>${ordens.map(o=>`<option value="${o.id}">${esc(o.numero)}</option>`).join("")}</select></label><label class="span-2">Observações<textarea id="er-obs">${esc(r.observacoes||"")}</textarea></label></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("er-client").value=r.cliente_id;$("er-os").value=r.ordem_servico_id||"";
 $("edit-receipt-form").onsubmit=async e=>{e.preventDefault();const {error}=await sb.from("recibos").update({cliente_id:$("er-client").value,data_emissao:$("er-date").value,ordem_servico_id:$("er-os").value||null,observacoes:$("er-obs").value.trim()}).eq("id",id);if(error)return toast(error.message);closeModal();await loadRecibos();renderRecibos();toast("Recibo atualizado")};
}
async function deleteRecibo(id){const r=recibos.find(x=>x.id===id);if(!r||!confirm(`Excluir o recibo ${r.numero}?`))return;const {error}=await sb.from("recibos").delete().eq("id",id);if(error)return toast(error.message);await loadRecibos();renderRecibos();toast("Recibo excluído")}
async function paymentPopup(paymentId,reciboId,paid){
 const {data:p,error}=await sb.from("recibo_pagamentos").select("*").eq("id",paymentId).single();if(error)return toast(error.message);
 openModal(paid?"Marcar parcela como paga":"Marcar parcela como pendente",`<form id="pay-form"><div class="form-grid"><label>Data do pagamento<input id="pay-date" type="date" value="${paid?(p.data_pagamento||today()):""}" ${paid?"required":"disabled"}></label><label>Método<select id="pay-method" ${paid?"required":"disabled"}><option value="">Selecione...</option><option>PIX</option><option>Dinheiro</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Boleto</option><option>Transferência</option><option>Cheque</option><option>Outro</option></select></label><label class="span-2">Comprovante<input id="pay-proof" type="file" accept="image/*,.pdf" ${paid?"":"disabled"}></label></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="viewRecibo('${reciboId}')">Cancelar</button><button class="btn primary">Confirmar</button></div></form>`);
 if(p.metodo_pagamento)$("pay-method").value=p.metodo_pagamento;
 $("pay-form").onsubmit=async e=>{e.preventDefault();let path=p.comprovante_path||null;if(paid&&$("pay-proof").files?.[0]){const f=$("pay-proof").files[0],ext=(f.name.split(".").pop()||"bin"),newPath=`${currentUserProfile?.empresa_id}/${reciboId}/${crypto.randomUUID()}.${ext}`;const up=await sb.storage.from("comprovantes").upload(newPath,f,{contentType:f.type||"application/octet-stream"});if(up.error)return toast(up.error.message);path=newPath}const obj=paid?{status:"pago",data_pagamento:$("pay-date").value,metodo_pagamento:$("pay-method").value,comprovante_path:path}:{status:"pendente",data_pagamento:null,metodo_pagamento:null};const {error}=await sb.from("recibo_pagamentos").update(obj).eq("id",paymentId);if(error)return toast(error.message);await loadRecibos();await viewRecibo(reciboId)};
}
async function openProof(path){const {data,error}=await sb.storage.from("comprovantes").createSignedUrl(path,300);if(error)return toast(error.message);window.open(data.signedUrl,"_blank")}

async function viewRecibo(id){const r=recibos.find(x=>x.id===id);const [{data:itens},{data:pags}]=await Promise.all([sb.from("recibo_itens").select("*").eq("recibo_id",id).order("ordem"),sb.from("recibo_pagamentos").select("*").eq("recibo_id",id).order("parcela")]);openModal("Recibo "+r.numero,`<p><b>Cliente:</b> ${esc(r.clientes?.nome||"-")}</p><p><b>Total:</b> ${money(r.total)}</p><div class="table-wrap"><table><thead><tr><th>Item</th><th>Qtd.</th><th>Valor</th></tr></thead><tbody>${(itens||[]).map(i=>`<tr><td>${esc(i.descricao)}</td><td>${i.quantidade}</td><td>${money(i.quantidade*i.valor_unitario)}</td></tr>`).join("")}</tbody></table></div><h4>Pagamentos</h4><div class="table-wrap"><table><thead><tr><th>Parcela</th><th>Vencimento</th><th>Pagamento</th><th>Valor</th><th>Método</th><th>Status</th><th>Ações</th></tr></thead><tbody>${(pags||[]).map(p=>`<tr><td>${p.parcela}</td><td>${p.vencimento?new Date(p.vencimento+"T12:00:00").toLocaleDateString("pt-BR"):"-"}</td><td>${p.data_pagamento?new Date(p.data_pagamento+"T12:00:00").toLocaleDateString("pt-BR"):"-"}</td><td>${money(p.valor)}</td><td>${esc(p.metodo_pagamento||"-")}</td><td>${p.status==="pago"?"Pago":"Pendente"}</td><td><button class="action-btn" onclick="paymentPopup('${p.id}','${id}',${p.status!=="pago"})">${p.status==="pago"?"Marcar pendente":"Marcar pago"}</button>${p.comprovante_path?` <button class="action-btn" onclick="openProof('${p.comprovante_path}')">Comprovante</button>`:""}</td></tr>`).join("")}</tbody></table></div><div class="modal-actions"><button class="btn secondary" onclick="closeModal()">Fechar</button><button class="btn primary" onclick="printRecibo('${id}')">PDF / Imprimir</button></div>`)}
async function printRecibo(id){const r=recibos.find(x=>x.id===id);const [{data:itens},{data:pags}]=await Promise.all([sb.from("recibo_itens").select("*").eq("recibo_id",id).order("ordem"),sb.from("recibo_pagamentos").select("*").eq("recibo_id",id).order("parcela")]);const pay=`<h3>Pagamentos</h3><table><thead><tr><th>Parcela</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead><tbody>${(pags||[]).map(p=>`<tr><td>${p.parcela}</td><td>${new Date(p.data_pagamento+"T12:00:00").toLocaleDateString("pt-BR")}</td><td>${money(p.valor)}</td><td>${statusLabel(p.status)}</td></tr>`).join("")}</tbody></table>`;printDocument(`Recibo ${r.numero}`,`<p><b>Recebemos de:</b> ${esc(r.clientes?.nome||"-")}</p><p><b>Emissão:</b> ${new Date(r.data_emissao+"T12:00:00").toLocaleDateString("pt-BR")}</p>`,itens||[],`<p class="total">Total: ${money(r.total)}</p>${pay}<p>${esc(r.observacoes||"")}</p>`)}

const permissionModules=["clientes","materiais","servicos","estoque","orcamentos","os","agenda","financeiro","recibos","tecnicos","fornecedores","compras","relatorios","configuracoes"];
function renderCargos(){const q=$("cargo-search").value,rows=cargos.filter(c=>smartSearch(c,q));$("cargos-table").innerHTML=rows.map(c=>`<tr><td><b>${esc(c.nome)}</b></td><td>${esc(c.descricao||"-")}</td><td>${Object.keys(c.permissoes||{}).filter(k=>c.permissoes[k]?.read||c.permissoes[k]===true).map(statusLabel).join(", ")||"Sem acesso"}</td><td><button class="action-btn" onclick="cargoForm(cargos.find(x=>x.id==='${c.id}'))">Editar</button></td></tr>`).join("")||'<tr><td colspan="4">Nenhum cargo personalizado.</td></tr>'}
function cargoForm(c={}){
 const p=c.permissoes||{};openModal(c.id?"Editar cargo":"Novo cargo",`<form id="entity-form"><div class="form-grid"><label>Nome*<input id="f-nome" required value="${esc(c.nome)}"></label><label>Descrição<input id="f-desc" value="${esc(c.descricao)}"></label></div><div class="permission-grid">${permissionModules.map(m=>`<div class="permission-card"><b>${statusLabel(m)}</b><label><input type="checkbox" data-pm="${m}" data-pa="read" ${p[m]?.read||p[m]===true?"checked":""}> Visualizar</label><label><input type="checkbox" data-pm="${m}" data-pa="write" ${p[m]?.write?"checked":""}> Criar/editar</label><label><input type="checkbox" data-pm="${m}" data-pa="delete" ${p[m]?.delete?"checked":""}> Excluir</label></div>`).join("")}</div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const perms={};document.querySelectorAll("[data-pm]").forEach(x=>{perms[x.dataset.pm]??={};perms[x.dataset.pm][x.dataset.pa]=x.checked});const obj={nome:$("f-nome").value.trim(),descricao:$("f-desc").value.trim(),permissoes:perms};const {data,error}=await sb.rpc("salvar_cargo_v155",{p_id:c.id||null,p_nome:obj.nome,p_descricao:obj.descricao||null,p_permissoes:obj.permissoes});if(error)return toast(error.message);closeModal();await loadCargos();renderCargos();toast("Cargo salvo")};
}

function renderSaasAdmin(){
 if(!currentUserProfile?.is_platform_admin)return;
 const total=empresasSaas.reduce((s,e)=>s+Number(e.licencas_max||0),0);
 const used=empresasSaas.reduce((s,e)=>s+Number(e.licencas_usadas||0),0);
 $("saas-empresas").textContent=empresasSaas.length;
 $("saas-licencas").textContent=total;
 $("saas-usuarios").textContent=used;
 if($("saas-admin-email"))$("saas-admin-email").textContent=currentUserProfile?.email||"admin@coreorca.com.br";
 $("saas-table").innerHTML=empresasSaas.map(e=>`<tr>
   <td><b>${esc(e.nome)}</b></td>
   <td>${esc(e.documento||"-")}</td>
   <td>${esc(e.responsavel_nome||"-")}<br><small>${esc(e.responsavel_email||"")}</small></td>
   <td class="${e.ativa?"license-ok":"license-blocked"}">${e.ativa?"Ativa":"Bloqueada"}</td>
   <td>${e.licencas_max}</td><td>${e.licencas_usadas}</td>
   <td>${e.licenca_validade?new Date(e.licenca_validade+"T12:00:00").toLocaleDateString("pt-BR"):"Sem limite"}</td>
   <td><div class="action-group">
     <button class="action-btn" onclick="manageLicenses('${e.id}')">Licenças</button>
     <button class="action-btn" onclick="empresaSaasForm(empresasSaas.find(x=>x.id==='${e.id}'))">Editar</button>
     ${e.nome==="Administração Core Orça"?"":`<button class="action-btn danger" onclick="deleteCompany('${e.id}')">Excluir</button>`}
   </div></td>
 </tr>`).join("")||'<tr><td colspan="8">Nenhuma empresa cadastrada.</td></tr>';
}
function empresaSaasForm(e={}){
 const creating=!e.id;
 openModal(creating?"Cadastrar empresa e Gerente":"Editar empresa/licenciamento",`<form id="entity-form">
 <div class="form-grid">
   <label>Empresa*<input id="f-nome" required value="${esc(e.nome)}"></label>
   <label>CNPJ/Documento<input id="f-doc" value="${esc(e.documento)}"></label>
   <label>Responsável<input id="f-resp-nome" value="${esc(e.responsavel_nome)}"></label>
   <label>E-mail do responsável<input id="f-resp-email" type="email" value="${esc(e.responsavel_email)}"></label>
   <label>Quantidade de licenças*<input id="f-lic" type="number" min="1" required value="${e.licencas_max||1}"></label>
   <label>Validade da licença<input id="f-validade" type="date" value="${e.licenca_validade||""}"></label>
   <label>Status<select id="f-ativa"><option value="true" ${e.ativa!==false?"selected":""}>Ativa</option><option value="false" ${e.ativa===false?"selected":""}>Bloqueada</option></select></label>
   <label>Nome do Gerente${creating?"*":""}<input id="f-gerente-nome" ${creating?"required":""} value="${esc(e.responsavel_nome||"")}"></label>
   <label>E-mail do Gerente${creating?"*":""}<input id="f-gerente" type="email" ${creating?"required":""} value="${esc(e.gerente_email||e.responsavel_email||"")}" placeholder="gerente@empresa.com.br"></label>
   <label class="span-2">Observações comerciais<textarea id="f-obs">${esc(e.observacoes_licenca)}</textarea></label>
 </div>
 ${creating?'<div class="force-password-note">Ao salvar, o sistema criará o login do Gerente e gerará uma senha temporária aleatória. Essa senha será exibida uma única vez para você repassar ao Gerente. No primeiro login, ele será obrigado a definir uma nova senha.</div>':""}
 <div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar empresa</button></div>
 </form>`);
 $("entity-form").onsubmit=async ev=>{
   ev.preventDefault();
   const payload={
     p_id:e.id||null,p_nome:$("f-nome").value.trim(),p_documento:$("f-doc").value.trim()||null,
     p_licencas:Number($("f-lic").value)||1,p_validade:$("f-validade").value||null,
     p_ativa:$("f-ativa").value==="true",p_gerente_email:null,
     p_responsavel_nome:$("f-resp-nome").value.trim()||null,
     p_responsavel_email:$("f-resp-email").value.trim().toLowerCase()||null,
     p_observacoes:$("f-obs").value.trim()||null
   };
   const {data:empresaId,error}=await sb.rpc("admin_upsert_empresa_v11",payload);
   if(error)return toast("Erro: "+error.message);

   if(creating){
     const gerenteEmail=$("f-gerente").value.trim().toLowerCase();
     const gerenteNome=$("f-gerente-nome").value.trim();
     const {data:created,error:fnError}=await sb.functions.invoke("core-orca-admin-users",{
       body:{action:"create-manager",empresa_id:empresaId,email:gerenteEmail,nome:gerenteNome}
     });
     if(fnError||created?.error){
       return toast("Empresa criada, mas houve erro ao criar o Gerente: "+await edgeFunctionError(fnError,created));
     }
     closeModal();
     await loadSaasAdmin();renderSaasAdmin();
     showTemporaryPassword(gerenteEmail,created.temporary_password);
     return;
   }
   closeModal();await loadSaasAdmin();renderSaasAdmin();toast("Empresa atualizada.");
 };
}

async function edgeFunctionError(error,data){
 if(data?.error)return data.error;
 try{if(error?.context){const body=await error.context.clone().json();return body?.error||body?.message||error?.message||"erro desconhecido"}}catch(_){}
 return error?.message||"erro desconhecido";
}

function showTemporaryPassword(email,password){
 openModal("Gerente criado",`<p>O login do Gerente foi criado.</p>
 <div class="temp-password-box">
   <div><b>Login:</b> ${esc(email)}</div>
   <div style="margin-top:10px"><b>Senha temporária:</b></div>
   <div class="temp-password">${esc(password)}</div>
 </div>
 <p class="muted">Copie essa senha agora. Ela não será armazenada em texto aberto nem exibida novamente. No primeiro login o Gerente deverá criar uma nova senha.</p>
 <div class="modal-actions"><button class="btn primary" onclick="closeModal()">Concluir</button></div>`);
}

function forcePasswordChange(){
 openModal("Crie sua nova senha",`<div class="force-password-note"><b>Primeiro acesso.</b> Para continuar, substitua a senha temporária por uma senha pessoal.</div>
 <form id="force-password-form">
   <div class="form-grid">
     <label>Nova senha<input id="new-password" type="password" minlength="8" required autocomplete="new-password"></label>
     <label>Confirmar nova senha<input id="new-password-2" type="password" minlength="8" required autocomplete="new-password"></label>
   </div>
   <div id="password-change-error" class="error"></div>
   <div class="modal-actions"><button class="btn primary">Alterar senha e entrar</button></div>
 </form>`);
 $("modal-close").classList.add("hidden");
 $("force-password-form").onsubmit=async ev=>{
   ev.preventDefault();
   const p1=$("new-password").value,p2=$("new-password-2").value;
   if(p1!==p2){$("password-change-error").textContent="As senhas não coincidem.";return}
   if(p1.length<8){$("password-change-error").textContent="Use pelo menos 8 caracteres.";return}
   const {error}=await sb.auth.updateUser({password:p1});
   if(error){$("password-change-error").textContent=error.message;return}
   const r=await sb.rpc("concluir_primeira_troca_senha");
   if(r.error){$("password-change-error").textContent=r.error.message;return}
   $("modal-close").classList.remove("hidden");closeModal();
   await refreshAll();
   toast("Senha alterada com sucesso.");
 };
}

async function manageLicenses(empresaId){
 const empresa=empresasSaas.find(e=>e.id===empresaId);
 const {data,error}=await sb.rpc("admin_list_licencas_v11",{p_empresa_id:empresaId});
 if(error)return toast(error.message);
 const rows=data||[];
 openModal("Licenças — "+empresa.nome,`<div class="panel-head"><div><p class="muted">Gerencie individualmente cada licença desta empresa.</p></div><button id="add-license-btn" class="btn primary">+ Licença</button></div>
 <div class="license-list">${rows.map(l=>`<div class="license-row">
   <b>Licença ${l.numero}</b>
   <span class="${l.status==="ativa"?"license-active":"license-blocked"}">${statusLabel(l.status)}</span>
   <span>${esc(l.usuario_email||"Não atribuída")}</span>
   <div class="action-group">
     ${l.status==="ativa"?`<button class="action-btn warning" onclick="licenseAction('${l.id}','block','${empresaId}')">Bloquear</button>`:`<button class="action-btn" onclick="licenseAction('${l.id}','activate','${empresaId}')">Ativar</button>`}
     <button class="action-btn danger" onclick="licenseAction('${l.id}','delete','${empresaId}')">Excluir</button>
   </div>
 </div>`).join("")||"<p>Nenhuma licença cadastrada.</p>"}</div>`);
 $("add-license-btn").onclick=async()=>{
   const {error}=await sb.rpc("admin_add_license_v11",{p_empresa_id:empresaId});
   if(error)return toast(error.message);
   closeModal();await loadSaasAdmin();renderSaasAdmin();manageLicenses(empresaId);
 };
}

async function licenseAction(id,action,empresaId){
 if(action==="delete"&&!confirm("Excluir esta licença? Se estiver vinculada a um usuário, o acesso desse usuário será desativado."))return;
 const {error}=await sb.rpc("admin_license_action_v11",{p_license_id:id,p_action:action});
 if(error)return toast(error.message);
 closeModal();await loadSaasAdmin();renderSaasAdmin();manageLicenses(empresaId);
}

async function deleteCompany(id){
 const e=empresasSaas.find(x=>x.id===id);
 if(!e)return;
 if(!confirm(`EXCLUIR a empresa "${e.nome}"? Todos os clientes, materiais, OS, financeiro e demais dados dessa empresa serão apagados. Esta ação não pode ser desfeita.`))return;
 const typed=prompt(`Para confirmar, digite exatamente o nome da empresa:\n${e.nome}`);
 if(typed!==e.nome)return toast("Exclusão cancelada.");
 const {data,error}=await sb.functions.invoke("core-orca-admin-users",{body:{action:"delete-company",empresa_id:id}});
 if(error||data?.error)return toast("Erro ao excluir: "+await edgeFunctionError(error,data));
 await loadSaasAdmin();renderSaasAdmin();toast("Empresa excluída.");
}

function renderFornecedores(){
 const q=$("fornecedor-search").value, rows=fornecedores.filter(f=>smartSearch(f,q));
 $("fornecedores-table").innerHTML=rows.map(f=>`<tr><td><b>${esc(f.nome)}</b><br><span class="muted">${esc(f.email||"")}</span></td><td>${esc(f.documento||"-")}</td><td>${esc(f.telefone||"-")}</td><td>${esc([f.cidade,f.uf].filter(Boolean).join("/")||"-")}</td><td><div class="actions"><button class="action-btn" onclick="editFornecedor('${f.id}')">Editar</button><button class="action-btn" onclick="deleteFornecedor('${f.id}')">Excluir</button></div></td></tr>`).join("")||'<tr><td colspan="5">Nenhum fornecedor.</td></tr>';
}
function fornecedorForm(f={}){
 openModal(f.id?"Editar fornecedor":"Novo fornecedor",`<form id="entity-form"><div class="form-grid"><label>Nome / Razão social*<input id="f-nome" required value="${esc(f.nome)}"></label><label>CNPJ / CPF<input id="f-doc" data-mask="document" inputmode="numeric" value="${esc(f.documento)}"></label><label>Telefone<input id="f-tel" data-mask="phone" inputmode="numeric" value="${esc(f.telefone)}"></label><label>E-mail<input id="f-email" type="email" value="${esc(f.email)}"></label><label>CEP<input id="f-cep" data-mask="cep" inputmode="numeric" value="${esc(f.cep)}"></label><label>Endereço<input id="f-end" value="${esc(f.endereco)}"></label><label>Cidade<input id="f-cidade" value="${esc(f.cidade)}"></label><label>UF<input id="f-uf" maxlength="2" value="${esc(f.uf)}"></label><label class="span-2">Observações<textarea id="f-obs">${esc(f.observacoes)}</textarea></label></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={nome:$("f-nome").value.trim(),documento:$("f-doc").value.trim(),telefone:$("f-tel").value.trim(),email:$("f-email").value.trim(),cep:$("f-cep").value.trim(),endereco:$("f-end").value.trim(),cidade:$("f-cidade").value.trim(),uf:$("f-uf").value.trim().toUpperCase(),observacoes:$("f-obs").value.trim()};const r=f.id?await sb.from("fornecedores").update(obj).eq("id",f.id):await sb.from("fornecedores").insert(obj);if(r.error)return toast(r.error.message);closeModal();await loadFornecedores();renderFornecedores();toast("Fornecedor salvo")};
}
function editFornecedor(id){const f=fornecedores.find(x=>x.id===id);if(f)fornecedorForm(f)}
async function deleteFornecedor(id){if(!confirm("Excluir fornecedor?"))return;const {error}=await sb.from("fornecedores").update({ativo:false}).eq("id",id);if(error)return toast(error.message);await loadFornecedores();renderFornecedores()}

function renderCompras(){
 const q=$("compra-search").value, rows=compras.filter(c=>smartSearch(c,q));
 $("compras-table").innerHTML=rows.map(c=>`<tr><td><b>${esc(c.numero)}</b></td><td>${esc(c.fornecedores?.nome||"-")}</td><td>${new Date(c.data_compra+"T12:00:00").toLocaleDateString("pt-BR")}</td><td><span class="badge ${esc(c.status)}">${statusLabel(c.status)}</span></td><td>${money(c.total)}</td><td><div class="actions"><button class="action-btn" onclick="viewCompra('${c.id}')">Abrir</button>${c.status==="rascunho"?`<button class="action-btn" onclick="confirmCompra('${c.id}')">Confirmar entrada</button>`:""}</div></td></tr>`).join("")||'<tr><td colspan="6">Nenhuma compra.</td></tr>';
}
function compraForm(){
 editorItens=[];openModal("Nova compra",`<form id="entity-form"><div class="form-grid"><label>Fornecedor*<select id="f-fornecedor" required><option value="">Selecione...</option>${fornecedores.map(f=>`<option value="${f.id}">${esc(f.nome)}</option>`).join("")}</select></label><label>Data<input id="f-data" type="date" value="${today()}"></label><label>Vencimento<input id="f-vencimento" type="date"></label><label>Documento / NF<input id="f-documento"></label><label class="span-2">Observações<textarea id="f-obs"></textarea></label></div><div class="item-builder"><b>Materiais da compra</b><div class="form-grid"><label>Pesquisar material<input id="buy-search" autocomplete="off" placeholder="Código ou nome"><div id="buy-suggestions" class="suggestions hidden"></div></label><label>Quantidade<input id="buy-qtd" type="number" min="0.001" step="0.001" value="1"></label><label>Custo unitário<input id="buy-cost" type="number" min="0" step="0.01"></label></div><input id="buy-id" type="hidden"><button type="button" id="buy-add" class="btn secondary">Adicionar</button><div class="items-table"><table><thead><tr><th>Material</th><th>Qtd.</th><th>Custo</th><th>Total</th><th></th></tr></thead><tbody id="buy-items"></tbody></table></div><div class="totals">Total: <span id="buy-total">R$ 0,00</span></div></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar compra</button></div></form>`);
 const s=$("buy-search"),box=$("buy-suggestions");s.oninput=()=>{const q=s.value;$("buy-id").value="";if(!q.trim())return box.classList.add("hidden");const found=materiais.filter(m=>smartSearch(m,q)).slice(0,30);box.innerHTML=found.map(m=>`<div class="suggestion" data-id="${m.id}">${esc(m.codigo||"")} ${esc(m.nome)} — custo ${money(m.custo)}</div>`).join("");box.classList.remove("hidden");box.querySelectorAll("[data-id]").forEach(el=>el.onclick=()=>{const m=materiais.find(x=>x.id===el.dataset.id);$("buy-id").value=m.id;s.value=`${m.codigo?m.codigo+" - ":""}${m.nome}`;$("buy-cost").value=Number(m.custo||0);box.classList.add("hidden")})};
 function draw(){ $("buy-items").innerHTML=editorItens.map((i,n)=>`<tr><td>${esc(i.descricao)}</td><td>${i.quantidade}</td><td>${money(i.valor_unitario)}</td><td>${money(i.quantidade*i.valor_unitario)}</td><td><button type="button" class="action-btn" data-rm="${n}">Remover</button></td></tr>`).join("")||'<tr><td colspan="5">Sem itens.</td></tr>';$("buy-total").textContent=money(editorItens.reduce((a,i)=>a+i.quantidade*i.valor_unitario,0));document.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{editorItens.splice(Number(b.dataset.rm),1);draw()})}
 $("buy-add").onclick=()=>{const id=$("buy-id").value,q=Number($("buy-qtd").value),c=Number($("buy-cost").value);const m=materiais.find(x=>x.id===id);if(!m||q<=0)return toast("Selecione um material.");editorItens.push({referencia_id:id,descricao:m.nome,quantidade:q,valor_unitario:c});s.value="";$("buy-id").value="";$("buy-qtd").value=1;$("buy-cost").value="";draw()};draw();
 $("entity-form").onsubmit=async e=>{e.preventDefault();if(!editorItens.length)return toast("Adicione materiais.");const total=editorItens.reduce((a,i)=>a+i.quantidade*i.valor_unitario,0);const {data,error}=await sb.from("compras").insert({fornecedor_id:$("f-fornecedor").value,data_compra:$("f-data").value,vencimento:$("f-vencimento").value||null,documento:$("f-documento").value.trim(),observacoes:$("f-obs").value.trim(),total,status:"rascunho"}).select().single();if(error)return toast(error.message);const r=await sb.from("compra_itens").insert(editorItens.map(i=>({compra_id:data.id,material_id:i.referencia_id,descricao:i.descricao,quantidade:i.quantidade,custo_unitario:i.valor_unitario})));if(r.error)return toast(r.error.message);closeModal();await loadCompras();renderCompras();toast("Compra criada")};
}
async function viewCompra(id){const c=compras.find(x=>x.id===id);const {data,error}=await sb.from("compra_itens").select("*").eq("compra_id",id);if(error)return toast(error.message);openModal("Compra "+c.numero,`<p><b>Fornecedor:</b> ${esc(c.fornecedores?.nome||"-")}</p><p><b>Status:</b> ${statusLabel(c.status)}</p><div class="table-wrap"><table><thead><tr><th>Material</th><th>Qtd.</th><th>Custo</th><th>Total</th></tr></thead><tbody>${data.map(i=>`<tr><td>${esc(i.descricao)}</td><td>${i.quantidade}</td><td>${money(i.custo_unitario)}</td><td>${money(i.quantidade*i.custo_unitario)}</td></tr>`).join("")}</tbody></table></div><div class="modal-actions"><button class="btn secondary" onclick="closeModal()">Fechar</button></div>`)}
async function confirmCompra(id){if(!confirm("Confirmar compra? Isso dará entrada no estoque e criará a conta a pagar."))return;const {data,error}=await sb.rpc("confirmar_compra",{p_compra_id:id});if(error)return toast(error.message);await Promise.all([loadCompras(),loadMateriais(),loadFinanceiro()]);renderCompras();renderDashboard();toast(data)}

function renderUsuarios(){
 const q=$("usuario-search").value, rows=usuarios.filter(u=>smartSearch(u,q));
 $("usuarios-table").innerHTML=rows.map(u=>`<tr><td>${esc(u.nome||"-")}</td><td>${esc(u.email)}</td><td>${statusLabel(u.tipo)}</td><td>${esc(u.cargos?.nome||"-")}</td><td>${u.ativo?"Ativo":"Inativo"}</td><td><button class="action-btn" onclick="editUsuario('${u.id}')">Editar</button></td></tr>`).join("")||'<tr><td colspan="6">Nenhum usuário da empresa.</td></tr>';
}
function usuarioForm(u={}){
 const creating=!u.id;
 openModal(creating?"Novo usuário da empresa":"Editar usuário",`<form id="entity-form">
 <div class="form-grid">
  <label>Nome*<input id="f-nome" required value="${esc(u.nome||"")}"></label>
  <label>E-mail de login*<input id="f-email" type="email" required value="${esc(u.email||"")}" ${creating?"":"readonly"}></label>
  <label>Tipo<select id="f-tipo"><option value="colaborador" ${u.tipo!=="gerente"?"selected":""}>Colaborador</option><option value="gerente" ${u.tipo==="gerente"?"selected":""}>Gerente</option></select></label>
  <label>Cargo do colaborador<select id="f-cargo"><option value="">Sem cargo</option>${cargos.map(c=>`<option value="${c.id}" ${u.cargo_id===c.id?"selected":""}>${esc(c.nome)}</option>`).join("")}</select></label>
  <label>Ativo<select id="f-ativo"><option value="true">Sim</option><option value="false" ${u.ativo===false?"selected":""}>Não</option></select></label>
 </div>
 ${creating?'<div class="force-password-note">Ao salvar, será criado o login no Supabase e uma senha temporária aleatória será exibida uma única vez. No primeiro acesso, o usuário deverá obrigatoriamente definir uma nova senha.</div>':""}
 <div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar usuário</button></div>
 </form>`);
 $("entity-form").onsubmit=async e=>{
  e.preventDefault();
  const nome=$("f-nome").value.trim();
  const email=$("f-email").value.trim().toLowerCase();
  const tipo=$("f-tipo").value;
  const cargoId=tipo==="colaborador"?($("f-cargo").value||null):null;
  const ativo=$("f-ativo").value==="true";

  if(creating){
   const {data:created,error:fnError}=await sb.functions.invoke("core-orca-admin-users",{
    body:{action:"create-company-user",empresa_id:currentUserProfile?.empresa_id,email,nome,tipo,cargo_id:cargoId,ativo}
   });
   if(fnError||created?.error)return toast("Erro ao criar usuário: "+await edgeFunctionError(fnError,created));
   closeModal();await loadUsuarios();renderUsuarios();
   showTemporaryPassword(email,created.temporary_password,"Usuário criado");
   return;
  }

  const {error}=await sb.rpc("gerente_upsert_usuario",{p_id:u.id,p_nome:nome,p_email:email,p_tipo:tipo,p_cargo_id:cargoId,p_ativo:ativo});
  if(error)return toast(error.message);
  closeModal();await loadUsuarios();renderUsuarios();toast("Usuário salvo");
 };
}

function editUsuario(id){const u=usuarios.find(x=>x.id===id);if(u)usuarioForm(u)}

async function duplicateOrcamento(id){
 const o=orcamentos.find(x=>x.id===id);const {data:itens,error}=await sb.from("orcamento_itens").select("*").eq("orcamento_id",id).order("ordem");if(error)return toast(error.message);
 const {data:n,error:e}=await sb.from("orcamentos").insert({cliente_id:o.cliente_id,data_orcamento:today(),validade_dias:o.validade_dias,status:"rascunho",observacoes:o.observacoes,subtotal:o.subtotal,desconto:o.desconto,total:o.total}).select().single();if(e)return toast(e.message);
 const r=await sb.from("orcamento_itens").insert(itens.map(i=>({orcamento_id:n.id,tipo:i.tipo,material_id:i.material_id,servico_id:i.servico_id,descricao:i.descricao,quantidade:i.quantidade,valor_unitario:i.valor_unitario,ordem:i.ordem})));if(r.error)return toast(r.error.message);await loadOrcamentos();renderOrcamentos();toast("Orçamento duplicado: "+n.numero);
}
async function editOrcamento(id){
 const o=orcamentos.find(x=>x.id===id);const {data:itens,error}=await sb.from("orcamento_itens").select("*").eq("orcamento_id",id).order("ordem");if(error)return toast(error.message);
 editorItens=itens.map(i=>({tipo:i.tipo,referencia_id:i.material_id||i.servico_id,descricao:i.descricao,quantidade:Number(i.quantidade),valor_unitario:Number(i.valor_unitario)}));
 openModal("Editar "+o.numero,`<form id="entity-form"><div class="form-grid"><label>Status<select id="f-status"><option value="rascunho">Rascunho</option><option value="enviado">Enviado</option><option value="aprovado">Aprovado</option><option value="reprovado">Reprovado</option><option value="cancelado">Cancelado</option></select></label><label>Validade<input id="f-validade" type="number" value="${o.validade_dias}"></label><label>Desconto<input id="f-desconto" type="number" step="0.01" value="${o.desconto}"></label><label class="span-2">Observações<textarea id="f-obs">${esc(o.observacoes||"")}</textarea></label></div>${itemEditorHTML()}<div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar alterações</button></div></form>`);
 $("f-status").value=o.status;setupItemEditor();$("f-desconto").oninput=calcEditorTotal;
 $("entity-form").onsubmit=async e=>{e.preventDefault();const subtotal=editorItens.reduce((s,i)=>s+i.quantidade*i.valor_unitario,0),desconto=Number($("f-desconto").value)||0;const h=await sb.from("orcamentos").update({status:$("f-status").value,validade_dias:Number($("f-validade").value)||0,observacoes:$("f-obs").value.trim(),subtotal,desconto,total:Math.max(0,subtotal-desconto)}).eq("id",id);if(h.error)return toast(h.error.message);await sb.from("orcamento_itens").delete().eq("orcamento_id",id);const r=await sb.from("orcamento_itens").insert(editorItens.map((i,n)=>({orcamento_id:id,tipo:i.tipo,material_id:i.tipo==="material"?i.referencia_id:null,servico_id:i.tipo==="servico"?i.referencia_id:null,descricao:i.descricao,quantidade:i.quantidade,valor_unitario:i.valor_unitario,ordem:n})));if(r.error)return toast(r.error.message);closeModal();await loadOrcamentos();renderOrcamentos();toast("Orçamento atualizado")};
}
async function editOS(id){
 const o=ordens.find(x=>x.id===id);openModal("Editar "+o.numero,`<form id="entity-form"><div class="form-grid"><label>Status<select id="f-status"><option value="aberta">Aberta</option><option value="em_andamento">Em andamento</option><option value="aguardando_material">Aguardando material</option><option value="cancelada">Cancelada</option></select></label><label>Responsável<select id="f-responsavel"><option value="">Selecione...</option>${tecnicos.filter(t=>t.ativo).map(t=>`<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join("")}</select></label><label class="span-2">Local<input id="f-local" value="${esc(o.local_servico||"")}"></label><label class="span-2">Solicitação<textarea id="f-problema">${esc(o.descricao_problema||"")}</textarea></label><label>Previsão<input id="f-previsao" type="date" value="${o.previsao_conclusao||""}"></label><label class="span-2">Observações<textarea id="f-obs">${esc(o.observacoes||"")}</textarea></label></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("f-status").value=o.status==="concluida"?"em_andamento":o.status;$("f-responsavel").value=o.responsavel||"";
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={status:$("f-status").value,responsavel:$("f-responsavel").value,local_servico:$("f-local").value.trim(),descricao_problema:$("f-problema").value.trim(),previsao_conclusao:$("f-previsao").value||null,observacoes:$("f-obs").value.trim()};const {error}=await sb.from("ordens_servico").update(obj).eq("id",id);if(error)return toast(error.message);await addOSTimeline(id,"edicao","Dados da Ordem de Serviço atualizados.");closeModal();await loadOrdens();renderOS();toast("OS atualizada")};
}

function renderTecnicos(){
 const q=$("tecnico-search").value, rows=tecnicos.filter(t=>smartSearch(t,q));
 $("tecnicos-table").innerHTML=rows.map(t=>`<tr><td><b>${esc(t.nome)}</b></td><td>${esc(t.funcao||"-")}</td><td>${esc(t.telefone||"-")}</td><td>${esc(t.email||"-")}</td><td>${t.ativo?"Ativo":"Inativo"}</td><td><div class="actions"><button class="action-btn" onclick="editTecnico('${t.id}')">Editar</button><button class="action-btn" onclick="toggleTecnico('${t.id}',${!t.ativo})">${t.ativo?"Inativar":"Ativar"}</button></div></td></tr>`).join("")||'<tr><td colspan="6">Nenhum técnico.</td></tr>';
}
function tecnicoForm(t={}){
 openModal(t.id?"Editar técnico":"Novo técnico",`<form id="entity-form"><div class="form-grid"><label>Nome*<input id="f-nome" required value="${esc(t.nome)}"></label><label>Função<input id="f-funcao" value="${esc(t.funcao)}"></label><label>Telefone<input id="f-telefone" data-mask="phone" inputmode="numeric" value="${esc(t.telefone)}"></label><label>E-mail<input id="f-email" type="email" value="${esc(t.email)}"></label><label class="span-2">Observações<textarea id="f-obs">${esc(t.observacoes)}</textarea></label></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={nome:$("f-nome").value.trim(),funcao:$("f-funcao").value.trim(),telefone:$("f-telefone").value.trim(),email:$("f-email").value.trim(),observacoes:$("f-obs").value.trim()};const r=t.id?await sb.from("tecnicos").update(obj).eq("id",t.id):await sb.from("tecnicos").insert(obj);if(r.error)return toast(r.error.message);closeModal();await loadTecnicos();renderTecnicos();toast("Técnico salvo")};
}
function editTecnico(id){const t=tecnicos.find(x=>x.id===id);if(t)tecnicoForm(t)}
async function toggleTecnico(id,ativo){const {error}=await sb.from("tecnicos").update({ativo}).eq("id",id);if(error)return toast(error.message);await loadTecnicos();renderTecnicos()}

function renderEmpresa(){
 if(!$("empresa-form"))return;const e=empresa||{};
 $("emp-nome").value=e.nome_fantasia||"";$("emp-razao").value=e.razao_social||"";$("emp-cnpj").value=e.cnpj||"";$("emp-telefone").value=e.telefone||"";$("emp-email").value=e.email||"";$("emp-cep").value=e.cep||"";$("emp-endereco").value=e.endereco||"";$("emp-cidade").value=e.cidade||"";$("emp-uf").value=e.uf||"";$("emp-rodape").value=e.rodape_documentos||"";
}
async function saveEmpresa(e){
 e.preventDefault();const obj={nome_fantasia:$("emp-nome").value.trim(),razao_social:$("emp-razao").value.trim(),cnpj:$("emp-cnpj").value.trim(),telefone:$("emp-telefone").value.trim(),email:$("emp-email").value.trim(),cep:$("emp-cep").value.trim(),endereco:$("emp-endereco").value.trim(),cidade:$("emp-cidade").value.trim(),uf:$("emp-uf").value.trim().toUpperCase(),rodape_documentos:$("emp-rodape").value.trim()};
 const logo=$("emp-logo")?.files?.[0];if(logo){const ext=(logo.name.split(".").pop()||"png").toLowerCase(),path=`empresa/logo.${ext}`;const up=await sb.storage.from("empresa-assets").upload(path,logo,{upsert:true,contentType:logo.type});if(up.error)return toast("Logo: "+up.error.message);const {data:u}=sb.storage.from("empresa-assets").getPublicUrl(path);obj.logo_url=u.publicUrl}
 let r;if(empresa?.id)r=await sb.from("empresa_config").update(obj).eq("id",empresa.id);else r=await sb.from("empresa_config").insert(obj);
 if(r.error)return toast(r.error.message);await loadEmpresa();renderEmpresa();toast("Configurações salvas");
}
async function addOSTimeline(osId,tipo,descricao){
 const {error}=await sb.from("os_historico").insert({ordem_servico_id:osId,tipo,descricao});if(error)console.warn(error.message);
}
async function loadOSTimeline(osId){const {data}=await sb.from("os_historico").select("*").eq("ordem_servico_id",osId).order("created_at",{ascending:false});return data||[]}
function companyHeader(){
 const e=empresa||{};return `${e.logo_url?`<img src="${esc(e.logo_url)}" style="max-width:180px;max-height:70px;object-fit:contain">`:""}<h1>${esc(e.nome_fantasia||"Core-Orca")}</h1>${e.razao_social?`<p>${esc(e.razao_social)}</p>`:""}${e.cnpj?`<p>CNPJ: ${esc(e.cnpj)}</p>`:""}<p>${esc([e.telefone,e.email].filter(Boolean).join(" | "))}</p><p>${esc([e.endereco,e.cidade,e.uf].filter(Boolean).join(" - "))}</p>`;
}

async function uploadOSPhoto(osId,file,tipo){
 if(!file)return;
 const ext=(file.name.split(".").pop()||"jpg").toLowerCase(), path=`${osId}/${crypto.randomUUID()}.${ext}`;
 const up=await sb.storage.from("os-fotos").upload(path,file,{contentType:file.type||"image/jpeg"});
 if(up.error)return toast("Foto: "+up.error.message);
 const {error}=await sb.from("os_fotos").insert({ordem_servico_id:osId,storage_path:path,tipo,descricao:file.name});
 if(error)return toast(error.message);
 await addOSTimeline(osId,"foto","Foto adicionada à OS.");toast("Foto enviada");await viewOS(osId);
}
async function deleteOSPhoto(id,path,osId){
 if(!confirm("Excluir esta foto?"))return;
 await sb.storage.from("os-fotos").remove([path]);const {error}=await sb.from("os_fotos").delete().eq("id",id);if(error)return toast(error.message);await viewOS(osId);
}
async function openSignature(osId){
 openModal("Assinatura do cliente",`<label>Nome do cliente<input id="sig-name"></label><div class="signature-wrap"><canvas id="signature-canvas" width="850" height="190"></canvas></div><div class="modal-actions"><button type="button" id="sig-clear" class="btn secondary">Limpar</button><button type="button" class="btn secondary" onclick="viewOS('${osId}')">Cancelar</button><button type="button" id="sig-save" class="btn primary">Salvar assinatura</button></div>`);
 const pad=new SignaturePad($("signature-canvas"),{minWidth:1,maxWidth:2.5});
 $("sig-clear").onclick=()=>pad.clear();
 $("sig-save").onclick=async()=>{if(pad.isEmpty())return toast("Faça a assinatura.");const {error}=await sb.from("ordens_servico").update({assinatura_nome:$("sig-name").value.trim(),assinatura_data_url:pad.toDataURL("image/png"),assinatura_em:new Date().toISOString()}).eq("id",osId);if(error)return toast(error.message);await addOSTimeline(osId,"assinatura","Assinatura do cliente registrada.");toast("Assinatura salva");await loadOrdens();await viewOS(osId)};
}
function printDocument(title,header,items,notes,options={}){
 const w=window.open("","_blank");if(!w)return toast("Permita pop-ups para gerar o PDF.");
 const e=empresa||{};
 const rows=items.map(i=>`<tr>
  <td><span class="pill">${esc(statusLabel(i.tipo))}</span></td>
  <td class="desc">${esc(i.descricao)}</td>
  <td class="num">${Number(i.quantidade||0).toLocaleString("pt-BR")}</td>
  <td class="money">${money(i.valor_unitario)}</td>
  <td class="money strong">${money(Number(i.quantidade||0)*Number(i.valor_unitario||0))}</td>
 </tr>`).join("");
 const logo=e.logo_url?`<img class="brand-logo" src="${esc(e.logo_url)}">`:`<div class="brand-mark">⚡</div>`;
 const companyName=esc(e.nome_fantasia||e.razao_social||"Core-Orça");
 const companyMeta=[
   e.cnpj?`CNPJ ${esc(e.cnpj)}`:"",
   e.telefone?esc(e.telefone):"",
   e.email?esc(e.email):""
 ].filter(Boolean).join(" • ");
 const address=esc([e.endereco,e.cidade,e.uf].filter(Boolean).join(" — "));
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
 <style>
 @page{size:A4;margin:13mm 14mm 15mm}
 *{box-sizing:border-box}
 body{font-family:Arial,Helvetica,sans-serif;color:#172033;font-size:11px;line-height:1.45;margin:0;background:#fff}
 .doc{max-width:190mm;margin:auto}
 .top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-bottom:14px;border-bottom:2px solid #1f4fd6}
 .brand{display:flex;gap:12px;align-items:center;min-width:0}.brand-logo{max-width:155px;max-height:58px;object-fit:contain}
 .brand-mark{width:42px;height:42px;border-radius:10px;background:#1f4fd6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px}
 .company h1{font-size:17px;margin:0 0 3px;color:#101828}.company p{margin:2px 0;color:#667085;font-size:9.5px}
 .doc-title{text-align:right}.doc-title .type{text-transform:uppercase;letter-spacing:1.3px;color:#667085;font-size:9px;font-weight:700}
 .doc-title h2{margin:3px 0 0;font-size:19px;color:#1f4fd6}
 .info{margin:16px 0 12px;padding:12px 14px;background:#f7f9fc;border:1px solid #e4e9f2;border-radius:9px}
 .info p{display:inline-block;vertical-align:top;width:48%;margin:3px 1% 3px 0}.info b{color:#344054}
 table{width:100%;border-collapse:separate;border-spacing:0;margin-top:10px;border:1px solid #e4e9f2;border-radius:8px;overflow:hidden}
 th{background:#f2f5fa;color:#344054;text-transform:uppercase;letter-spacing:.35px;font-size:8.5px;padding:8px 9px;text-align:left}
 td{padding:8px 9px;border-top:1px solid #edf0f5;vertical-align:top}.desc{width:46%}.num{text-align:center}.money{text-align:right;white-space:nowrap}.strong{font-weight:700}
 .pill{font-size:8px;text-transform:uppercase;color:#475467}
 .total{margin:14px 0 4px;text-align:right;font-size:18px;font-weight:800;color:#101828}
 .muted{color:#667085}.section{margin-top:18px}.section-title{font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:#475467;font-weight:700;border-bottom:1px solid #e4e9f2;padding-bottom:5px}
 .signature-box{margin-top:22px;border-top:1px solid #d0d5dd;padding-top:10px;display:flex;gap:20px;align-items:flex-end}
 .signature-image{display:block;max-width:260px;max-height:85px;object-fit:contain;margin:0 auto 3px}
 .signature-person{min-width:280px;text-align:center}.signature-line{border-top:1px solid #667085;padding-top:5px;margin-top:3px}
 .footer{margin-top:24px;padding-top:8px;border-top:1px solid #e4e9f2;color:#98a2b3;font-size:8.5px;display:flex;justify-content:space-between;gap:15px}
 h3{font-size:11px;margin:16px 0 5px;color:#344054}
 @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
 </style></head><body><div class="doc">
 <div class="top"><div class="brand">${logo}<div class="company"><h1>${companyName}</h1>${e.razao_social&&e.razao_social!==e.nome_fantasia?`<p>${esc(e.razao_social)}</p>`:""}<p>${companyMeta}</p><p>${address}</p></div></div>
 <div class="doc-title"><div class="type">Documento</div><h2>${esc(title)}</h2></div></div>
 <div class="info">${header}</div>
 <table><thead><tr><th>Tipo</th><th>Descrição</th><th>Qtd.</th><th style="text-align:right">Unitário</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Sem itens.</td></tr>'}</tbody></table>
 ${notes||""}
 <div class="footer"><span>${esc(e.rodape_documentos||"Documento emitido pelo Core-Orça")}</span><span>Emitido em ${new Date().toLocaleString("pt-BR")}</span></div>
 </div><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);
 w.document.close();
}

async function printOrcamento(id){
 const o=orcamentos.find(x=>x.id===id);const {data,error}=await sb.from("orcamento_itens").select("*").eq("orcamento_id",id).order("ordem");if(error)return toast(error.message);
 printDocument(`Orçamento ${o.numero}`,`<p><b>Cliente:</b> ${esc(o.clientes?.nome||"-")}</p><p><b>Data:</b> ${new Date(o.data_orcamento+"T12:00:00").toLocaleDateString("pt-BR")}</p><p><b>Validade:</b> ${o.validade_dias} dias</p>`,data||[],`<p class="total">Total: ${money(o.total)}</p><p class="muted">${esc(o.observacoes||"")}</p>`);
}
async function printOS(id){
 const o=ordens.find(x=>x.id===id);
 const {data,error}=await sb.from("ordem_servico_itens").select("*").eq("ordem_servico_id",id).order("ordem");
 if(error)return toast(error.message);
 const assinatura=o.assinatura_data_url?`<div class="section"><div class="section-title">Aceite e assinatura do cliente</div>
 <div class="signature-box"><div class="signature-person"><img class="signature-image" src="${o.assinatura_data_url}">
 <div class="signature-line"><b>${esc(o.assinatura_nome||o.clientes?.nome||"Cliente")}</b>${o.assinatura_em?`<br><span class="muted">${new Date(o.assinatura_em).toLocaleString("pt-BR")}</span>`:""}</div></div></div></div>`
 :`<div class="section"><div class="section-title">Aceite e assinatura do cliente</div><p class="muted">Assinatura ainda não registrada.</p></div>`;
 printDocument(`Ordem de Serviço ${o.numero}`,
 `<p><b>Cliente:</b> ${esc(o.clientes?.nome||"-")}</p><p><b>Status:</b> ${esc(statusLabel(o.status))}</p>
  <p><b>Responsável:</b> ${esc(o.responsavel||"-")}</p><p><b>Local:</b> ${esc(o.local_servico||"-")}</p>
  <p style="width:98%"><b>Solicitação:</b> ${esc(o.descricao_problema||"-")}</p>`,
 data||[],`<p class="total">Total: ${money(o.total)}</p>${assinatura}`);
}

function openModal(title,body){$("modal-title").textContent=title;$("modal-body").innerHTML=body;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden");editorItens=[]}

function clienteForm(c={}){
 let contatos=Array.isArray(c.contatos_json)?c.contatos_json:[];
 const contactsHTML=()=>contatos.map((x,n)=>`<div class="contact-row"><input data-cn="${n}" data-k="nome" placeholder="Nome" value="${esc(x.nome)}"><input data-cn="${n}" data-k="telefone" data-mask="phone" inputmode="numeric" placeholder="Telefone" value="${esc(x.telefone)}"><input data-cn="${n}" data-k="email" placeholder="E-mail" value="${esc(x.email)}"><button type="button" class="action-btn" data-crm="${n}">Remover</button></div>`).join("");
 openModal(c.id?"Editar cliente":"Novo cliente",`<form id="entity-form"><div class="form-grid">
 <label>Tipo<select id="f-tipo"><option ${c.tipo_pessoa==="PF"?"selected":""}>PF</option><option ${c.tipo_pessoa==="PJ"?"selected":""}>PJ</option></select></label>
 <label>Nome / Razão social*<input id="f-nome" required value="${esc(c.nome)}"></label><label>CPF / CNPJ<input id="f-documento" data-mask="document" inputmode="numeric" value="${esc(c.documento)}"></label>
 <label>Telefone<input id="f-telefone" data-mask="phone" inputmode="numeric" value="${esc(c.telefone)}"></label><label>Celular<input id="f-celular" data-mask="cell" inputmode="numeric" value="${esc(c.celular)}"></label>
 <label>E-mail<input id="f-email" type="email" value="${esc(c.email)}"></label><label>E-mail cobrança<input id="f-cobranca" type="email" value="${esc(c.email_cobranca)}"></label>
 <label>CEP<input id="f-cep" data-mask="cep" inputmode="numeric" value="${esc(c.cep)}"></label><label>Endereço<input id="f-endereco" value="${esc(c.endereco)}"></label>
 <label>Número<input id="f-numero" value="${esc(c.numero)}"></label><label>Complemento<input id="f-complemento" value="${esc(c.complemento)}"></label>
 <label>Bairro<input id="f-bairro" value="${esc(c.bairro)}"></label><label>Cidade<input id="f-cidade" value="${esc(c.cidade)}"></label>
 <label>Estado<input id="f-estado" maxlength="2" value="${esc(c.estado)}"></label>
 </div>
 <div id="pj-fields" class="pj-fields ${c.tipo_pessoa==="PJ"?"":"hidden"}"><b>Representante legal e contatos da empresa</b><div class="form-grid">
 <label>Representante legal<input id="f-rep-nome" value="${esc(c.representante_legal_nome)}"></label><label>CPF do representante<input id="f-rep-cpf" data-mask="cpf" inputmode="numeric" value="${esc(c.representante_legal_cpf)}"></label>
 <label>Cargo / função<input id="f-rep-cargo" value="${esc(c.representante_legal_cargo)}"></label><label>E-mail<input id="f-rep-email" type="email" value="${esc(c.representante_legal_email)}"></label>
 <label>Telefone<input id="f-rep-tel" data-mask="phone" inputmode="numeric" value="${esc(c.representante_legal_telefone)}"></label></div>
 <div id="contacts-box">${contactsHTML()}</div><button type="button" id="add-contact" class="btn secondary">+ Contato</button></div>
 <label class="span-2">Observações<textarea id="f-obs">${esc(c.observacoes)}</textarea></label>
 <div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 const drawContacts=()=>{const box=$("contacts-box");box.innerHTML=contactsHTML();box.querySelectorAll("[data-cn]").forEach(i=>i.oninput=()=>contatos[Number(i.dataset.cn)][i.dataset.k]=i.value);box.querySelectorAll("[data-crm]").forEach(b=>b.onclick=()=>{contatos.splice(Number(b.dataset.crm),1);drawContacts()})};
 $("f-tipo").onchange=()=>$("pj-fields").classList.toggle("hidden",$("f-tipo").value!=="PJ");
 $("add-contact").onclick=()=>{contatos.push({nome:"",telefone:"",email:""});drawContacts()};
 drawContacts();
 $("entity-form").onsubmit=async e=>{e.preventDefault();const pj=$("f-tipo").value==="PJ";const obj={tipo_pessoa:$("f-tipo").value,nome:$("f-nome").value.trim(),documento:$("f-documento").value.trim(),telefone:$("f-telefone").value.trim(),celular:$("f-celular").value.trim(),email:$("f-email").value.trim(),email_cobranca:$("f-cobranca").value.trim(),cep:$("f-cep").value.trim(),endereco:$("f-endereco").value.trim(),numero:$("f-numero").value.trim(),complemento:$("f-complemento").value.trim(),bairro:$("f-bairro").value.trim(),cidade:$("f-cidade").value.trim(),estado:$("f-estado").value.trim().toUpperCase(),observacoes:$("f-obs").value.trim(),representante_legal_nome:pj?$("f-rep-nome").value.trim():null,representante_legal_cpf:pj?$("f-rep-cpf").value.trim():null,representante_legal_cargo:pj?$("f-rep-cargo").value.trim():null,representante_legal_email:pj?$("f-rep-email").value.trim():null,representante_legal_telefone:pj?$("f-rep-tel").value.trim():null,contatos_json:pj?contatos.filter(x=>x.nome||x.telefone||x.email):[],empresa_id:currentUserProfile?.empresa_id};const res=c.id?await sb.from("clientes").update(obj).eq("id",c.id).eq("empresa_id",currentUserProfile?.empresa_id):await sb.from("clientes").insert(obj);if(res.error)return toast("Erro: "+res.error.message);closeModal();toast("Cliente salvo");await loadClientes();renderClientes();renderDashboard()};
}
function editCliente(id){const c=clientes.find(x=>x.id===id);if(c)clienteForm(c)}
async function deleteCliente(id){if(!confirm("Excluir este cliente?"))return;const {error}=await sb.from("clientes").update({ativo:false}).eq("id",id).eq("empresa_id",currentUserProfile?.empresa_id);if(error)return toast("Erro: "+error.message);await loadClientes();renderClientes();renderDashboard()}

function materialForm(m={}){
 openModal(m.id?"Editar material":"Novo material",`<form id="entity-form"><div class="form-grid">
 <label>Código<input id="f-codigo" value="${esc(m.codigo||"Gerado automaticamente")}" disabled></label><label>Nome*<input id="f-nome" required value="${esc(m.nome)}"></label>
 <label>Descrição<input id="f-descricao" value="${esc(m.descricao)}"></label><label>Categoria<input id="f-categoria" value="${esc(m.categoria)}"></label>
 <label>Fabricante<input id="f-fabricante" value="${esc(m.fabricante)}"></label><label>Unidade<input id="f-unidade" value="${esc(m.unidade||"UN")}"></label>
 <label>Estoque atual<input id="f-estoque" type="number" step="0.001" value="${m.estoque_atual??0}"></label><label>Estoque mínimo<input id="f-minimo" type="number" step="0.001" value="${m.estoque_minimo??0}"></label>
 <label>Custo<input id="f-custo" type="number" min="0" step="0.01" value="${m.custo??0}"></label><label>Preço de venda<input id="f-preco" type="number" min="0" step="0.01" value="${m.preco_venda??0}"></label>
 <label>Lucro em R$<input id="f-lucro" disabled></label><label>Lucro sobre custo (%)<input id="f-margem" disabled></label><label class="span-2">Fotos do material<input id="f-fotos" type="file" accept="image/*" multiple></label>
 </div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 const calc=()=>{const c=Number($("f-custo").value)||0,p=Number($("f-preco").value)||0;$("f-lucro").value=money(p-c);$("f-margem").value=(c>0?((p-c)/c*100):0).toLocaleString("pt-BR",{maximumFractionDigits:2})+"%"};
 $("f-custo").oninput=calc;$("f-preco").oninput=calc;calc();
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={nome:$("f-nome").value.trim(),descricao:$("f-descricao").value.trim(),categoria:$("f-categoria").value.trim(),fabricante:$("f-fabricante").value.trim(),unidade:$("f-unidade").value.trim()||"UN",estoque_atual:Number($("f-estoque").value)||0,estoque_minimo:Number($("f-minimo").value)||0,custo:Number($("f-custo").value)||0,preco_venda:Number($("f-preco").value)||0};const res=m.id?await sb.from("materiais").update(obj).eq("id",m.id).select("id").single():await sb.from("materiais").insert(obj).select("id").single();if(res.error)return toast("Erro: "+res.error.message);const materialId=m.id||res.data?.id;for(const file of [...($("f-fotos")?.files||[])])await uploadMaterialPhoto(materialId,file);closeModal();await loadMateriais();renderMateriais();renderDashboard();toast("Material salvo")};
}

async function uploadMaterialPhoto(materialId,file){
 if(!file)return;
 const ext=(file.name.split(".").pop()||"jpg").toLowerCase(),path=`${currentUserProfile?.empresa_id}/${materialId}/${crypto.randomUUID()}.${ext}`;
 const up=await sb.storage.from("material-fotos").upload(path,file,{contentType:file.type||"image/jpeg"});
 if(up.error)return toast("Foto do material: "+up.error.message);
 const {error}=await sb.from("material_fotos").insert({material_id:materialId,storage_path:path,nome_arquivo:file.name});
 if(error)toast(error.message);
}
async function materialPhotos(id){
 const {data,error}=await sb.from("material_fotos").select("*").eq("material_id",id).order("created_at",{ascending:false});if(error)return toast(error.message);
 openModal("Fotos do material",`<div class="photo-grid">${(data||[]).map(f=>{const {data:u}=sb.storage.from("material-fotos").getPublicUrl(f.storage_path);return `<div class="photo-card"><img src="${u.publicUrl}"><div><button class="action-btn danger" onclick="deleteMaterialPhoto('${f.id}','${f.storage_path}','${id}')">Excluir</button></div></div>`}).join("")||'<span class="muted">Nenhuma foto.</span>'}</div><div class="modal-actions"><button class="btn secondary" onclick="closeModal()">Fechar</button></div>`);
}
async function deleteMaterialPhoto(id,path,materialId){if(!confirm("Excluir esta foto?"))return;await sb.storage.from("material-fotos").remove([path]);const {error}=await sb.from("material_fotos").delete().eq("id",id);if(error)return toast(error.message);await materialPhotos(materialId)}

function editMaterial(id){const m=materiais.find(x=>x.id===id);if(m)materialForm(m)}
async function deleteMaterial(id){if(!confirm("Excluir este material?"))return;const {error}=await sb.from("materiais").update({ativo:false}).eq("id",id);if(error)return toast("Erro: "+error.message);await loadMateriais();renderMateriais();renderDashboard()}

async function servicoForm(s={}){
 let vinculados=[];
 if(s.id){const {data}=await sb.from("servico_materiais").select("*").eq("servico_id",s.id);vinculados=(data||[]).map(x=>({material_id:x.material_id,quantidade:Number(x.quantidade)}))}
 const draw=()=>{const tb=$("service-materials");if(!tb)return;tb.innerHTML=vinculados.map((x,n)=>{const m=materiais.find(a=>a.id===x.material_id);return `<tr><td>${esc(m?.codigo||"")} ${esc(m?.nome||"Material")}</td><td>${x.quantidade}</td><td><button type="button" class="action-btn" data-srm="${n}">Remover</button></td></tr>`}).join("")||'<tr><td colspan="3">Nenhum material vinculado.</td></tr>';tb.querySelectorAll("[data-srm]").forEach(b=>b.onclick=()=>{vinculados.splice(Number(b.dataset.srm),1);draw()})};
 openModal(s.id?"Editar serviço":"Novo serviço",`<form id="entity-form"><div class="form-grid"><label>Código<input id="f-codigo" value="${esc(s.codigo)}"></label><label>Nome*<input id="f-nome" required value="${esc(s.nome)}"></label><label>Categoria<input id="f-categoria" value="${esc(s.categoria)}"></label><label>Unidade<input id="f-unidade" value="${esc(s.unidade||"SV")}"></label><label>Valor<input id="f-valor" type="number" min="0" step="0.01" value="${s.valor??0}"></label><label class="span-2">Descrição<textarea id="f-descricao">${esc(s.descricao)}</textarea></label></div>
 <div class="item-builder"><b>Materiais vinculados ao serviço</b><div class="form-grid"><label>Material<select id="sm-material"><option value="">Selecione...</option>${materiais.map(m=>`<option value="${m.id}">${esc(m.codigo||"")} ${esc(m.nome)}</option>`).join("")}</select></label><label>Quantidade<input id="sm-qtd" type="number" min="0.001" step="0.001" value="1"></label></div><button type="button" id="sm-add" class="btn secondary">+ Vincular material</button><div class="items-table"><table><thead><tr><th>Material</th><th>Qtd.</th><th></th></tr></thead><tbody id="service-materials"></tbody></table></div></div>
 <div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("sm-add").onclick=()=>{const id=$("sm-material").value,q=Number($("sm-qtd").value);if(!id||q<=0)return toast("Selecione material e quantidade.");const ex=vinculados.find(x=>x.material_id===id);if(ex)ex.quantidade+=q;else vinculados.push({material_id:id,quantidade:q});draw()};draw();
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={codigo:$("f-codigo").value.trim()||null,nome:$("f-nome").value.trim(),categoria:$("f-categoria").value.trim(),unidade:$("f-unidade").value.trim()||"SV",valor:Number($("f-valor").value)||0,descricao:$("f-descricao").value.trim()};let id=s.id;let res;if(id)res=await sb.from("servicos").update(obj).eq("id",id);else{res=await sb.from("servicos").insert(obj).select().single();id=res.data?.id}if(res.error)return toast("Erro: "+res.error.message);await sb.from("servico_materiais").delete().eq("servico_id",id);if(vinculados.length){const r=await sb.from("servico_materiais").insert(vinculados.map(x=>({servico_id:id,material_id:x.material_id,quantidade:x.quantidade})));if(r.error)return toast("Serviço salvo, mas erro nos materiais: "+r.error.message)}closeModal();await loadServicos();renderServicos();toast("Serviço salvo")};
}
function editServico(id){const s=servicos.find(x=>x.id===id);if(s)servicoForm(s)}
async function deleteServico(id){if(!confirm("Excluir este serviço?"))return;const {error}=await sb.from("servicos").update({ativo:false}).eq("id",id);if(error)return toast("Erro: "+error.message);await loadServicos();renderServicos()}

function movementForm(){
 openModal("Movimentar estoque",`<form id="entity-form"><label>Material<select id="f-material" required>${materiais.map(m=>`<option value="${m.id}">${esc(m.codigo?m.codigo+" - ":"")}${esc(m.nome)} — estoque: ${m.estoque_atual} ${esc(m.unidade)}</option>`).join("")}</select></label><label>Tipo<select id="f-tipo"><option>ENTRADA</option><option>SAIDA</option><option>AJUSTE</option></select></label><label>Quantidade*<input id="f-qtd" type="number" step="0.001" min="0.001" required></label><label>Motivo<input id="f-motivo"></label><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Registrar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const {error}=await sb.rpc("registrar_movimentacao_estoque",{p_material_id:$("f-material").value,p_tipo:$("f-tipo").value,p_quantidade:Number($("f-qtd").value),p_motivo:$("f-motivo").value.trim()});if(error)return toast("Erro: "+error.message);closeModal();await loadMateriais();renderEstoque();renderDashboard();toast("Movimentação registrada")};
}

function itemEditorHTML(){
 return `<div class="item-builder"><b>Itens</b>
 <div class="form-grid">
   <label>Tipo
     <select id="item-tipo">
       <option value="material">Material</option>
       <option value="servico">Serviço</option>
     </select>
   </label>
   <label>Material / Serviço
     <select id="item-select">
       <option value="">Selecione...</option>
     </select>
   </label>
   <label>Quantidade
     <input id="item-qtd" type="number" min="0.001" step="0.001" value="1">
   </label>
   <label>Valor unitário
     <input id="item-valor" type="number" min="0" step="0.01">
   </label>
 </div>
 <button type="button" id="add-item" class="btn secondary">Adicionar item</button>
 <div class="items-table"><table>
   <thead><tr><th>Tipo</th><th>Descrição</th><th>Qtd.</th><th>Unitário</th><th>Total</th><th></th></tr></thead>
   <tbody id="editor-itens"></tbody>
 </table></div>
 <div class="totals">
   <span>Subtotal: <span id="editor-subtotal">R$ 0,00</span></span>
   <span>Total: <span id="editor-total">R$ 0,00</span></span>
 </div></div>`;
}
function setupItemEditor(){
 const tipoEl=$("item-tipo"), selectEl=$("item-select"), valorEl=$("item-valor"),
       qtdEl=$("item-qtd"), addEl=$("add-item");

 function preencherSelect(){
   const tipo=tipoEl.value;
   const source=(tipo==="material"?materiais:servicos).slice().sort((a,b)=>
     String(a.nome||"").localeCompare(String(b.nome||""),"pt-BR")
   );
   selectEl.innerHTML='<option value="">Selecione...</option>'+source.map(x=>{
     const codigo=x.codigo?`[${esc(x.codigo)}] `:"";
     const categoria=x.categoria?` — ${esc(x.categoria)}`:"";
     return `<option value="${x.id}">${codigo}${esc(x.nome||"")}${categoria}</option>`;
   }).join("");
   valorEl.value="";
 }

 tipoEl.onchange=()=>{
   preencherSelect();
   qtdEl.value=1;
 };

 selectEl.onchange=()=>{
   const tipo=tipoEl.value;
   const source=tipo==="material"?materiais:servicos;
   const x=source.find(y=>String(y.id)===String(selectEl.value));
   if(!x){valorEl.value="";return}
   valorEl.value=tipo==="material"
     ? Number(x.preco_venda||0).toFixed(2)
     : Number(x.valor||0).toFixed(2);
 };

 addEl.onclick=async()=>{
   const tipo=tipoEl.value;
   const id=selectEl.value;
   const qtd=Number(qtdEl.value);
   const valor=Number(valorEl.value);
   if(!id)return toast("Selecione um material ou serviço.");
   if(!Number.isFinite(qtd)||qtd<=0)return toast("Informe uma quantidade válida.");

   const source=tipo==="material"?materiais:servicos;
   const x=source.find(y=>String(y.id)===String(id));
   if(!x)return toast("Item não encontrado.");

   editorItens.push({
     tipo,
     referencia_id:x.id,
     descricao:x.nome,
     quantidade:qtd,
     valor_unitario:Number.isFinite(valor)?valor:0
   });

   if(tipo==="servico"){
     const {data,error}=await sb.from("servico_materiais")
       .select("*")
       .eq("servico_id",x.id);

     if(error){
       console.error("Erro ao carregar materiais vinculados:",error);
       toast("Serviço incluído, mas houve erro ao carregar os materiais vinculados.");
     }else{
       (data||[]).forEach(sm=>{
         const mat=materiais.find(mm=>String(mm.id)===String(sm.material_id));
         if(mat){
           editorItens.push({
             tipo:"material",
             referencia_id:mat.id,
             descricao:`${mat.nome} (material do serviço ${x.nome})`,
             quantidade:Number(sm.quantidade||0)*qtd,
             valor_unitario:Number(mat.preco_venda||0),
             origem_servico_id:x.id
           });
         }
       });
     }
   }

   selectEl.value="";
   qtdEl.value=1;
   valorEl.value="";
   renderEditorItens();
 };

 preencherSelect();
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
 const [{data:itens,error},{data:fotos,error:fotoError},historico]=await Promise.all([
   sb.from("ordem_servico_itens").select("*").eq("ordem_servico_id",id).order("ordem"),
   sb.from("os_fotos").select("*").eq("ordem_servico_id",id).order("created_at",{ascending:false}),
   loadOSTimeline(id)
 ]);
 if(error)return toast(error.message);if(fotoError)return toast(fotoError.message);
 const custoMateriais=(itens||[]).filter(i=>i.tipo==="material").reduce((s,i)=>{const m=materiais.find(x=>x.id===i.material_id);return s+Number(i.quantidade)*Number(m?.custo||0)},0);const lucro=Number(o.total)-custoMateriais;
 const timelineHTML=(historico||[]).map(h=>`<div class="timeline-item"><b>${esc(statusLabel(h.tipo))}</b><br>${esc(h.descricao)}<br><small>${new Date(h.created_at).toLocaleString("pt-BR")}</small></div>`).join("")||'<span class="muted">Sem histórico registrado.</span>';
 const photoCards=(fotos||[]).map(f=>{const {data:u}=sb.storage.from("os-fotos").getPublicUrl(f.storage_path);return `<div class="photo-card"><img src="${u.publicUrl}" alt="Foto da OS"><div>${esc(statusLabel(f.tipo))}<br><button class="action-btn" onclick="deleteOSPhoto('${f.id}','${f.storage_path}','${id}')">Excluir</button></div></div>`}).join("");
 openModal("Ordem de Serviço "+o.numero,`<div class="form-grid"><p><b>Cliente:</b> ${esc(o.clientes?.nome)}</p><p><b>Status:</b> ${statusLabel(o.status)}</p><p><b>Responsável:</b> ${esc(o.responsavel||"-")}</p><p><b>Total:</b> ${money(o.total)}</p><p class="span-2"><b>Local:</b> ${esc(o.local_servico||"-")}</p><p class="span-2"><b>Solicitação:</b> ${esc(o.descricao_problema||"-")}</p></div><div class="table-wrap"><table><thead><tr><th>Tipo</th><th>Descrição</th><th>Qtd.</th><th>Unitário</th><th>Total</th></tr></thead><tbody>${(itens||[]).map(i=>`<tr><td>${statusLabel(i.tipo)}</td><td>${esc(i.descricao)}</td><td>${i.quantidade}</td><td>${money(i.valor_unitario)}</td><td>${money(i.quantidade*i.valor_unitario)}</td></tr>`).join("")||`<tr><td colspan="5">Sem itens.</td></tr>`}</tbody></table></div>
 <div class="profit-box"><div><small>Valor da OS</small><br><b>${money(o.total)}</b></div><div><small>Custo de materiais</small><br><b>${money(custoMateriais)}</b></div><div><small>Margem bruta estimada</small><br><b>${money(lucro)}</b></div></div><h4 class="section-title">Histórico</h4><div class="timeline">${timelineHTML}</div><h4 class="section-title">Fotos</h4><div class="form-grid"><label>Tipo<select id="photo-type"><option value="antes">Antes</option><option value="durante">Durante</option><option value="depois">Depois</option></select></label><label>Adicionar foto<input id="photo-file" type="file" accept="image/*" capture="environment"></label></div><div class="photo-grid">${photoCards||'<span class="muted">Nenhuma foto.</span>'}</div>
 <h4 class="section-title">Recibos vinculados</h4><div>${recibos.filter(r=>r.ordem_servico_id===id).map(r=>`<button class="action-btn" onclick="viewRecibo(\'${r.id}\')">${esc(r.numero)}</button>`).join(" ")||'<span class="muted">Nenhum recibo vinculado.</span>'}</div><h4 class="section-title">Assinatura</h4><p>${o.assinatura_nome?`Assinado por <b>${esc(o.assinatura_nome)}</b> em ${new Date(o.assinatura_em).toLocaleString("pt-BR")}`:"Ainda não assinada."}</p>
 ${o.status!=="concluida"&&o.status!=="cancelada"?`<div class="warning">Ao concluir, os materiais desta OS serão baixados automaticamente do estoque.</div>`:""}
 <div class="modal-actions"><button class="btn secondary" onclick="closeModal()">Fechar</button><button class="btn secondary" onclick="printOS('${o.id}')">PDF / Imprimir</button><button class="btn secondary" onclick="openSignature('${o.id}')">Assinatura</button>${o.status!=="concluida"&&o.status!=="cancelada"?`<button class="btn success" onclick="concluirOS('${o.id}')">Concluir OS</button>`:""}</div>`);
 $("photo-file").onchange=e=>uploadOSPhoto(id,e.target.files[0],$("photo-type").value);
}
async function concluirOS(id){
 if(!confirm("Concluir esta OS e baixar os materiais do estoque?"))return;
 const {data,error}=await sb.rpc("concluir_ordem_servico",{p_ordem_id:id});if(error)return toast("Não foi possível concluir: "+error.message);
 await addOSTimeline(id,"conclusao","Ordem de Serviço concluída.");closeModal();await Promise.all([loadMateriais(),loadOrdens(),loadFinanceiro()]);renderOS();renderDashboard();toast(data||"OS concluída.");
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
$("novo-orcamento").onclick=orcamentoForm;$("nova-os").onclick=osForm;$("novo-recibo").onclick=reciboForm;$("novo-cargo").onclick=()=>cargoForm();$("nova-empresa-saas").onclick=()=>empresaSaasForm();
$("refresh-alerts").onclick=renderAlerts;$("rel-aplicar").onclick=renderRelatorios;$("rel-export-fin").onclick=exportFinanceiro;$("rel-export-os").onclick=exportOS;$("rel-export-mat").onclick=exportMateriais;$("novo-agendamento").onclick=agendaForm;$("novo-lancamento").onclick=financeiroForm;$("novo-tecnico").onclick=()=>tecnicoForm();$("novo-fornecedor").onclick=()=>fornecedorForm();$("nova-compra").onclick=compraForm;$("novo-usuario").onclick=()=>usuarioForm();
$("importar-csv").onclick=()=>$("csv-file").click();$("csv-file").onchange=e=>{if(e.target.files[0])importCSV(e.target.files[0]);e.target.value=""};
$("cliente-search").oninput=renderClientes;$("material-search").oninput=renderMateriais;$("servico-search").oninput=renderServicos;$("estoque-search").oninput=renderEstoque;$("orcamento-search").oninput=renderOrcamentos;$("os-search").oninput=renderOS;
$("recibo-search").oninput=renderRecibos;$("cargo-search").oninput=renderCargos;$("agenda-search").oninput=renderAgenda;$("financeiro-search").oninput=renderFinanceiro;$("tecnico-search").oninput=renderTecnicos;$("fornecedor-search").oninput=renderFornecedores;$("compra-search").oninput=renderCompras;$("usuario-search").oninput=renderUsuarios;$("os-status-filter").onchange=renderOS;$("empresa-form").onsubmit=saveEmpresa;
$("menu-btn").onclick=()=>$("sidebar").classList.toggle("open");document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>navigate(b.dataset.page));
init();


/* V14 — pesquisa genérica em menus suspensos */
function enhanceSearchableSelect(select){
 if(!select || select.dataset.searchableReady==="1" || select.multiple || select.size>1) return;
 if(select.id==="item-tipo" || select.id==="f-ativa") return;

 select.dataset.searchableReady="1";
 const wrap=document.createElement("div");
 wrap.className="searchable-select";
 select.parentNode.insertBefore(wrap,select);
 wrap.appendChild(select);

 const button=document.createElement("button");
 button.type="button";
 button.className="searchable-select-button";
 const dropdown=document.createElement("div");
 dropdown.className="searchable-select-dropdown hidden";
 const input=document.createElement("input");
 input.type="search";
 input.className="searchable-select-search";
 input.placeholder="Pesquisar...";
 input.autocomplete="off";
 const options=document.createElement("div");
 options.className="searchable-select-options";

 wrap.insertBefore(button,select);
 dropdown.appendChild(input);
 dropdown.appendChild(options);
 wrap.appendChild(dropdown);
 select.classList.add("native-select-hidden");

 const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

 function selectedText(){
   const op=select.options[select.selectedIndex];
   return op ? op.textContent : "Selecione...";
 }
 function syncButton(){button.textContent=selectedText()||"Selecione..."}
 function render(){
   const q=norm(input.value);
   const list=[...select.options].filter(op=>!op.disabled && (!q || smartSearch(op.textContent,q)));
   options.innerHTML=list.length?list.map(op=>`<button type="button" class="searchable-option ${op.selected?"selected":""}" data-value="${encodeURIComponent(op.value)}">${esc(op.textContent)}</button>`).join("")
     :'<div class="searchable-empty">Nenhuma opção encontrada.</div>';
   options.querySelectorAll(".searchable-option").forEach(el=>el.onclick=()=>{
     select.value=decodeURIComponent(el.dataset.value);
     select.dispatchEvent(new Event("change",{bubbles:true}));
     syncButton();
     dropdown.classList.add("hidden");
   });
 }
 button.onclick=()=>{
   document.querySelectorAll(".searchable-select-dropdown").forEach(d=>{if(d!==dropdown)d.classList.add("hidden")});
   dropdown.classList.toggle("hidden");
   if(!dropdown.classList.contains("hidden")){
     input.value="";render();setTimeout(()=>input.focus(),0);
   }
 };
 input.oninput=render;
 select.addEventListener("change",syncButton);

 // Permite que código existente repovoe o select e o botão acompanhe.
 new MutationObserver(()=>{syncButton();if(!dropdown.classList.contains("hidden"))render()})
   .observe(select,{childList:true,subtree:true,attributes:true});

 syncButton();
}

function enhanceAllSelects(root=document){
 root.querySelectorAll("select").forEach(enhanceSearchableSelect);
}

const searchableSelectObserver=new MutationObserver(mutations=>{
 mutations.forEach(m=>m.addedNodes.forEach(node=>{
   if(node.nodeType!==1)return;
   if(node.matches?.("select"))enhanceSearchableSelect(node);
   enhanceAllSelects(node);
 }));
});
document.addEventListener("DOMContentLoaded",()=>{
 enhanceAllSelects();
 searchableSelectObserver.observe(document.body,{childList:true,subtree:true});
});

/* V15 — Catálogo Base */
async function loadCatalogoBase(){
 const data=await fetchAllRows("catalogo_materiais_base","*","codigo",true,1000), error=null;
 if(error)return toast("Erro ao carregar catálogo: "+error.message);
 catalogoBase=data||[];renderCatalogoBase();
}
function renderCatalogoBase(){
 const t=$("catalogo-table");if(!t)return;
 const n=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const q=n($("catalogo-busca")?.value);
 const rows=catalogoBase.filter(x=>smartSearch(x,q));
 t.innerHTML=rows.map(x=>`<tr><td><b>${esc(x.codigo)}</b></td><td>${esc(x.descricao)}</td><td>${esc(x.categoria||"")}</td><td>${esc(x.unidade||"")}</td><td>${esc(x.fabricante||"")}</td><td><div class="action-group"><button class="action-btn" onclick="catalogoForm(catalogoBase.find(y=>y.id==='${x.id}'))">Editar</button><button class="action-btn danger" onclick="deleteCatalogoItem('${x.id}')">Excluir</button></div></td></tr>`).join("")||'<tr><td colspan="6">Nenhum material encontrado.</td></tr>';
}
function catalogoForm(x={}){
 openModal(x.id?"Editar material base":"Novo material base",`<form id="catalogo-form"><div class="form-grid">
 <label>Código*<input id="cb-codigo" required value="${esc(x.codigo||"")}"></label><label>Descrição*<input id="cb-descricao" required value="${esc(x.descricao||"")}"></label>
 <label>Categoria<input id="cb-categoria" value="${esc(x.categoria||"")}"></label><label>Subcategoria<input id="cb-subcategoria" value="${esc(x.subcategoria||"")}"></label>
 <label>Unidade<input id="cb-unidade" value="${esc(x.unidade||"unidade")}"></label><label>Fabricante<input id="cb-fabricante" value="${esc(x.fabricante||"")}"></label>
 <label>Modelo<input id="cb-modelo" value="${esc(x.modelo||"")}"></label><label class="span-2">Especificação<textarea id="cb-especificacao">${esc(x.especificacao||"")}</textarea></label>
 <label class="span-2">Observações<textarea id="cb-observacoes">${esc(x.observacoes||"")}</textarea></label></div>
 <div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("catalogo-form").onsubmit=async e=>{e.preventDefault();const v={codigo:$("cb-codigo").value.trim(),descricao:$("cb-descricao").value.trim(),categoria:$("cb-categoria").value.trim()||null,subcategoria:$("cb-subcategoria").value.trim()||null,unidade:$("cb-unidade").value.trim()||"unidade",fabricante:$("cb-fabricante").value.trim()||null,modelo:$("cb-modelo").value.trim()||null,especificacao:$("cb-especificacao").value.trim()||null,observacoes:$("cb-observacoes").value.trim()||null};const r=x.id?await sb.from("catalogo_materiais_base").update(v).eq("id",x.id):await sb.from("catalogo_materiais_base").insert(v);if(r.error)return toast(r.error.message);closeModal();await loadCatalogoBase();};
}
async function deleteCatalogoItem(id){
 if(!confirm("Excluir este item do Catálogo Base? Isso não apaga cópias já importadas pelas empresas."))return;
 const {error}=await sb.from("catalogo_materiais_base").delete().eq("id",id);if(error)return toast(error.message);await loadCatalogoBase();
}
async function abrirCatalogoEmpresa(){
 const {data,error}=await sb.rpc("listar_catalogo_disponivel_v15");if(error)return toast(error.message);const lista=data||[];
 openModal("Adicionar do Catálogo Core-Orça",`<div><input id="cat-busca" placeholder="Pesquisar no catálogo..."><div class="catalog-actions"><button type="button" id="cat-marcar" class="btn secondary">Selecionar visíveis</button><button type="button" id="cat-todos" class="btn secondary">Importar catálogo completo</button></div><div id="cat-list" class="catalog-check-list"></div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button type="button" id="cat-importar" class="btn primary">Adicionar selecionados</button></div></div>`);
 const n=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();let vis=[];
 function draw(){const q=n($("cat-busca").value);vis=lista.filter(x=>smartSearch(x,q));$("cat-list").innerHTML=vis.map(x=>`<label class="catalog-check"><input type="checkbox" value="${x.id}" ${x.ja_importado?"disabled":""}><span><b>${esc(x.codigo)}</b> — ${esc(x.descricao)}<small>${esc(x.categoria||"")}${x.ja_importado?" • Já adicionado":""}</small></span></label>`).join("");}
 $("cat-busca").oninput=draw;$("cat-marcar").onclick=()=>document.querySelectorAll("#cat-list input:not(:disabled)").forEach(c=>c.checked=true);
 $("cat-importar").onclick=async()=>{const ids=[...document.querySelectorAll("#cat-list input:checked")].map(c=>c.value);if(!ids.length)return toast("Selecione ao menos um material.");const r=await sb.rpc("importar_catalogo_v15",{p_catalogo_ids:ids});if(r.error)return toast(r.error.message);closeModal();await refreshAll();toast(`${r.data||0} material(is) adicionado(s).`);};
 $("cat-todos").onclick=async()=>{
   if(!confirm("Importar todos os materiais faltantes do Catálogo Core-Orça para esta empresa?"))return;
   const r=await sb.rpc("importar_catalogo_completo_v152");
   if(r.error)return toast("Erro na importação: "+r.error.message);
   const info=Array.isArray(r.data)?r.data[0]:r.data;
   closeModal();
   await refreshAll();
   const adicionados=Number(info?.adicionados||0);
   const presentes=Number(info?.presentes||0);
   const total=Number(info?.total_catalogo||0);
   toast(`${adicionados} material(is) importado(s). Catálogo: ${presentes}/${total}.`);
 };draw();
}
document.addEventListener("click",e=>{if(e.target.closest?.('[data-page="catalogo-base"]'))setTimeout(loadCatalogoBase,0);});
document.addEventListener("DOMContentLoaded",()=>{
 $("catalogo-busca")?.addEventListener("input",renderCatalogoBase);$("catalogo-atualizar")?.addEventListener("click",loadCatalogoBase);$("catalogo-novo")?.addEventListener("click",()=>catalogoForm({}));
 setTimeout(()=>{const h=document.querySelector("#page-materiais .page-header, #page-materiais .panel-head");if(h&&!$("abrir-catalogo-empresa")){const b=document.createElement("button");b.id="abrir-catalogo-empresa";b.className="btn secondary";b.textContent="Catálogo Core-Orça";b.onclick=abrirCatalogoEmpresa;h.appendChild(b);}},600);
});


/* V15.1 — botão fixo do Catálogo Core-Orça na página Materiais */
document.addEventListener("DOMContentLoaded",()=>{
 const catalogButton=$("abrir-catalogo-empresa");
 if(catalogButton){
   catalogButton.onclick=abrirCatalogoEmpresa;
   // O botão segue a permissão de escrita do módulo Materiais.
   const applyCatalogPermission=()=>{
     const ctx=(typeof currentProfile!=="undefined" ? currentProfile : null);
     if(!ctx){ catalogButton.classList.remove("hidden"); return; }
     const manager=ctx.tipo==="gerente";
     const allowed=manager || (typeof can==="function" && can("materiais","write"));
     catalogButton.classList.toggle("hidden",!allowed);
   };
   setTimeout(applyCatalogPermission,250);
 }
});


/* V15.4 — máscaras brasileiras */
function onlyDigits(v){return String(v??"").replace(/\D/g,"")}
function maskCPF(v){let d=onlyDigits(v).slice(0,11);return d.replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})$/,"$1-$2")}
function maskCNPJ(v){let d=onlyDigits(v).slice(0,14);return d.replace(/^(\d{2})(\d)/,"$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/,"$1.$2.$3").replace(/\.(\d{3})(\d)/,".$1/$2").replace(/(\d{4})(\d)/,"$1-$2")}
function maskDocument(v){const d=onlyDigits(v);return d.length>11?maskCNPJ(d):maskCPF(d)}
function maskCEP(v){let d=onlyDigits(v).slice(0,8);return d.replace(/(\d{5})(\d)/,"$1-$2")}
function maskPhone(v){
 let d=onlyDigits(v).slice(0,11);
 if(d.length<=10)return d.replace(/^(\d{2})(\d)/,"($1) $2").replace(/(\d{4})(\d)/,"$1-$2");
 return d.replace(/^(\d{2})(\d)/,"($1) $2").replace(/(\d{5})(\d)/,"$1-$2");
}
function applyInputMask(el,type){
 if(!el)return;
 const fn={cpf:maskCPF,cnpj:maskCNPJ,document:maskDocument,cep:maskCEP,phone:maskPhone,cell:maskPhone}[type];
 if(!fn)return;
 const run=()=>{el.value=fn(el.value)};
 el.addEventListener("input",run);el.addEventListener("blur",run);run();
}
function applyDeclaredMasks(root=document){
 root.querySelectorAll("[data-mask]").forEach(el=>{
   if(el.dataset.maskReady==="1")return;
   el.dataset.maskReady="1";applyInputMask(el,el.dataset.mask);
 });
}
const maskObserver=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)applyDeclaredMasks(n)})));
document.addEventListener("DOMContentLoaded",()=>{applyDeclaredMasks();maskObserver.observe(document.body,{childList:true,subtree:true})});
