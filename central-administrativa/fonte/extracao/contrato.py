# Lançamentos SEM código dos contratos 127, 169 ou 170 (código vazio, "VERIFICAR" ou de outro contrato, ex.: 2.166.01):
# procura no histórico do mesmo colaborador (hospedagem e alimentação juntas) o lançamento com código válido
# MAIS PRÓXIMO NA DATA e usa aquele código (e o centro de custo, gerência e área dele).
# Quem não tem nenhum lançamento válido no histórico fica como está e aparece em Pendências.
# Registro do que mudou: dados/contrato_corrigido.json
import json,datetime,collections,re
EP=datetime.date(1970,1,1)
dia=lambda d:(EP+datetime.timedelta(days=d)).strftime('%d/%m/%Y') if d is not None else ''
cct=json.load(open('dados/cct.json'))
ok=lambda c:c in cct
h=json.load(open('dados/dados.json'));D=h['d']
a=json.load(open('dados/alim.json'));A=a['d']
def idx(dic,f,v):
    if v not in dic[f]: dic[f].append(v)
    return dic[f].index(v)
nome=lambda s:re.sub(r'\s+',' ',str(s or '')).strip().upper()
hist=collections.defaultdict(list)
for r in h['r']:
    c=D['cod'][r[6]]
    if ok(c) and r[11] is not None: hist[nome(D['col'][r[3]])].append((r[11],c))
for r in a['r']:
    c=A['cod'][r[6]]
    if ok(c): hist[nome(A['col'][r[3]])].append((r[11],c))
def achar(col,d):
    hs=hist.get(nome(col))
    if not hs: return None
    d=d if d is not None else hs[0][0]
    return min(hs,key=lambda x:(abs(x[0]-d),-x[0]))[1]
LOG={'hosp':[],'alim':[],'sem_historico':[]}
for r in h['r']:
    c=D['cod'][r[6]]
    if ok(c): continue
    n=achar(D['col'][r[3]],r[11])
    if n is None:
        # erro de digitação conhecido: 1.169.33 -> 2.169.33
        if re.match(r'^1\.(127|169|170)\.\d\d$',c) and ok('2'+c[1:]): n='2'+c[1:]
    if n is None: LOG['sem_historico'].append({'tipo':'Hospedagem','base':D['base'][r[0]],'colaborador':D['col'][r[3]],'data':dia(r[11]),'codigo':c,'valor':r[16]});continue
    cc,ger,area=cct[n]
    LOG['hosp'].append({'base':D['base'][r[0]],'colaborador':D['col'][r[3]],'entrada':dia(r[11]),'codigo_antes':c or '(vazio)','ccusto_antes':D['cc'][r[7]],'codigo_novo':n,'ccusto_novo':cc,'contrato':n.split('.')[1],'valor':r[16]})
    r[6]=idx(D,'cod',n);r[7]=idx(D,'cc',cc);r[8]=idx(D,'ger',ger);r[9]=idx(D,'area',area);r[21]&=~16
for r in a['r']:
    c=A['cod'][r[6]]
    if ok(c): continue
    n=achar(A['col'][r[3]],r[11])
    if n is None: LOG['sem_historico'].append({'tipo':'Alimentação','base':A['base'][r[0]],'colaborador':A['col'][r[3]],'data':dia(r[11]),'codigo':c,'centro':A['cc'][r[8]],'valor':r[13]});continue
    LOG['alim'].append({'base':A['base'][r[0]],'colaborador':A['col'][r[3]],'data':dia(r[11]),'codigo_antes':c,'contrato_antes':A['cc'][r[8]],'codigo_novo':n,'ccusto_novo':cct[n][0],'contrato':n.split('.')[1],'valor':r[13]})
    r[6]=idx(A,'cod',n);r[15]&=~16
json.dump(h,open('dados/dados.json','w'),ensure_ascii=False,separators=(',',':'))
json.dump(a,open('dados/alim.json','w'),ensure_ascii=False,separators=(',',':'))
json.dump(LOG,open('dados/contrato_corrigido.json','w'),ensure_ascii=False,indent=0)
for k,v in LOG.items(): print(k,len(v),'R$',round(sum(x['valor'] for x in v),2))
