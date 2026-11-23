import openpyxl,collections,json,re,datetime
P='/mnt/user-data/uploads/'
def T(v): return re.sub(r'\s+',' ',str(v).replace('\xa0',' ')).strip() if v is not None else ''
def base(l):
    u=T(l).upper()
    for k,b in [('BACABA','BCB'),('SANTA IN','STI'),('DUTRA','PDT'),('PEDREIRAS','PDS'),('ITAPECURU','ITM'),('BARRA DO CORDA','BDC'),('SÃO LUIS','SLZ'),('SAO LUIS','SLZ')]:
        if k in u: return b
    if 'REPÚBLICA' in u or 'REPUBLICA' in u: return 'REP'
    return 'OUT' if u else ''
def grupo_kw(d):
    u=T(d).upper()
    for ks,g in [(('MOTOSSERRA','MOTOPODA','INSUFLADOR','TRANSPALET','BALANÇA','TORQUI','DINAMOM','PERFURATRIZ','GUINDAUTO','SKY','BOMBA'),'MÁQUINAS E EQUIPAMENTOS DIVERSOS'),
                 (('NOTEBOOK','COMPUTADOR','MONITOR','DESKTOP','DESCKTOP'),'NOTEBOOK, COMPUTADOR E MONITOR'),
                 (('IMPRESSORA','SCANNER','NOBREAK','CÂMERA','CAMERA','POLYCOM','CENTRAL TELEF'),'EQUIPAMENTOS DE INFORMÁTICA DIVERSOS'),
                 (('CAMINHÃO','CAMINHAO'),'VEÍCULOS PESADOS'),(('MOTO ','MOTOCICLETA'),'MOTOCICLETAS'),
                 (('HILUX','S10','RANGER','VEÍCULO MÉDIO','VEICULO MEDIO'),'VEÍCULOS MÉDIOS'),(('VEÍCULO LEVE','VEÍULO LEVE','STRADA','SAVEIRO','POLO','GOL ','UNO'),'VEÍCULOS LEVES'),
                 (('GELADEIRA','AR CONDICIONADO','AR-CONDICIONADO','BEBEDOURO','FREEZER','TV','TELEVIS','MÁQUINA DE LAVAR','MAQUINA DE LAVAR','MICRO','FOGÃO','GELO','PURIFICADOR'),'ELETRODOMÉSTICOS')]:
        if any(k in u for k in ks): return g
    return 'OUTROS'
def st(v):
    u=T(v).upper()
    if 'CONFORMIDADE' in u: return 'C'
    if 'NÃO CONFORME' in u or 'NAO CONFORME' in u: return 'NC'
    if 'ENCONTRAD' in u: return 'NE'
    return 'SS'
MES={'JANEIRO':1,'FEVEREIRO':2,'MARÇO':3,'ABRIL':4,'MAIO':5,'JUNHO':6,'JULHO':7,'AGOSTO':8,'SETEMBRO':9,'OUTUBRO':10,'NOVEMBRO':11,'DEZEMBRO':12}
wb=openpyxl.load_workbook(P+'0f5cfec4-CRONOGRAMA.xlsx',read_only=True,data_only=True)
cron=[]
for r in list(wb['CRONOGRAMA'].iter_rows(values_only=True))[3:]:
    if not r[0]: continue
    f=lambda d:d.strftime('%Y-%m-%d') if hasattr(d,'strftime') else None
    cron.append({'item':T(r[0]),'ini':f(r[1]),'fim':f(r[2]),'dur':r[3],'apres':f(r[4]),'obs':T(r[5])})
inv=[];gmap={};vmap={}
for sh in wb.sheetnames[1:]:
    m=MES.get(sh.strip().upper());
    if not m: continue
    rows=[r for r in wb[sh].iter_rows(values_only=True) if any(c is not None for c in r)]
    h=[T(c).upper() for c in rows[0]];ix={}
    for i,x in enumerate(h):
        if x.startswith('OBS'): ix.setdefault('OBS',i)
        elif x: ix.setdefault(x,i)
    g=lambda r,k: r[ix[k]] if k in ix and ix[k]<len(r) else None
    for r in rows[1:]:
        pl=T(g(r,'PLACA DE PATRIMONIO'))
        if not pl: continue
        d=g(r,'DATA DE AQUISIÇÃO');gr=T(g(r,'DESCRIÇÃO GRUPO PATRIMÔNIO'))
        if gr and gr!='None': gmap[pl]=gr
        va=g(r,'VALOR DE AQUISIÇÃO');sa=g(r,'SALDO RESIDUAL');q=g(r,'QUANTIDADE') if 'QUANTIDADE' in ix else 1
        if isinstance(va,(int,float)) and va>0:
            qq=q if isinstance(q,(int,float)) and q>0 else 1
            cand=(va/qq,(sa/qq) if isinstance(sa,(int,float)) else None)
            if pl not in vmap or cand[0]<vmap[pl][0]: vmap[pl]=cand
        loc=T(g(r,'DESCRIÇÃO DO LOCAL'))
        inv.append({'m':m,'pl':pl,'ds':T(g(r,'DESCRIÇÃO DO BEM')),'cc':T(g(r,'GRUPO DO CENTRO DE CUSTO')),'nf':T(g(r,'NÚMERO DA NOTA FISCAL')),
            'aq':d.strftime('%Y-%m-%d') if hasattr(d,'strftime') else '','mat':T(g(r,'MATRÍCULA DO FUNCIONÁRIO')),'nm':T(g(r,'NOME DO FUNCIONÁRIO')),
            'loc':loc,'b':base(loc),'obs':T(g(r,'OBS')),'st':st(g(r,'STATUS')),'gr':gr if gr and gr!='None' else ''})
for x in inv:
    if not x['gr']: x['gr']=gmap.get(x['pl']) or grupo_kw(x['ds'])
wi=openpyxl.load_workbook(P+'ab87d6ec-INVENTARIO_2026.xlsx',read_only=True,data_only=True).active
cad=[]
for r in list(wi.iter_rows(values_only=True))[1:]:
    if not any(r): continue
    pl=T(r[0]);loc=T(r[7]);la=T(r[8])
    cad.append({'pl':pl,'ds':T(r[1]),'ct':T(r[2]),'mat':T(r[3]),'nm':T(r[4]),'mat2':T(r[5]),'nm2':T(r[6]),'loc':loc,'loc2':la,'b':base(la or loc),'gr':gmap.get(pl) or grupo_kw(r[1])})
val={k:[round(v[0],2),round(v[1],2) if v[1] is not None else None] for k,v in vmap.items()}
json.dump({'cron':cron,'inv':inv,'cad':cad,'val':val,'gerado':'2026-11-16'},open('dados/pat.json','w'),ensure_ascii=False,separators=(',',':'))
import os;print(len(inv),len(cad),len(val),os.path.getsize('dados/pat.json'))
print(collections.Counter(x['gr'] for x in inv).most_common(12))
print(collections.Counter(x['b'] for x in cad).most_common(12))
cp=set(c['pl'] for c in cad);ip=set(x['pl'] for x in inv);print('cad verificados',len(cp&ip),'inv fora do cadastro',len(ip-cp))
print(sum(v[0] for v in val.values()))
