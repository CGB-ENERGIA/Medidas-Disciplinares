# Alimentação a partir da PLANILHA DE VOUCHER (formato com IDENTIFICADOR, 20 colunas). Gera dados/alim.json no mesmo formato de antes.
import openpyxl,collections,datetime,re,json,sys
EP=datetime.date(1970,1,1)
ARQ=sys.argv[1]
wb=openpyxl.load_workbook(ARQ,read_only=True,data_only=True)
rows=list(wb['Worksheet'].iter_rows(values_only=True))
H=[str(h or '').strip().upper() for h in rows[0]]
ix=lambda n:H.index(n)
C={k:ix(n) for k,n in dict(col='COLABORADOR',est='ESTABELECIMENTO',sol='SOLICITAÇÃO',aut='AUTORIZADO',cid='CIDADE',base='BASE',q='QTD COLABORADORES',cod='CODIGO GERENCIAL',ger='GERÊNCIA',cc='CCUSTO',mot='MOTIVO',serv='SERVIÇO',val='VALOR',dt='DATA',nf='NF').items()}
rows=[r for r in rows[1:] if any(r)]
cct=json.load(open('dados/cct.json'))
DICT=collections.defaultdict(list);IDX=collections.defaultdict(dict)
def d(f,v):
    v='' if v is None else re.sub(r'\s+',' ',str(v).replace('\xa0',' ')).strip()
    if v not in IDX[f]: IDX[f][v]=len(DICT[f]);DICT[f].append(v)
    return IDX[f][v]
def pdt(x):
    if isinstance(x,str):
        m=re.match(r'(\d+)/(\d+)/(\d+)(?: (\d+):(\d+))?',x.strip());return datetime.datetime(int(m[3]),int(m[2]),int(m[1]),int(m[4] or 0),int(m[5] or 0))
    return x
TIPO={'Self-Service Almoço':'Almoço','Self-Service Jantar':'Jantar','Self-Service Café':'Café da Manhã'}
out=[];seen=collections.Counter()
for r in rows:
    g=lambda k:r[C[k]]
    t=pdt(g('dt'));fl=0
    cod=str(g('cod') or '').strip()
    if cod not in cct: fl|=16
    serv=re.sub(r'\s+',' ',str(g('serv') or '')).strip()
    if not serv: fl|=8; serv='NÃO INFORMADO'
    v=float(g('val')) if isinstance(g('val'),(int,float)) else 0.0
    if v<=0: fl|=32
    k=(str(g('col')).strip(),t.date(),TIPO.get(serv,serv)); seen[k]+=1
    if seen[k]>1: fl|=64
    out.append([d('base',g('base')),d('cid',g('cid')),d('est',g('est')),d('col',g('col')),d('sol',g('sol')),d('aut',g('aut')),d('cod',cod),d('ger',g('ger')),d('cc',g('cc')),d('mot',g('mot')),d('tipo',serv),(t.date()-EP).days,t.hour,round(v,2),d('nf',g('nf')),fl])
LIM=60
for o in out:
    if o[13]>LIM: o[15]|=4
ult=max(o[11] for o in out)
json.dump({'d':DICT,'r':out,'lim':LIM,'gerado':str(EP+datetime.timedelta(days=ult)),'origem':'planilha de voucher de alimentação'},open('dados/alim.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(out),'linhas')
