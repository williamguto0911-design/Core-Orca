import {createSecureContext} from 'node:tls';
import https from 'node:https';
const targets = [
 ['restrita','https://sefin.producaorestrita.nfse.gov.br/API/SefinNacional/docs/index'],
 ['producao','https://sefin.nfse.gov.br/SefinNacional/docs/index']
];
function probe(url, credentials={}) {
 return new Promise(resolve=>{
  let req;
  const finish=(v)=>{clearTimeout(timer);resolve(v)};
  const timer=setTimeout(()=>{req?.destroy();finish('TIMEOUT')},15000);
  try {
   req=https.get(url,{...credentials,agent:false,minVersion:'TLSv1.2',maxVersion:'TLSv1.2',rejectUnauthorized:true,ALPNProtocols:['http/1.1']},res=>{res.resume();finish(`HTTP ${res.statusCode}`)});
   req.on('error',e=>finish(/^[A-Z0-9_]+$/.test(e.code||'')?e.code:'ERRO_TLS_HTTP'));
  } catch {finish('ERRO_CLIENTE')}
 });
}
async function main(){
 const {SUPABASE_URL:url,CORE_ORCA_WORKER_TOKEN:token}=process.env;
 if(!url||!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)||! /^[a-f0-9]{64}$/i.test(token||''))throw Error('CONFIG');
 const endpoint=new URL('/functions/v1/core-orca-fiscal-worker',url);
 const r=await fetch(endpoint,{method:'POST',headers:{'x-fiscal-token':token},redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('SUPABASE_HTTP_'+r.status);
 let pfx;
 try {
  const parsed=await r.json();pfx=Buffer.from(parsed.pfx,'base64');const credentials={pfx,passphrase:parsed.senha};
  createSecureContext(credentials);console.log('CERT_RECEIVED / PKCS12: OK');
  let ok=true;
  for(const [name,target] of targets){const baseline=await probe(target);const authenticated=await probe(target,credentials);console.log(`${name}: sem certificado ${baseline}; com certificado ${authenticated}`);if(baseline!=='HTTP 403'||authenticated!=='HTTP 200')ok=false;}
  console.log(ok?'Acesso autenticado à documentação confirmado por comparação.':'Diagnóstico inconclusivo ou falha.');if(!ok)process.exitCode=1;
 } finally {pfx?.fill(0);}
}
main().catch(e=>{const m=String(e.message);console.error(/^(CONFIG|CERT_STATUS|CERT_FORMAT|SUPABASE_HTTP_\d+)$/.test(m)?m:'Falha na preparação ou leitura do certificado; detalhes omitidos.');process.exitCode=1;});
