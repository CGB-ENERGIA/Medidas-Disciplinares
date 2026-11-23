import openpyxl,json,collections,datetime,re
wb=openpyxl.load_workbook('/mnt/user-data/uploads/c12329bd-ATENDIMENTOS_DO_FALE_CONOSCO_CGB.xlsx',data_only=True)
ws=wb['Atendimentos ']
rows=list(ws.iter_rows(values_only=True));hi=next(i for i,r in enumerate(rows) if r[0]=='MATRÍCULA')
T=lambda v:re.sub(r'\s+',' ',str(v)).strip() if v is not None else ''
EP=datetime.date(1970,1,1);out=[]
for r in rows[hi+1:]:
    if not any(r): continue
    d=r[10];d=(d.date()-EP).days if hasattr(d,'date') else None
    out.append({'mat':T(r[0]),'nm':T(r[1]).upper(),'b':T(r[2]),'fn':T(r[3]),'ar':T(r[4]),'sup':T(r[5]),'co':T(r[6]),'as':T(r[7]),'q':T(r[8]),'st':T(r[9]).upper() or 'SEM STATUS','d':d,'res':T(r[11])})
bc=wb['Base de Colaboradores'];at=collections.Counter();atc=collections.Counter()
for r in list(bc.iter_rows(values_only=True))[1:]:
    if r[7] and str(r[7]).strip()!='DEMITIDO': at[str(r[5]).strip()]+=1;atc[str(r[12]).strip()]+=1
json.dump({'at':out,'ativos':at,'ativosCoord':atc,'gerado':'2026-11-16'},open('dados/fc.json','w'),ensure_ascii=False)
print(len(out),collections.Counter(x['st'] for x in out),collections.Counter(x['as'] for x in out).most_common(20),at,min(x['d'] for x in out),max(x['d'] for x in out))
