import sys, pathlib, re, subprocess, resource
from lxml import etree as E
resource.setrlimit(resource.RLIMIT_CORE,(0,0))
p=pathlib.Path(sys.argv[1]); schema=pathlib.Path(sys.argv[2]).resolve()
ns='http://www.sped.fazenda.gov.br/nfse'; ds='http://www.w3.org/2000/09/xmldsig#'
parser=E.XMLParser(resolve_entities=False,no_network=True,load_dtd=False,remove_blank_text=False)
def q(n): return '{'+ns+'}'+n
def d(n): return '{'+ds+'}'+n
try:
 root=E.parse(str(p/'dps.xml'),parser)
 assert not root.docinfo.doctype and root.getroot().tag==q('DPS') and root.getroot().get('versao')=='1.01'
 r=root.getroot(); info=r.find(q('infDPS')); assert info is not None and len(r)==1
 ident=info.get('Id',''); assert re.fullmatch(r'DPS[0-9]{42}',ident) and info.findtext(q('tpAmb'))=='2' and not info.findall('.//'+q('subst'))
 s=E.SubElement(r,d('Signature'),nsmap={'ds':ds}); si=E.SubElement(s,d('SignedInfo'))
 E.SubElement(si,d('CanonicalizationMethod'),Algorithm='http://www.w3.org/TR/2001/REC-xml-c14n-20010315'); E.SubElement(si,d('SignatureMethod'),Algorithm='http://www.w3.org/2001/04/xmldsig-more#rsa-sha256')
 ref=E.SubElement(si,d('Reference'),URI='#'+ident); ts=E.SubElement(ref,d('Transforms'))
 for alg in ['http://www.w3.org/2000/09/xmldsig#enveloped-signature','http://www.w3.org/TR/2001/REC-xml-c14n-20010315']: E.SubElement(ts,d('Transform'),Algorithm=alg)
 E.SubElement(ref,d('DigestMethod'),Algorithm='http://www.w3.org/2001/04/xmlenc#sha256'); E.SubElement(ref,d('DigestValue')); E.SubElement(s,d('SignatureValue')); E.SubElement(E.SubElement(E.SubElement(s,d('KeyInfo')),d('X509Data')),d('X509Certificate'))
 root.write(str(p/'template.xml'),encoding='UTF-8',xml_declaration=True)
 def run(args): subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=20)
 run(['xmlsec1','--sign','--id-attr:Id','infDPS','--privkey-pem',str(p/'key.pem')+','+str(p/'cert.pem'),'--output',str(p/'signed.xml'),str(p/'template.xml')])
 print('ASSINATURA: OK',flush=True)
 run(['xmlsec1','--verify','--id-attr:Id','infDPS','--pubkey-cert-pem',str(p/'cert.pem'),'--insecure',str(p/'signed.xml')]) # local signature check only, not trust validation; mTLS retains server verification
 print('VERIFICACAO_ASSINATURA: OK',flush=True)
 E.XMLSchema(E.parse(str(schema),parser)).assertValid(E.parse(str(p/'signed.xml'),parser)); print('XSD: OK',flush=True)
 (p/'id.txt').write_text(ident)
except Exception:
 print('XML_ASSINATURA_OU_XSD: FALHA',flush=True); sys.exit(1)
