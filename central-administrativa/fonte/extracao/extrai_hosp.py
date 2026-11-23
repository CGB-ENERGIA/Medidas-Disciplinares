import openpyxl,glob,json,datetime,collections,re
EP=datetime.date(1970,1,1)
CCT={}
DICT=collections.defaultdict(list); IDX=collections.defaultdict(dict)
def d(f,v):
    v='' if v is None else re.sub(r'\s+',' ',str(v).replace('\xa0',' ')).strip()
    if v not in IDX[f]: IDX[f][v]=len(DICT[f]); DICT[f].append(v)
    return IDX[f][v]
def num(v):
    if isinstance(v,bool) or v is None: return None
    try: return float(v)
    except: return None
def day(v):
    if isinstance(v,datetime.datetime): v=v.date()
    if isinstance(v,datetime.date): return (v-EP).days
    return None
rows=[];stats=collections.Counter();seen=collections.Counter()
import sys
ARQS=sys.argv[1:] or sorted(glob.glob('/mnt/user-data/uploads/*.xlsm'))
for f in ARQS:
    wb=openpyxl.load_workbook(f,read_only=True,data_only=True)
    if not CCT:
        for r in list(wb['CCUSTO'].iter_rows(values_only=True))[1:]:
            if r[0]: CCT[str(r[0]).strip()]=(r[1],r[2],r[3])
    ws=wb[[s for s in wb.sheetnames if s.startswith('HOSP')][0]]
    rr=list(ws.iter_rows(values_only=True));h=rr[0];ix={x:i for i,x in enumerate(h) if x}
    g=lambda r,k:r[ix[k]]
    for r in rr[1:]:
        if not g(r,'SOLICITAÇÃO') and not g(r,'TOTAL') and not g(r,'COLABORADORES'): continue
        fl=0
        cod=str(g(r,'CODIGO GERENCIAL') or '').strip()
        cc=CCT.get(cod)
        if cc: ccn,ger,area=cc
        else:
            ccn=g(r,'CCUSTO') or 'SEM CENTRO DE CUSTO'; ger=g(r,'GERÊNCIA') or 'SEM GERÊNCIA'; area=ccn; fl|=16
        if ger=='VERIFICAR' or ccn=='VERIFICAR': fl|=16
        ent=day(g(r,'ENTRADA'));sai=day(g(r,'SAIDA'))
        m=g(r,'MÊS')
        mes=m.strftime('%Y-%m') if hasattr(m,'strftime') else None
        if not mes or not mes.startswith('2026'):
            fl|=8
            e=g(r,'ENTRADA')
            mes=e.strftime('%Y-%m') if hasattr(e,'strftime') and e.year==2026 else 'DATA INVÁLIDA'
        dia=num(g(r,'DIÁRIAS')) or 0; pr=num(g(r,'DIÁRIA (R$)')) or 0; tot=num(g(r,'TOTAL'))
        if tot is None: fl|=32; tot=0
        if tot==0: fl|=32
        if abs(tot-dia*pr)>1: fl|=4
        st=str(g(r,'STATUS_HOSP') or '').strip().upper()
        if st!='OK': fl|=1
        nf=g(r,'NOTA FISCAL')
        if nf in (None,'',0,'0'): fl|=2
        if ent is not None and sai is not None and sai<ent: fl|=8
        key=(g(r,'BASE'),str(g(r,'COLABORADORES')).strip(),ent,str(g(r,'ESTABELECIMENTO')).strip())
        seen[key]+=1
        if seen[key]>1: fl|=64
        rows.append([d('base',g(r,'BASE')),d('cid',g(r,'CIDADE')),d('est',g(r,'ESTABELECIMENTO')),d('col',g(r,'COLABORADORES')),
          d('sol',g(r,'SOLICITAÇÃO')),d('aut',g(r,'AUTORIZADO')),d('cod',cod),d('cc',ccn),d('ger',ger),d('area',area),d('mot',g(r,'MOTIVO')),
          ent,sai,d('mes',mes),dia,pr,round(tot,2),int(num(g(r,'QTD DE COLAB')) or 1),d('nf',nf),d('st',st or '(vazio)'),d('conf',g(r,'CONFERENTE')),fl])
        for b in range(7):
            if fl&(1<<b): stats[b]+=1
print(len(rows),stats)
print({k:len(v) for k,v in DICT.items()})
hoje=(datetime.date.today()-EP).days
ult=max([x for r in rows for x in (r[11],r[12]) if x is not None and x<=hoje] or [hoje])
GER=str(EP+datetime.timedelta(days=ult));print('dados até',GER)
json.dump({'d':DICT,'r':rows,'gerado':GER},open('/home/claude/dados/dados.json','w'),ensure_ascii=False,separators=(',',':'))
