# Remove lançamentos duplicados dos dados da Central (rodar depois de extrai_hosp.py e extrai_alim_voucher.py).
#   Hospedagem: mesmo colaborador com a MESMA entrada e a MESMA saída (a mesma noite não pode ser paga duas vezes).
#   Alimentação: mesmo colaborador, mesmo dia e mesma refeição (Almoço, Jantar, Café; "Self-Service X" conta como X).
# Em cada grupo fica UM lançamento: o que tem nota fiscal, depois o de valor maior que zero, depois o primeiro da planilha.
# Os removidos vão para dados/duplicados_removidos.json (e a planilha de conferência é gerada a partir dele).
import json,datetime,collections,re
EP=datetime.date(1970,1,1)
dia=lambda d:(EP+datetime.timedelta(days=d)).strftime('%d/%m/%Y') if d is not None else ''
temNF=lambda v:bool(re.sub(r'[\s0]','',str(v or '')))
REM={'hosp':[],'alim':[]}

h=json.load(open('dados/dados.json'));D=h['d'];R=h['r']
g=collections.defaultdict(list)
for i,r in enumerate(R):
    col=D['col'][r[3]].strip().upper()
    if col and r[11] is not None and r[12] is not None: g[(col,r[11],r[12])].append(i)
fora=set()
for k,ix in g.items():
    if len(ix)<2: continue
    ix.sort(key=lambda i:(not temNF(D['nf'][R[i][18]]),not R[i][16]>0,i))
    for i in ix[1:]:
        fora.add(i);r=R[i];m=R[ix[0]]
        REM['hosp'].append({'base':D['base'][r[0]],'colaborador':D['col'][r[3]],'entrada':dia(r[11]),'saida':dia(r[12]),'hotel':D['est'][r[2]],'diarias':r[14],'diaria':r[15],'total':r[16],'nf':D['nf'][r[18]],'status':D['st'][r[19]],
          'ficou_hotel':D['est'][m[2]],'ficou_total':m[16],'ficou_nf':D['nf'][m[18]]})
h['r']=[r for i,r in enumerate(R) if i not in fora]
# refaz a marca de duplicidade (64) depois da limpeza
seen=collections.Counter()
for r in h['r']:
    r[21]&=~64;k=(r[0],D['col'][r[3]].strip(),r[11],D['est'][r[2]].strip());seen[k]+=1
    if seen[k]>1:r[21]|=64
json.dump(h,open('dados/dados.json','w'),ensure_ascii=False,separators=(',',':'))

a=json.load(open('dados/alim.json'));A=a['d'];RA=a['r']
TIPO={'Self-Service Almoço':'Almoço','Self-Service Jantar':'Jantar','Self-Service Café':'Café da Manhã'}
g=collections.defaultdict(list)
for i,r in enumerate(RA):
    col=A['col'][r[3]].strip().upper();t=A['tipo'][r[10]]
    if col: g[(col,r[11],TIPO.get(t,t))].append(i)
fora=set()
for k,ix in g.items():
    if len(ix)<2: continue
    ix.sort(key=lambda i:(not temNF(A['nf'][RA[i][14]]),not RA[i][13]>0,i))
    for i in ix[1:]:
        fora.add(i);r=RA[i];m=RA[ix[0]]
        REM['alim'].append({'base':A['base'][r[0]],'colaborador':A['col'][r[3]],'data':dia(r[11]),'hora':r[12],'refeicao':A['tipo'][r[10]],'restaurante':A['est'][r[2]],'valor':r[13],'nf':A['nf'][r[14]],
          'ficou_restaurante':A['est'][m[2]],'ficou_valor':m[13],'ficou_hora':m[12]})
a['r']=[r for i,r in enumerate(RA) if i not in fora]
for r in a['r']: r[15]&=~64
json.dump(a,open('dados/alim.json','w'),ensure_ascii=False,separators=(',',':'))
json.dump(REM,open('dados/duplicados_removidos.json','w'),ensure_ascii=False,indent=0)
for k in REM: print(k,'removidos',len(REM[k]),'R$',round(sum(x.get('total',x.get('valor',0)) for x in REM[k]),2))
