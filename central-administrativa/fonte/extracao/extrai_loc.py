import openpyxl,json,unicodedata,re,hashlib,os,datetime,collections,sys
SP='loc/.sal'
if not os.path.exists(SP):open(SP,'wb').write(os.urandom(16))
SAL=open(SP,'rb').read()
def norm(s):s=unicodedata.normalize('NFKD',str(s or '')).encode('ascii','ignore').decode().upper();return re.sub(r'\s+',' ',re.sub(r'[^A-Z0-9 ]',' ',s)).strip()
def gid(nome):return hashlib.sha256(SAL+norm(nome).encode()).hexdigest()[:8]
def d8(v):return v.strftime('%Y-%m-%d') if isinstance(v,datetime.datetime) else None
def uc(v):
  if v is None:return ''
  if isinstance(v,float) and v.is_integer():v=int(v)
  return str(v).strip()
def num(v):
  try:return round(float(v),2)
  except:return None
BASE={'BACABAL':'BCB','PRESIDENTE DUTRA':'PDT','SANTA INES':'STI','BARRA DO CORDA':'BDC','ITAPECURU':'ITM','PEDREIRAS':'PDS'}
wb=openpyxl.load_workbook('loc_in2/loc.xlsx',data_only=True,read_only=True)
R=list(wb['LOCACAO DE IMOVEIS'].iter_rows(values_only=True));h=[str(x).strip() if x else '' for x in R[0]];ix={k:i for i,k in enumerate(h) if k}
g=lambda r,k:r[ix[k]] if k in ix and ix[k]<len(r) else None
imv=[];nomes={}
for n,r in enumerate(R[1:]):
  if not g(r,'LOCADOR'):continue
  ct=re.sub(r'\D','',str(g(r,'CONTRATO') or ''))
  doc=re.sub(r'\D','',str(g(r,'CPF/CNPJ') or ''))
  cons={}
  for m in range(1,13):
    a,e=num(g(r,'AGUA %02d/26'%m)),num(g(r,'ENERGIA %02d/26'%m))
    if a or e:cons['2026-%02d'%m]=[a or 0,e or 0]
  b=norm(g(r,'BASE'))
  it={'id':'L'+hashlib.sha256((norm(g(r,'IMÓVEL'))+'|'+norm(g(r,'LOCALIDADE'))+'|'+str(d8(g(r,'INICIO')))).encode()).hexdigest()[:7],'b':BASE.get(b,b),'loc':re.sub(r'\b(Do|Da|De|Dos|Das)\b',lambda m:m.group(0).lower(),str(g(r,'LOCALIDADE') or '').strip().title()),'im':re.sub(r'\s+',' ',str(g(r,'IMÓVEL') or '')).strip(),'ct':ct,
      'ini':d8(g(r,'INICIO')),'fim':d8(g(r,'TÉRMINO')),'v':num(g(r,'VALOR ALUGUEL')) or 0,'st':str(g(r,'SITUAÇÃO') or '').strip(),'pj':len(doc)==14,
      'iptu':str(g(r,'IPTU') or '').strip(),'ens':{m:str(g(r,k) or '').strip() for m,k in [('2026-09','STTS-09/2026'),('2026-10','STTS-10/2026'),('2026-11','STTS-11/2026')] if str(g(r,k) or '').strip()},'ags':{m:str(g(r,k) or '').strip() for m,k in [('2026-09','STTS 09-2026'),('2026-10','STTS 10-2027'),('2026-11','STTS 11-2026')] if str(g(r,k) or '').strip()},'titf':str(g(r,'TITULARIDADE') or '').strip(),'en':[str(g(r,k) or '').strip() for k in ['STTS-09/2026','STTS-10/2026','STTS-11/2026']],
      'ag':[str(g(r,k) or '').strip() for k in ['STTS 09-2026','STTS 10-2027','STTS 11-2026']],'cp':str(g(r,'UCS CONSUMO PROPRIO CEMAR') or '').strip().upper(),
      'tit':'CGB' if 'CGB' in str(g(r,'TITULARIDADE') or '') else str(g(r,'TITULARIDADE') or '').strip().upper(),'cons':cons,'g':gid(g(r,'LOCADOR')),'lo':re.sub(r'\s+',' ',str(g(r,'LOCADOR') or '')).strip(),'end':re.sub(r'\s+',' ',str(g(r,'ENDEREÇO') or '')).strip(),'uca':uc(g(r,'UC ANTIGA')),'ucn':uc(g(r,'NOVA UC PADRAO')),'ucag':uc(g(r,'UC AGUA')),'ul':d8(g(r,'ULTIMA LEITURA')) or str(g(r,'ULTIMA LEITURA') or '').strip(),'uv':d8(g(r,'ULTIMO VENCIMENTO')) or str(g(r,'ULTIMO VENCIMENTO') or '').strip()}
  n_id=sum(1 for x in imv if x['id'].split('-')[0]==it['id'])
  if n_id:it['id']=it['id']+'-'+str(n_id+1)   # dois imóveis com o mesmo nome, localidade e início: id único
  imv.append(it);nomes[it['g']]=1
# renovações
ren=[]
RR=list(wb['RENOVAÇÕES - BCB'].iter_rows(values_only=True))
hh=None
for r in RR:
  if r and r[0]=='LOCADOR':hh=[str(x).strip() if x else '' for x in r];continue
  if hh and r and r[0]:
    d=dict(zip(hh,r));ren.append({'b':BASE.get(norm(d.get('BASE')),d.get('BASE')),'im':str(d.get('IMÓVEL') or '').strip(),'ct':re.sub(r'\D','',str(d.get('CONTRATO') or '')),'ini':d8(d.get('INICIO')),'fim':d8(d.get('TÉRMINO')),'v':num(d.get('VALOR ALUGUEL')) or 0,'st':str(d.get('SITUAÇÃO') or '').strip(),'g':gid(d.get('LOCADOR'))})
# contas a pagar
ws=openpyxl.load_workbook('bd_in/cp.xlsx',data_only=True,read_only=True).worksheets[0];R=list(ws.iter_rows(values_only=True))
i=0
while R[i][0] is None:i+=1
hc=R[i];cp=[dict(zip(hc,r)) for r in R[i+1:] if any(r)]
pag=collections.defaultdict(lambda:collections.defaultdict(list));tot=collections.defaultdict(lambda:collections.defaultdict(lambda:[0,0,0]));cau=0
for d in cp:
  an=d.get('DESC_GER_ANALI') or '';ym=d.get('ANOMES')
  if not ym or not re.match(r'2026-\d\d',str(ym)):continue
  ct=str(d.get('CODCCUSTO') or '')[2:5]
  bx=bool(d.get('BAIXA'));val=abs(num(d.get('VALOR_BX')) or 0) if bx else abs(num(d.get('VALOR_LIQ')) or num(d.get('VALOR_ORIG')) or 0)
  if not val:val=abs(num(d.get('VALOR_ORIG')) or num(d.get('VALOR_BX')) or 0)
  k={'03.02.01-LOCAÇÃO DE IMÓVEIS':0,'03.08.02-ENERGIA':1,'03.08.01-ÁGUA':2}.get(an)
  if k is None:continue
  if k==0 and 'CAU' in norm(d.get('HISTORICO'))[:40]:cau+=val;continue
  tot[ct][ym][k]+=val
  if k==0:pag[gid(d.get('FORNECEDOR'))][ym].append([round(val,2),1 if bx else 0,str(d.get('CIDADE') or '').title(),ct])
# grupos de pagamento: só os que interessam (todos de locação), sem nome
grp={}
for k,v in pag.items():
  cid=re.sub(r'\b(Do|Da|De|Dos|Das)\b',lambda m:m.group(0).lower(),collections.Counter(x[2] for m in v.values() for x in m).most_common(1)[0][0]);cts=collections.Counter(x[3] for m in v.values() for x in m).most_common(1)[0][0]
  grp[k]={'cid':cid,'ct':cts,'m':{m:[[x[0],x[1]] for x in l] for m,l in v.items()}}
out={'imv':imv,'ren':ren,'grp':grp,'tot':{c:{m:[round(x,2) for x in v] for m,v in d.items()} for c,d in tot.items()},'cau':round(cau,2),'fonte':{'loc':'PLANILHA DE LOCAÇÃO 2026','cp':'BD Contas a Pagar e Baixados'}}
json.dump(out,open('dados/loc.json','w'),ensure_ascii=False,separators=(',',':'))
cas=sum(1 for x in imv if x['st']=='ATIVO' and x['g'] in grp)
print(len(imv),'imoveis',cas,'ativos casados',len(grp),'grupos',os.path.getsize('dados/loc.json'),'bytes','caucao',cau)
