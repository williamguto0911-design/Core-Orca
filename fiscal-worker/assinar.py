import sys, pathlib, re, subprocess, resource
from lxml import etree as E
resource.setrlimit(resource.RLIMIT_CORE,(0,0))
p=pathlib.Path(sys.argv[1]); schema=pathlib.Path(sys.argv[2]).resolve()
ns='http://www.sped.fazenda.gov.br/nfse'; ds='http://www.w3.org/2000/09/xmldsig#'
parser=E.XMLParser(resolve_entities=False,no_network=True,load_dtd=False,remove_blank_text=False)
def q(n): return '{'+ns+'}'+n
def d(n): return '{'+ds+'}'+n
stage='XML_LEITURA'
try:
 root=E.parse(str(p/'dps.xml'),parser)
 print('XML_LEITURA: OK',flush=True)
 stage='XML_ESTRUTURA'
 assert not root.docinfo.doctype and root.getroot().tag==q('DPS') and root.getroot().get('versao')=='1.01'
 r=root.getroot(); info=r.find(q('infDPS')); assert info is not None and len(r)==1
 print('XML_ESTRUTURA: OK',flush=True)
 stage='XML_ID_AMBIENTE'
 ident=info.get('Id',''); assert re.fullmatch(r'DPS[0-9]{42}',ident) and info.findtext(q('tpAmb'))=='2' and not info.findall('.//'+q('subst'))
 print('XML_ID_AMBIENTE: OK',flush=True)
 stage='XSD_CARREGAMENTO'
 xsd=E.XMLSchema(E.parse(str(schema),parser))
 print('XSD_CARREGAMENTO: OK',flush=True)
 stage='XML_TEMPLATE'
 s=E.SubElement(r,d('Signature'),nsmap={'ds':ds}); si=E.SubElement(s,d('SignedInfo'))
 E.SubElement(si,d('CanonicalizationMethod'),Algorithm='http://www.w3.org/TR/2001/REC-xml-c14n-20010315'); E.SubElement(si,d('SignatureMethod'),Algorithm='http://www.w3.org/2001/04/xmldsig-more#rsa-sha256')
 ref=E.SubElement(si,d('Reference'),URI='#'+ident); ts=E.SubElement(ref,d('Transforms'))
 for alg in ['http://www.w3.org/2000/09/xmldsig#enveloped-signature','http://www.w3.org/TR/2001/REC-xml-c14n-20010315']: E.SubElement(ts,d('Transform'),Algorithm=alg)
 E.SubElement(ref,d('DigestMethod'),Algorithm='http://www.w3.org/2001/04/xmlenc#sha256'); E.SubElement(ref,d('DigestValue')); E.SubElement(s,d('SignatureValue')); E.SubElement(E.SubElement(E.SubElement(s,d('KeyInfo')),d('X509Data')),d('X509Certificate'))
 root.write(str(p/'template.xml'),encoding='UTF-8',xml_declaration=True)
 print('XML_TEMPLATE: OK',flush=True)
 def run(args):
  result=subprocess.run(args,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=20)
  if result.returncode:
   err=result.stderr.lower()
   for needle,code in [(b'failed to find node','NODE'),(b'xpointer','REFERENCE'),(b'key is not found','KEY'),(b'failed to load','LOAD'),(b'digest','DIGEST'),(b'certificate','CERT'),(b'unknown','OPTION')]:
    if needle in err:
     print('XMLSEC_CATEGORIA: '+code,flush=True); break
   raise RuntimeError('XMLSEC')
 stage='ASSINATURA'
 run(['xmlsec1','--sign','--id-attr:Id',ns+':infDPS','--privkey-pem',str(p/'key.pem')+','+str(p/'cert.pem'),'--output',str(p/'signed.xml'),str(p/'template.xml')])
 print('ASSINATURA: OK',flush=True)
 stage='VERIFICACAO_ASSINATURA'
 run(['xmlsec1','--verify','--id-attr:Id',ns+':infDPS','--pubkey-cert-pem',str(p/'cert.pem'),'--insecure',str(p/'signed.xml')]) # local signature check only, not trust validation; mTLS retains server verification
 print('VERIFICACAO_ASSINATURA: OK',flush=True)
 stage='XSD_VALIDACAO'
 signed=E.parse(str(p/'signed.xml'),parser)
 if not xsd.validate(signed):
  for e in list(xsd.error_log)[:10]:
   print('XSD_ERRO: '+str(e.type)+' LINHA: '+str(e.line),flush=True)
  raise ValueError('XSD')
 print('XSD: OK',flush=True)
 (p/'id.txt').write_text(ident)
except Exception:
 print(stage+': FALHA',flush=True); sys.exit(1)
