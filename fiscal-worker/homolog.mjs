import {request} from 'node:https';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createSecureContext} from 'node:tls';
import {createPrivateKey,X509Certificate} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const {SUPABASE_URL:url,CORE_ORCA_HOMOLOG_TOKEN:token}=process.env;
let stage='CONFIG', dir, pfx;
async function rpc(action, extra={}){const r=await fetch(new URL('/functions/v1/core-orca-fiscal-homolog',url),{method:'POST',headers:{'x-fiscal-token':token,'content-type':'application/json'},body:JSON.stringify({action,...extra}),redirect:'error',signal:AbortSignal.timeout(20000)});console.log('WORKER_'+action.toUpperCase()+'_HTTP_'+r.status);if(!r.ok)throw Error('RPC');return r.json()}
try{
 const enviar=process.env.FISCAL_ENVIAR==='SIM';console.log('V059.6 / HOMOLOGACAO / '+(enviar?'ENVIO AUTORIZADO':'SOMENTE VALIDACAO'));if(!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url||'')||!/^[a-f0-9]{64}$/i.test(token||''))throw Error('CONFIG');
 stage='PREPARE';const data=await rpc('prepare');if(typeof data.xml!=='string'||typeof data.senha!=='string'||typeof data.pfx!=='string')throw Error('FIELDS');pfx=Buffer.from(data.pfx,'base64');
 stage='PKCS12';let credentials,leaf;for(const legacy of [false,true]){const r=spawnSync('openssl',['pkcs12',...(legacy?['-legacy']:[]),'-nodes','-passin','env:PFX_PASSWORD'],{input:pfx,maxBuffer:4*1024*1024,timeout:10000,env:{PATH:process.env.PATH,PFX_PASSWORD:data.senha}});try{if(r.status!==0)continue;const pem=r.stdout.toString();const keys=pem.match(/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/g)||[];const certs=pem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g)||[];if(keys.length!==1)continue;leaf=certs.find(c=>new X509Certificate(c).checkPrivateKey(createPrivateKey(keys[0])));if(!leaf)continue;credentials={key:keys[0],cert:[leaf,...certs.filter(c=>c!==leaf)].join('\n')};createSecureContext(credentials);console.log(legacy?'OPENSSL_LEGACY: OK':'OPENSSL_PADRAO: OK');break}catch{credentials=null}finally{r.stdout?.fill(0);r.stderr?.fill(0)}}if(!credentials)throw Error('CERT');
 stage='ASSINATURA';dir=mkdtempSync(join(tmpdir(),'core-orca-'));for(const [name,value] of [['dps.xml',data.xml],['key.pem',credentials.key],['cert.pem',leaf]])writeFileSync(join(dir,name),value,{mode:0o600});const sign=spawnSync('/usr/bin/python3',['fiscal-worker/assinar.py',dir,'fiscal-worker/xsd/DPS_v1.01.xsd'],{encoding:'utf8',timeout:60000,env:{PATH:process.env.PATH}});for(const line of (sign.stdout||'').split('\n')){if(/^AJUSTE_(?:SERIE|FINNFSE|INDDEST|ID): OK$/.test(line))console.log(line);if(/^XSD_(?:CAMINHO|ESPERADOS): [A-Za-z0-9_.,/-]{1,1800}$|^XSD_TIPO: [A-Z0-9_]{1,80}$/.test(line))console.log(line);if(/^(?:(?:XML_LEITURA|XML_ESTRUTURA|XML_ID_AMBIENTE|XML_ADEQUACAO|XSD_PRE_VALIDACAO|XML_TEMPLATE|XSD_CARREGAMENTO|ASSINATURA|VERIFICACAO_ASSINATURA|XSD_VALIDACAO|XSD): (?:OK|FALHA)|XMLSEC_CATEGORIA: (?:NODE|REFERENCE|KEY|LOAD|DIGEST|CERT|OPTION|EXECUTAVEL_AUSENTE|TIMEOUT|UNSUPPORTED|CRYPTO|PERMISSION|INTERNAL|GENERIC|UNCLASSIFIED)|MOTOR_ASSINATURA: OPENSSL|OPENSSL_EXIT: -?[0-9]+|XMLSEC_EXIT: -?[0-9]+|XMLSEC_DISPONIVEL: (?:SIM|NAO)|XMLSEC_FUNCAO: xmlSec[A-Za-z0-9_]{0,100}|XMLSEC_ERRO_NUM: [0-9]{1,5}|PYTHON_TIPO: [A-Za-z0-9_]{1,80}|XSD_ERRO: [0-9]+ LINHA: [0-9]+)$/.test(line))console.log(line);if(/^(?:XML_LEITURA|XML_ESTRUTURA|XML_ID_AMBIENTE|XML_ADEQUACAO|XSD_PRE_VALIDACAO|XML_TEMPLATE|XSD_CARREGAMENTO|ASSINATURA|VERIFICACAO_ASSINATURA|XSD_VALIDACAO): FALHA$/.test(line))stage=line.split(':')[0];}if(sign.error||sign.status!==0){if(sign.error)console.log('PYTHON_EXECUCAO: FALHA');throw Error('SIGN')}if(!enviar){console.log('VALIDACAO LOCAL CONCLUIDA; NENHUMA DPS TRANSMITIDA');}
 else {
  stage='CLAIM';
  const id=readFileSync(join(dir,'id.txt'),'utf8').trim();
  if(!/^DPS[0-9]{42}$/.test(id))throw Error('ID');
  const payload=JSON.stringify({dpsXmlGZipB64:gzipSync(readFileSync(join(dir,'signed.xml'))).toString('base64')});
  const claim=await rpc('claim',{id});if(claim.ok!==true)throw Error('CLAIM');
  let status='incerta', result={motivo:'SEM_RESPOSTA_CONFIRMADA'};
  try {
   stage='TRANSMISSAO';
   const response=await new Promise((resolve,reject)=>{
    const req=request('https://sefin.producaorestrita.nfse.gov.br/SefinNacional/nfse',{method:'POST',...credentials,rejectUnauthorized:true,minVersion:'TLSv1.2',headers:{'Content-Type':'application/json','Accept':'application/json','Content-Length':Buffer.byteLength(payload)}},res=>{
     const chunks=[];let size=0;res.on('data',c=>{size+=c.length;if(size>1500000){res.destroy(Error('LIMIT'));return;}chunks.push(c)});res.on('error',reject);res.on('aborted',()=>reject(Error('ABORT')));res.on('end',()=>resolve({http:res.statusCode,body:Buffer.concat(chunks).toString('utf8')}));
    });const deadline=setTimeout(()=>req.destroy(Error('TIMEOUT')),45000);req.on('close',()=>clearTimeout(deadline));req.on('error',reject);req.end(payload);
   });
   console.log('SEFIN_HTTP: '+response.http);
   let body;try{body=JSON.parse(response.body)}catch{body=null;}
   result={http:response.http,resposta:body};
   if(response.http>=200&&response.http<300&&body?.tipoAmbiente===2&&body.idDps===id&&/^\d{50}$/.test(body.chaveAcesso||'')&&typeof body.nfseXmlGZipB64==='string'){
    const xml=gunzipSync(Buffer.from(body.nfseXmlGZipB64,'base64'),{maxOutputLength:4000000});
    if(xml.length>0)status='autorizada';
   }else if([400,422].includes(response.http)&&body?.tipoAmbiente===2&&Array.isArray(body.erros)&&body.erros.length){status='rejeitada';}
   for(const e of (Array.isArray(body?.erros)?body.erros:[]).slice(0,20))if(/^[A-Z][0-9]{1,8}$/.test(e.codigo||''))console.log('SEFIN_CODIGO: '+e.codigo);
  }catch{console.log('SEFIN_RESPOSTA: INCERTA');}
  stage='REGISTRO_RESULTADO';const saved=await rpc('finish',{id,status,result});if(saved.ok!==true)throw Error('FINISH');
  console.log('SEFIN_STATUS: '+status.toUpperCase());if(status!=='autorizada')throw Error('NFSE');
 }
}catch{console.error('FALHA_ETAPA: '+stage);process.exitCode=1}finally{pfx?.fill(0);if(dir)rmSync(dir,{recursive:true,force:true})}
