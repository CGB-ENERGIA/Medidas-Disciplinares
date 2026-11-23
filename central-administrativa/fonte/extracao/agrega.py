import pandas as pd, json, sys, re
f=sys.argv[1]
EQ=['silas.pereira','jhennifer.santos','antonia.reis','deyvid.henrique','hugo.vitor','heloyse.medeiros','jayna.queiroz','berenice.franca']
d=pd.read_excel(f,header=1)
d['u']=d.USUARIOCRIACAO.astype(str).str.lower().str.strip()
d=d[d.u.isin(EQ)&d.REFERENCIA.notna()].copy()
d['nat']=d.DESC_GER_ANALI.astype(str).str.replace(r'^[\d.]+-','',regex=True).str.strip()
d['DC']=pd.to_datetime(d.DATACRIACAO_MOV,errors='coerce')
g=d.groupby('REFERENCIA').agg(u=('u','first'),ym=('ANOMES','first'),nat=('nat','first'),vo=('VALOR_ORIG','sum'),bx=('VALOR_BX','sum'),dc=('DC','min'),venc=('VENCIMENTO','first'),baixa=('BAIXA','first')).reset_index()
g['valor']=g.apply(lambda r:r.vo if r.vo>0 else -r.bx,axis=1).round(2)
g['pago']=(g.bx!=0)|g.baixa.notna()
M,N,D,R={},{},{},{}
for u,x in g.groupby('u'):
  M[u]={ym:[int(len(y)),round(float(y.valor.sum()),2),int(y.pago.sum()),round(float(y[y.pago].valor.sum()),2)] for ym,y in x.groupby('ym')}
  N[u]={n:[int(len(y)),round(float(y.valor.sum()),2)] for n,y in x.groupby('nat')}
  z=x[x.dc.notna()&(x.dc>='2026-01-01')]
  D[u]={k.strftime('%Y-%m-%d'):int(v) for k,v in z.groupby(z.dc.dt.normalize()).size().items()}
  r=x.sort_values(['dc','ym'],ascending=False,na_position='last').head(12)
  R[u]=[[int(a.REFERENCIA),a.dc.strftime('%Y-%m-%d') if pd.notna(a.dc) else '',str(a.venc) if pd.notna(a.venc) else '',a.ym,a.nat,float(a.valor),bool(a.pago)] for a in r.itertuples()]
out={'at':str(pd.Timestamp.now().date()),'fonte':'BD Contas a Pagar e Baixados','eq':EQ,'M':M,'N':N,'D':D,'R':R,'n':int(len(g))}
s=json.dumps(out,ensure_ascii=False,separators=(',',':'))
open('eqp.json','w').write(s);print(len(s),'bytes',len(g),'docs')
