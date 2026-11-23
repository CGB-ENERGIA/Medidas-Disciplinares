# Arruma grafias e datas antes de corrigir contrato e tirar duplicados (rodar logo depois da extração).
#   1) Nomes de pessoas (colaborador, solicitante, autorizador): o mesmo nome com/sem acento ou com maiúsculas
#      diferentes vira uma grafia só (a mais usada; no empate, a em maiúsculas com acento).
#   2) Hotéis/restaurantes da mesma cidade escritos de jeitos diferentes ("NUTRILAR" e "HOTEL NUTRILAR") viram um só.
#   3) Ano digitado errado na entrada (ex.: 2226) quando a saída é de 2026: corrige para 2026.
#   4) Linha vazia (sem colaborador, sem datas e sem valor): sai.
import json,collections,unicodedata,re,datetime
EP=datetime.date(1970,1,1)
sem=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFD',str(s or '')).encode('ascii','ignore').decode().upper()).strip()
def kest(s):
    s=sem(s);s=re.sub(r'\b(HOTEL|POUSADA|RESTAURANTE|RESUTARANTE|RESTAURANT|CHURRASCARIA|LANCHONETE|PANIFICADORA|E|DO|DA|DE|DOS|DAS)\b',' ',s)
    return re.sub(r'[^A-Z0-9]','',s)
LOG=collections.Counter()
def unifica(datasets):
    # datasets: lista de (dict d, linhas, [(campo, posição)])
    uso=collections.defaultdict(collections.Counter)
    for d,R,campos in datasets:
        for f,p in campos:
            for r in R: v=d[f][r[p]]; uso[sem(v)][v]+=1
    melhor={k:max(c.items(),key=lambda x:(x[1],x[0].isupper(),x[0]!=sem(x[0])))[0] for k,c in uso.items()}
    for d,R,campos in datasets:
        for f,p in campos:
            for r in R:
                v=d[f][r[p]];m=melhor[sem(v)]
                if m!=v:
                    if m not in d[f]: d[f].append(m)
                    r[p]=d[f].index(m);LOG['nome_'+f]+=1
h=json.load(open('dados/dados.json'));D=h['d']
a=json.load(open('dados/alim.json'));A=a['d']
unifica([(D,h['r'],[('col',3),('sol',4),('aut',5)]),(A,a['r'],[('col',3),('sol',4),('aut',5)])])
for d,R,pe,pc in [(D,h['r'],2,1),(A,a['r'],2,1)]:
    uso=collections.defaultdict(collections.Counter)
    for r in R: uso[(sem(d['cid'][r[pc]]),kest(d['est'][r[pe]]))][d['est'][r[pe]]]+=1
    for r in R:
        c=uso[(sem(d['cid'][r[pc]]),kest(d['est'][r[pe]]))];m=max(c.items(),key=lambda x:(x[1],len(x[0])))[0]
        if m!=d['est'][r[pe]]:
            if m not in d['est']: d['est'].append(m)
            r[pe]=d['est'].index(m);LOG['estabelecimento']+=1
novo=[]
for r in h['r']:
    if not D['col'][r[3]].strip() and r[11] is None and r[12] is None and not r[16]: LOG['linha_vazia']+=1;continue
    e,s=r[11],r[12]
    if e is not None and s is not None:
        de,ds=EP+datetime.timedelta(days=e),EP+datetime.timedelta(days=s)
        if de.year!=ds.year and abs(de.year-ds.year)>1:
            try:
                de2=de.replace(year=ds.year)
                if de2<=ds:
                    r[11]=(de2-EP).days;mes=de2.strftime('%Y-%m')
                    if mes not in D['mes']: D['mes'].append(mes)
                    r[13]=D['mes'].index(mes);r[21]&=~8;LOG['ano_corrigido']+=1
            except ValueError: pass
    novo.append(r)
h['r']=novo
json.dump(h,open('dados/dados.json','w'),ensure_ascii=False,separators=(',',':'))
json.dump(a,open('dados/alim.json','w'),ensure_ascii=False,separators=(',',':'))
print(dict(LOG))
