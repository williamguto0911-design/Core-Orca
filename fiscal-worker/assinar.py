import sys, pathlib, re, subprocess, resource, shutil, hashlib, base64, hmac
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
 def canon(node):
  return E.tostring(node,method='c14n',exclusive=False,with_comments=False)
 def openssl(args, payload=None):
  result=subprocess.run(['openssl',*args],input=payload,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=20)
  if result.returncode:
   print('OPENSSL_EXIT: '+str(result.returncode),flush=True)
   raise RuntimeError('OPENSSL')
  return result.stdout
 stage='ASSINATURA'
 print('MOTOR_ASSINATURA: OPENSSL',flush=True)
 # infDPS does not contain Signature: enveloped transform is a no-op.
 ref.find(d('DigestValue')).text=base64.b64encode(hashlib.sha256(canon(info)).digest()).decode('ascii')
 cert=openssl(['x509','-in',str(p/'cert.pem'),'-outform','DER'])
 s.find('.//'+d('X509Certificate')).text=base64.b64encode(cert).decode('ascii')
 signature=openssl(['dgst','-sha256','-sign',str(p/'key.pem'),'-sigopt','rsa_padding_mode:pkcs1'],canon(si))
 s.find(d('SignatureValue')).text=base64.b64encode(signature).decode('ascii')
 root.write(str(p/'signed.xml'),encoding='UTF-8',xml_declaration=True)
 print('ASSINATURA: OK',flush=True)
 stage='VERIFICACAO_ASSINATURA'
 check=E.parse(str(p/'signed.xml'),parser).getroot()
 ci=check.find(q('infDPS')); cs=check.find(d('Signature')); csi=cs.find(d('SignedInfo'))
 expected=base64.b64decode(csi.find(d('Reference')).findtext(d('DigestValue')),validate=True)
 assert hmac.compare_digest(expected,hashlib.sha256(canon(ci)).digest())
 (p/'signature.bin').write_bytes(base64.b64decode(cs.findtext(d('SignatureValue')),validate=True))
 (p/'public.pem').write_bytes(openssl(['x509','-in',str(p/'cert.pem'),'-pubkey','-noout']))
 openssl(['dgst','-sha256','-verify',str(p/'public.pem'),'-signature',str(p/'signature.bin'),'-sigopt','rsa_padding_mode:pkcs1'],canon(csi))
 print('VERIFICACAO_ASSINATURA: OK',flush=True)
 stage='XSD_VALIDACAO'
 signed=E.parse(str(p/'signed.xml'),parser)
 if not xsd.validate(signed):
  for e in list(xsd.error_log)[:10]:
   print('XSD_ERRO: '+str(e.type)+' LINHA: '+str(e.line),flush=True)
  raise ValueError('XSD')
 print('XSD: OK',flush=True)
 (p/'id.txt').write_text(ident)
except Exception as exc:
 print('PYTHON_TIPO: '+type(exc).__name__,flush=True)
 print(stage+': FALHA',flush=True); sys.exit(1)
