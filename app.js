const SUPABASE_URL = "https://vihhktumvtfdcnthekic.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpaGhrdHVtdnRmZGNudGhla2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY5NTksImV4cCI6MjEwNTE0Mjk1OX0.F6dsoPwigniSvr6CwA8S91tr7KAH-utME0uAwr4etpo";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let clientes=[], materiais=[], currentPage="dashboard";

const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const money=n=>(Number(n)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const toast=(msg)=>{const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)};

async function init(){
  const {data:{session}}=await sb.auth.getSession();
  if(session) showApp(session);
  sb.auth.onAuthStateChange((event,session)=>session?showApp(session):showLogin());
}
function showLogin(){$("login-screen").classList.remove("hidden");$("app").classList.add("hidden")}
async function showApp(session){
  $("login-screen").classList.add("hidden");$("app").classList.remove("hidden");
  $("user-email").textContent=session.user.email||"";
  await refreshAll();
}
async function refreshAll(){await Promise.all([loadClientes(),loadMateriais()]);renderDashboard();if(currentPage==="clientes")renderClientes();if(currentPage==="materiais")renderMateriais();if(currentPage==="estoque")renderEstoque()}
async function loadClientes(){
  const {data,error}=await sb.from("clientes").select("*").eq("ativo",true).order("nome");
  if(error)return toast("Erro ao carregar clientes: "+error.message);
  clientes=data||[];
}
async function loadMateriais(){
  const {data,error}=await sb.from("materiais").select("*").eq("ativo",true).order("nome");
  if(error)return toast("Erro ao carregar materiais: "+error.message);
  materiais=data||[];
}
function renderDashboard(){
  $("stat-clientes").textContent=clientes.length;
  $("stat-materiais").textContent=materiais.length;
  const baixos=materiais.filter(m=>Number(m.estoque_atual)<=Number(m.estoque_minimo)).length;
  $("stat-baixo").textContent=baixos;
  $("stat-valor").textContent=money(materiais.reduce((s,m)=>s+Number(m.estoque_atual)*Number(m.custo),0));
}
function navigate(page){
  currentPage=page;
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  $("page-"+page).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  $("page-title").textContent={dashboard:"Dashboard",clientes:"Clientes",materiais:"Materiais",estoque:"Estoque"}[page];
  if(page==="clientes")renderClientes();
  if(page==="materiais")renderMateriais();
  if(page==="estoque")renderEstoque();
}
function renderClientes(){
  const q=$("cliente-search").value.toLowerCase();
  const rows=clientes.filter(c=>[c.nome,c.documento,c.telefone,c.celular,c.email].some(v=>String(v||"").toLowerCase().includes(q)));
  $("clientes-table").innerHTML=rows.map(c=>`<tr><td><b>${esc(c.nome)}</b><br><span class="muted">${esc(c.email||"")}</span></td><td>${esc(c.tipo_pessoa)}</td><td>${esc(c.documento||"-")}</td><td>${esc(c.celular||c.telefone||"-")}</td><td>${esc([c.cidade,c.estado].filter(Boolean).join("/ ")||"-")}</td><td><div class="actions"><button class="action-btn" onclick="editCliente('${c.id}')">Editar</button><button class="action-btn" onclick="deleteCliente('${c.id}')">Excluir</button></div></td></tr>`).join("")||`<tr><td colspan="6">Nenhum cliente encontrado.</td></tr>`;
}
function renderMateriais(){
  const q=$("material-search").value.toLowerCase();
  const rows=materiais.filter(m=>[m.codigo,m.nome,m.categoria,m.fabricante].some(v=>String(v||"").toLowerCase().includes(q)));
  $("materiais-table").innerHTML=rows.map(m=>`<tr><td>${esc(m.codigo||"-")}</td><td><b>${esc(m.nome)}</b><br><span class="muted">${esc(m.fabricante||"")}</span></td><td>${esc(m.categoria||"-")}</td><td>${esc(m.unidade)}</td><td class="${Number(m.estoque_atual)<=Number(m.estoque_minimo)?"low":"ok"}">${Number(m.estoque_atual).toLocaleString("pt-BR")}</td><td>${money(m.custo)}</td><td>${money(m.preco_venda)}</td><td><div class="actions"><button class="action-btn" onclick="editMaterial('${m.id}')">Editar</button><button class="action-btn" onclick="deleteMaterial('${m.id}')">Excluir</button></div></td></tr>`).join("")||`<tr><td colspan="8">Nenhum material encontrado.</td></tr>`;
}
function renderEstoque(){
  const q=$("estoque-search").value.toLowerCase();
  const rows=materiais.filter(m=>[m.codigo,m.nome,m.categoria].some(v=>String(v||"").toLowerCase().includes(q)));
  $("estoque-table").innerHTML=rows.map(m=>{const low=Number(m.estoque_atual)<=Number(m.estoque_minimo);return `<tr><td><b>${esc(m.nome)}</b><br><span class="muted">${esc(m.codigo||"")}</span></td><td>${Number(m.estoque_atual).toLocaleString("pt-BR")} ${esc(m.unidade)}</td><td>${Number(m.estoque_minimo).toLocaleString("pt-BR")}</td><td class="${low?"low":"ok"}">${low?"ESTOQUE BAIXO":"OK"}</td><td>${new Date(m.updated_at).toLocaleString("pt-BR")}</td></tr>`}).join("")||`<tr><td colspan="5">Nenhum material encontrado.</td></tr>`;
}
function openModal(title,body){$("modal-title").textContent=title;$("modal-body").innerHTML=body;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden")}

function clienteForm(c={}){
 openModal(c.id?"Editar cliente":"Novo cliente",`<form id="entity-form"><div class="form-grid">
 <label>Tipo<select id="f-tipo"><option ${c.tipo_pessoa==="PF"?"selected":""}>PF</option><option ${c.tipo_pessoa==="PJ"?"selected":""}>PJ</option></select></label>
 <label>Nome / Razão social*<input id="f-nome" required value="${esc(c.nome)}"></label>
 <label>CPF / CNPJ<input id="f-documento" value="${esc(c.documento)}"></label>
 <label>Telefone<input id="f-telefone" value="${esc(c.telefone)}"></label>
 <label>Celular<input id="f-celular" value="${esc(c.celular)}"></label>
 <label>E-mail<input id="f-email" type="email" value="${esc(c.email)}"></label>
 <label>E-mail cobrança<input id="f-cobranca" type="email" value="${esc(c.email_cobranca)}"></label>
 <label>CEP<input id="f-cep" value="${esc(c.cep)}"></label>
 <label>Endereço<input id="f-endereco" value="${esc(c.endereco)}"></label>
 <label>Número<input id="f-numero" value="${esc(c.numero)}"></label>
 <label>Complemento<input id="f-complemento" value="${esc(c.complemento)}"></label>
 <label>Bairro<input id="f-bairro" value="${esc(c.bairro)}"></label>
 <label>Cidade<input id="f-cidade" value="${esc(c.cidade)}"></label>
 <label>Estado<input id="f-estado" maxlength="2" value="${esc(c.estado)}"></label>
 <label class="span-2">Observações<textarea id="f-obs" rows="3">${esc(c.observacoes)}</textarea></label>
 </div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={tipo_pessoa:$("f-tipo").value,nome:$("f-nome").value.trim(),documento:$("f-documento").value.trim(),telefone:$("f-telefone").value.trim(),celular:$("f-celular").value.trim(),email:$("f-email").value.trim(),email_cobranca:$("f-cobranca").value.trim(),cep:$("f-cep").value.trim(),endereco:$("f-endereco").value.trim(),numero:$("f-numero").value.trim(),complemento:$("f-complemento").value.trim(),bairro:$("f-bairro").value.trim(),cidade:$("f-cidade").value.trim(),estado:$("f-estado").value.trim().toUpperCase(),observacoes:$("f-obs").value.trim()};const res=c.id?await sb.from("clientes").update(obj).eq("id",c.id):await sb.from("clientes").insert(obj);if(res.error)return toast("Erro: "+res.error.message);closeModal();toast("Cliente salvo");await loadClientes();renderClientes();renderDashboard()}
}
function editCliente(id){const c=clientes.find(x=>x.id===id);if(c)clienteForm(c)}
async function deleteCliente(id){if(!confirm("Excluir este cliente?"))return;const {error}=await sb.from("clientes").update({ativo:false}).eq("id",id);if(error)return toast("Erro: "+error.message);toast("Cliente excluído");await loadClientes();renderClientes();renderDashboard()}

function materialForm(m={}){
 openModal(m.id?"Editar material":"Novo material",`<form id="entity-form"><div class="form-grid">
 <label>Código<input id="f-codigo" value="${esc(m.codigo)}"></label>
 <label>Nome*<input id="f-nome" required value="${esc(m.nome)}"></label>
 <label>Descrição<input id="f-descricao" value="${esc(m.descricao)}"></label>
 <label>Categoria<input id="f-categoria" value="${esc(m.categoria)}"></label>
 <label>Fabricante<input id="f-fabricante" value="${esc(m.fabricante)}"></label>
 <label>Unidade<input id="f-unidade" value="${esc(m.unidade||"UN")}"></label>
 <label>Estoque atual<input id="f-estoque" type="number" step="0.001" value="${m.estoque_atual??0}"></label>
 <label>Estoque mínimo<input id="f-minimo" type="number" step="0.001" value="${m.estoque_minimo??0}"></label>
 <label>Custo<input id="f-custo" type="number" step="0.01" value="${m.custo??0}"></label>
 <label>Preço de venda<input id="f-preco" type="number" step="0.01" value="${m.preco_venda??0}"></label>
 </div><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const obj={codigo:$("f-codigo").value.trim()||null,nome:$("f-nome").value.trim(),descricao:$("f-descricao").value.trim(),categoria:$("f-categoria").value.trim(),fabricante:$("f-fabricante").value.trim(),unidade:$("f-unidade").value.trim()||"UN",estoque_atual:Number($("f-estoque").value)||0,estoque_minimo:Number($("f-minimo").value)||0,custo:Number($("f-custo").value)||0,preco_venda:Number($("f-preco").value)||0};const res=m.id?await sb.from("materiais").update(obj).eq("id",m.id):await sb.from("materiais").insert(obj);if(res.error)return toast("Erro: "+res.error.message);closeModal();toast("Material salvo");await loadMateriais();renderMateriais();renderDashboard()}
}
function editMaterial(id){const m=materiais.find(x=>x.id===id);if(m)materialForm(m)}
async function deleteMaterial(id){if(!confirm("Excluir este material?"))return;const {error}=await sb.from("materiais").update({ativo:false}).eq("id",id);if(error)return toast("Erro: "+error.message);toast("Material excluído");await loadMateriais();renderMateriais();renderDashboard()}

function movementForm(){
 openModal("Movimentar estoque",`<form id="entity-form"><label>Material<select id="f-material" required>${materiais.map(m=>`<option value="${m.id}">${esc(m.codigo?m.codigo+" - ":"")}${esc(m.nome)} — estoque: ${m.estoque_atual} ${esc(m.unidade)}</option>`).join("")}</select></label><label>Tipo<select id="f-tipo"><option>ENTRADA</option><option>SAIDA</option><option>AJUSTE</option></select></label><label>Quantidade*<input id="f-qtd" type="number" step="0.001" min="0.001" required></label><label>Motivo<input id="f-motivo"></label><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn primary">Registrar</button></div></form>`);
 $("entity-form").onsubmit=async e=>{e.preventDefault();const {error}=await sb.rpc("registrar_movimentacao_estoque",{p_material_id:$("f-material").value,p_tipo:$("f-tipo").value,p_quantidade:Number($("f-qtd").value),p_motivo:$("f-motivo").value.trim()});if(error)return toast("Erro: "+error.message);closeModal();toast("Movimentação registrada");await loadMateriais();renderEstoque();renderDashboard()}
}

async function importCSV(file){
 const text=await file.text();const lines=text.split(/\r?\n/).filter(x=>x.trim());if(lines.length<2)return toast("CSV vazio.");
 const delimiter=lines[0].includes(";")?";":",";
 const parse=line=>{const out=[];let cur="",quote=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quote&&line[i+1]==='"'){cur+='"';i++}else quote=!quote}else if(ch===delimiter&&!quote){out.push(cur.trim());cur=""}else cur+=ch}out.push(cur.trim());return out};
 const headers=parse(lines[0]).map(h=>h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"_"));
 const aliases={codigo:["codigo","cod","código"],nome:["nome","material","descricao_material","descrição"],descricao:["descricao","descrição"],categoria:["categoria"],fabricante:["fabricante","marca"],unidade:["unidade","un"],estoque_atual:["estoque_atual","estoque","quantidade"],estoque_minimo:["estoque_minimo","minimo","estoque_min"],custo:["custo","valor_custo"],preco_venda:["preco_venda","preco","preço","valor_venda"]};
 const idx=k=>{const list=aliases[k];return headers.findIndex(h=>list.includes(h))};
 const num=v=>Number(String(v||"0").replace(/\./g,"").replace(",",".").replace(/[^\d.-]/g,""))||0;
 const rows=[];
 for(let i=1;i<lines.length;i++){const a=parse(lines[i]);const obj={};Object.keys(aliases).forEach(k=>{const j=idx(k);if(j>=0)obj[k]=a[j]});if(!obj.nome)continue;obj.codigo=obj.codigo||null;obj.unidade=obj.unidade||"UN";["estoque_atual","estoque_minimo","custo","preco_venda"].forEach(k=>obj[k]=num(obj[k]));rows.push(obj)}
 if(!rows.length)return toast("Nenhum material válido encontrado.");
 let count=0;
 for(let i=0;i<rows.length;i+=500){const batch=rows.slice(i,i+500);const {error}=await sb.from("materiais").upsert(batch,{onConflict:"codigo",ignoreDuplicates:false});if(error){console.error(error);return toast("Erro na importação: "+error.message)}count+=batch.length}
 toast(`${count} materiais importados/atualizados`);await loadMateriais();renderMateriais();renderDashboard()
}

$("login-form").onsubmit=async e=>{e.preventDefault();$("login-error").textContent="";const {error}=await sb.auth.signInWithPassword({email:$("login-email").value.trim(),password:$("login-password").value});if(error)$("login-error").textContent="E-mail ou senha inválidos."};
$("logout-btn").onclick=async()=>{await sb.auth.signOut();showLogin()};
$("refresh-btn").onclick=refreshAll;
$("modal-close").onclick=closeModal;
$("modal").onclick=e=>{if(e.target===$("modal"))closeModal()};
$("novo-cliente").onclick=()=>clienteForm();
$("novo-material").onclick=()=>materialForm();
$("nova-movimentacao").onclick=movementForm;
$("importar-csv").onclick=()=>$("csv-file").click();
$("csv-file").onchange=e=>{if(e.target.files[0])importCSV(e.target.files[0]);e.target.value=""};
$("cliente-search").oninput=renderClientes;
$("material-search").oninput=renderMateriais;
$("estoque-search").oninput=renderEstoque;
$("menu-btn").onclick=()=>$("sidebar")?.classList.toggle("open");
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>navigate(b.dataset.page));
init();
