import openpyxl,collections,datetime,re,json
EP=datetime.date(1970,1,1)
wb=openpyxl.load_workbook('/mnt/user-data/uploads/50cf7a64-PLANILHA_DE_ALIMENTA__O_APP_2026.xlsx',read_only=True,data_only=True)
rows=[r for r in list(wb['Worksheet'].iter_rows(values_only=True))[1:] if any(r)]
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
out=[];seen=collections.Counter();vals=[]
for r in rows:
    sol,aut,cid,base,est,col,q,cod,ger,cc,mot,serv,val,dt,nf=r[:15]
    t=pdt(dt);fl=0
    cod=str(cod or '').strip()
    if cod not in cct: fl|=16
    serv=re.sub(r'\s+',' ',str(serv or '')).strip()
    if not serv: fl|=8; serv='NÃO INFORMADO'
    v=float(val) if isinstance(val,(int,float)) else 0.0
    if v<=0: fl|=32
    vals.append(v)
    k=(str(col).strip(),t.date(),TIPO.get(serv,serv)); seen[k]+=1
    if seen[k]>1: fl|=64
    out.append([d('base',base),d('cid',cid),d('est',est),d('col',col),d('sol',sol),d('aut',aut),d('cod',cod),d('ger',ger),d('cc',cc),d('mot',mot),d('tipo',serv),(t.date()-EP).days,t.hour,round(v,2),d('nf',nf),fl])
vals.sort();print('p50',vals[len(vals)//2],'p95',vals[int(len(vals)*.95)],'p99',vals[int(len(vals)*.99)],'max',vals[-1])
LIM=60
for o in out:
    if o[13]>LIM: o[15]|=4
print(len(out),{k:len(v) for k,v in DICT.items()},collections.Counter(b for o in out for b in (1,2,4,8,16,32,64) if o[15]&b))
json.dump({'d':DICT,'r':out,'lim':LIM},open('dados/alim.json','w'),ensure_ascii=False,separators=(',',':'))
import os;print(os.path.getsize('dados/alim.json'))
# metas refeição
wm=openpyxl.load_workbook('/mnt/user-data/uploads/1033bd0b-metas.xlsx',data_only=True).active
M=collections.defaultdict(dict)
for r in list(wm.iter_rows(values_only=True))[2:]:
    if not r[0] or not hasattr(r[5],'strftime'):continue
    v=r[6] if isinstance(r[6],(int,float)) else 0;m=r[5].strftime('%Y-%m');c=str(r[0]).strip()
    M[m][c]=round(M[m].get(c,0)+v,2)
print(sum(sum(x.values()) for x in M.values()))
json.dump(M,open('dados/metas_ref.json','w'))
