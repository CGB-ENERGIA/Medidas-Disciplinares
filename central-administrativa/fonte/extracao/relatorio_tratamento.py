import json,openpyxl,datetime
from openpyxl.styles import Font,PatternFill,Alignment
R=json.load(open('dados/duplicados_removidos.json'));C=json.load(open('dados/contrato_corrigido.json'))
wb=openpyxl.Workbook()
def aba(ws,cab,linhas,larg=None):
    ws.append(cab)
    for c in ws[1]: c.font=Font(bold=True,color='FFFFFF');c.fill=PatternFill('solid',fgColor='711424');c.alignment=Alignment(wrap_text=True,vertical='center')
    for l in linhas: ws.append(l)
    ws.freeze_panes='A2'
    if linhas: ws.auto_filter.ref=ws.dimensions
    for i,c in enumerate(cab,1): ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width=max(12,min(42,len(c)+6))
    for row in ws.iter_rows(min_row=2):
        for c in row:
            if isinstance(c.value,float): c.number_format='#,##0.00'
ws=wb.active;ws.title='Resumo'
tot=lambda L,k:round(sum(x[k] for x in L),2)
aba(ws,['O que foi tratado','Lançamentos','Valor (R$)','Regra'],[
 ['Hospedagem: duplicados removidos',len(R['hosp']),tot(R['hosp'],'total'),'Mesmo colaborador com a mesma entrada e a mesma saída. Fica o que tem nota; depois o de valor > 0; depois o primeiro da planilha.'],
 ['Alimentação: duplicados removidos',len(R['alim']),tot(R['alim'],'valor'),'Mesmo colaborador, mesmo dia e mesma refeição. Mesma regra para escolher o que fica.'],
 ['Hospedagem: contrato colocado pelo histórico',len(C['hosp']),tot(C['hosp'],'valor'),'Sem código de 127/169/170: usado o código do lançamento válido mais próximo na data do mesmo colaborador.'],
 ['Alimentação: contrato colocado pelo histórico',len(C['alim']),tot(C['alim'],'valor'),'Mesma regra (hospedagem e alimentação juntas no histórico).'],
 ['Sem histórico (continuam sem contrato)',len(C['sem_historico']),tot(C['sem_historico'],'valor'),'Colaborador sem nenhum lançamento em 127/169/170: precisa ser conferido pela base.']])
ws.column_dimensions['D'].width=90
aba(wb.create_sheet('Hosp - duplicados'),['Base','Colaborador','Entrada','Saída','Hotel REMOVIDO','Diárias','Diária (R$)','Total REMOVIDO (R$)','NF removida','Status','Hotel que FICOU','Total que FICOU (R$)','NF que ficou'],
    [[x['base'],x['colaborador'],x['entrada'],x['saida'],x['hotel'],x['diarias'],x['diaria'],x['total'],x['nf'],x['status'],x['ficou_hotel'],x['ficou_total'],x['ficou_nf']] for x in sorted(R['hosp'],key=lambda x:(x['base'],x['colaborador']))])
aba(wb.create_sheet('Alim - duplicados'),['Base','Colaborador','Data','Refeição','Restaurante REMOVIDO','Hora','Valor REMOVIDO (R$)','NF removida','Restaurante que FICOU','Hora que ficou','Valor que FICOU (R$)'],
    [[x['base'],x['colaborador'],x['data'],x['refeicao'],x['restaurante'],x['hora'],x['valor'],x['nf'],x['ficou_restaurante'],x['ficou_hora'],x['ficou_valor']] for x in sorted(R['alim'],key=lambda x:(x['base'],x['colaborador'],x['data']))])
aba(wb.create_sheet('Contrato corrigido'),['Tipo','Base','Colaborador','Data','Código ANTES','Centro/contrato ANTES','Código NOVO','Centro de custo NOVO','Contrato','Valor (R$)'],
    [['Hospedagem',x['base'],x['colaborador'],x['entrada'],x['codigo_antes'],x['ccusto_antes'],x['codigo_novo'],x['ccusto_novo'],x['contrato'],x['valor']] for x in C['hosp']]+
    [['Alimentação',x['base'],x['colaborador'],x['data'],x['codigo_antes'],x['contrato_antes'],x['codigo_novo'],x['ccusto_novo'],x['contrato'],x['valor']] for x in sorted(C['alim'],key=lambda x:(x['base'],x['colaborador']))])
aba(wb.create_sheet('Sem contrato - conferir'),['Tipo','Base','Colaborador','Data','Código','Centro/contrato','Valor (R$)'],
    [[x['tipo'],x['base'],x['colaborador'],x['data'],x['codigo'] or '(vazio)',x.get('centro',''),x['valor']] for x in sorted(C['sem_historico'],key=lambda x:(x['colaborador'],x['data']))])
wb.save('/mnt/user-data/outputs/Tratamento_Hospedagem_Alimentacao_2026-11-23.xlsx');print('ok')
