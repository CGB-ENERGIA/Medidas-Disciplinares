import pickle, pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

S = "/tmp/claude-0/-home-claude/9ac52ce2-edc7-57a9-8053-1cc80c593aba/scratchpad/"
h = pickle.load(open(S + "hist.pkl", "rb"))
cad = pd.read_excel(S + "conv/colab.xlsx", dtype=str)
cad = cad[cad["NOME"].notna() & cad["CHAPA"].notna() & ~cad["FUNÇÃO"].fillna("").str.endswith("Total")].drop_duplicates("CHAPA")
cad["chapa"] = cad["CHAPA"].str.strip().str.replace(r"\.0$", "", regex=True).str.lstrip("0")

VINHO, VESC, GELO = "711424", "4A0B16", "F4F4F4"
F = "Arial"
hdr_font = Font(name=F, bold=True, color="FFFFFF", size=10)
hdr_fill = PatternFill("solid", fgColor=VINHO)
body = Font(name=F, size=10)
title = Font(name=F, bold=True, size=16, color=VINHO)
sub = Font(name=F, size=10, color="6B6A6A")
bold = Font(name=F, bold=True, size=10)
thin = Border(bottom=Side(style="thin", color="DEDADB"))

wb = Workbook()

def header(ws, row, cols, widths):
    for j, (c, w) in enumerate(zip(cols, widths), start=1):
        cell = ws.cell(row=row, column=j, value=c)
        cell.font = hdr_font; cell.fill = hdr_fill
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(j)].width = w
    ws.row_dimensions[row].height = 32

def table(ws, name, ref, style="TableStyleLight1"):
    t = Table(displayName=name, ref=ref)
    t.tableStyleInfo = TableStyleInfo(name=style, showRowStripes=True)
    ws.add_table(t)

# ---------------- Histórico
hs = wb.active; hs.title = "Historico"
COLS = [("Origem", "origem", 11), ("Linha na planilha", "linha", 9), ("Chapa", "chapa", 9), ("Nome no cadastro", "nome_cadastro", 32),
        ("Nome na planilha", "nome_planilha", 32), ("Situação no cadastro", "situacao_cadastro", 13), ("Função", "funcao", 24),
        ("Seção (cadastro)", "secao", 30), ("Base", "base", 7), ("C.custo", "ccusto", 13), ("Data", "data", 11),
        ("Todas as datas", "todas_datas", 22), ("Qtd de datas", "qtd_datas", 8), ("Medida", "medida", 13), ("Dias", "dias", 6),
        ("Motivo", "motivo", 60), ("Item Anexo I sugerido", "item", 12), ("Base da sugestão", "item_desc", 30),
        ("Validade", "validade", 26), ("Últimos 12 meses", "u12", 9), ("Ocorrências anteriores do mesmo item (12 meses)", "reinc_12m", 13),
        ("Documento", "documento", 11), ("Responsável", "responsavel", 14), ("Status/situação na planilha", "situacao_planilha", 16),
        ("Obs", "obs", 30), ("Ligado ao cadastro por", "ligado_por", 12), ("Pendências para revisar", "pendencias", 60)]
h = h.sort_values(["data", "origem"], ascending=[False, True], na_position="last").reset_index(drop=True)
h["u12"] = h["ultimos_12m"].map({True: "Sim", False: "Não"})
header(hs, 1, [c[0] for c in COLS], [c[2] for c in COLS])
for i, r in enumerate(h.itertuples(index=False), start=2):
    d = r._asdict()
    for j, (_, k, _) in enumerate(COLS, start=1):
        v = d[k]
        if isinstance(v, float) and pd.isna(v): v = None
        if k == "data": v = None if pd.isna(d[k]) else d[k].to_pydatetime()
        if k == "chapa" and v: v = int(v) if str(v).isdigit() else v
        if k == "dias" and v is not None: v = int(v)
        if v == "": v = None
        c = hs.cell(row=i, column=j, value=v); c.font = body
        if k == "data": c.number_format = "DD/MM/YYYY"
N = len(h) + 1
table(hs, "Historico", f"A1:{get_column_letter(len(COLS))}{N}")
hs.freeze_panes = "E2"

def col(nome):  # letra da coluna no Histórico
    return get_column_letter([c[0] for c in COLS].index(nome) + 1)
CH, VAL, U12, MED, ITEM, ORIG, LIG, PEN, BASE = (col("Chapa"), col("Validade"), col("Últimos 12 meses"), col("Medida"),
    col("Item Anexo I sugerido"), col("Origem"), col("Ligado ao cadastro por"), col("Pendências para revisar"), col("Base"))
R = lambda c: f"Historico!${c}$2:${c}${N}"

# ---------------- Por colaborador (cadastro atual: ativos, férias, afastados)
pc = wb.create_sheet("Por colaborador")
atual = cad[~cad["SITUAÇÃO"].str.upper().str.startswith("DEMIT")].sort_values("NOME")
pcols = ["Chapa", "Nome", "Função", "Seção", "Situação", "Medidas válidas (total)", "Válidas nos últimos 12 meses",
         "Advertências (12 meses)", "Suspensões (12 meses)", "Alerta"]
header(pc, 1, pcols, [9, 34, 26, 32, 12, 12, 12, 12, 12, 26])
for i, r in enumerate(atual.itertuples(index=False), start=2):
    vals = [int(r.chapa) if r.chapa.isdigit() else r.chapa, r.NOME.title(), r[2].capitalize(), r[4], r[6]]
    for j, v in enumerate(vals, start=1): pc.cell(row=i, column=j, value=v).font = body
    f = {6: f'=COUNTIFS({R(CH)},A{i},{R(VAL)},"Válida")',
         7: f'=COUNTIFS({R(CH)},A{i},{R(VAL)},"Válida",{R(U12)},"Sim")',
         8: f'=COUNTIFS({R(CH)},A{i},{R(VAL)},"Válida",{R(U12)},"Sim",{R(MED)},"Advertência")',
         9: f'=COUNTIFS({R(CH)},A{i},{R(VAL)},"Válida",{R(U12)},"Sim",{R(MED)},"Suspensão")',
         10: f'=IF(COUNTIFS(Reincidencia!$A$2:$A$5000,A{i})>0,"Reincidência em 12 meses",IF(G{i}>=3,"3 ou mais medidas em 12 meses",""))'}
    for j, v in f.items(): pc.cell(row=i, column=j, value=v).font = body
NP = len(atual) + 1
table(pc, "PorColaborador", f"A1:J{NP}")
pc.freeze_panes = "C2"

# ---------------- Reincidência
rc = wb.create_sheet("Reincidencia")
re_ = h[(h.reinc_12m >= 1) & (h.ultimos_12m)].sort_values(["reinc_12m", "data"], ascending=[False, False])
rcols = ["Chapa", "Nome", "Base", "Data", "Item Anexo I", "Medida aplicada", "Ocorrências anteriores do mesmo item (12 meses)", "Leitura pela política (5.3)", "Motivo"]
header(rc, 1, rcols, [9, 34, 7, 11, 12, 13, 14, 40, 70])
for i, r in enumerate(re_.itertuples(index=False), start=2):
    vals = [int(r.chapa) if str(r.chapa).isdigit() else r.chapa, r.nome_cadastro or r.nome_planilha, r.base, r.data.to_pydatetime(), r.item, r.medida, r.reinc_12m]
    for j, v in enumerate(vals, start=1):
        c = rc.cell(row=i, column=j, value=v); c.font = body
        if j == 4: c.number_format = "DD/MM/YYYY"
    rc.cell(row=i, column=8, value=f'=IF(G{i}>=2,"Sobe para o nível seguinte","1 anterior: acompanhar")').font = body
    rc.cell(row=i, column=9, value=r.motivo).font = body
NR = len(re_) + 1
table(rc, "Reincidencia", f"A1:I{max(NR,2)}")
rc.freeze_panes = "C2"

# ---------------- Pendências (exceto não aplicadas / não importar, e sem contar só "várias datas")
pd_ = h[(h.pendencias != "") & h.validade.isin(["Válida", "Orientação (não conta para reincidência)"])].copy()
pd_["so_datas"] = pd_.pendencias.str.fullmatch(r"\d+ datas na mesma célula.*")
pd_ = pd_[~pd_.so_datas].sort_values(["ultimos_12m", "data"], ascending=[False, False])
pe = wb.create_sheet("Pendencias")
pcols2 = ["Prioridade", "Origem", "Linha na planilha", "Chapa", "Nome na planilha", "Data", "Medida", "Motivo", "Item sugerido", "O que revisar"]
header(pe, 1, pcols2, [12, 11, 9, 9, 32, 11, 13, 60, 12, 60])
for i, r in enumerate(pd_.itertuples(index=False), start=2):
    vals = ["Últimos 12 meses" if r.ultimos_12m else "Mais antigo", r.origem, r.linha, int(r.chapa) if str(r.chapa).isdigit() else r.chapa,
            r.nome_planilha, None if pd.isna(r.data) else r.data.to_pydatetime(), r.medida, r.motivo, r.item or None, r.pendencias]
    for j, v in enumerate(vals, start=1):
        c = pe.cell(row=i, column=j, value=v); c.font = body
        if j == 6: c.number_format = "DD/MM/YYYY"
NE = len(pd_) + 1
table(pe, "Pendencias", f"A1:J{NE}")
pe.freeze_panes = "B2"

# ---------------- Itens do Anexo I
it = wb.create_sheet("Itens sugeridos")
header(it, 1, ["Item sugerido", "Base da sugestão", "Registros válidos", "Nos últimos 12 meses"], [20, 44, 14, 14])
itens = h[h.item != ""].groupby("item").item_desc.first().reset_index()
itens["n"] = itens.item.map(h[h.validade == "Válida"].item.value_counts()).fillna(0)
itens = itens.sort_values("n", ascending=False)
for i, r in enumerate(itens.itertuples(index=False), start=2):
    it.cell(row=i, column=1, value=r.item).font = body
    it.cell(row=i, column=2, value=r.item_desc).font = body
    it.cell(row=i, column=3, value=f'=COUNTIFS({R(ITEM)},A{i},{R(VAL)},"Válida")').font = body
    it.cell(row=i, column=4, value=f'=COUNTIFS({R(ITEM)},A{i},{R(VAL)},"Válida",{R(U12)},"Sim")').font = body
k = len(itens) + 2
it.cell(row=k, column=1, value="(sem item)").font = body
it.cell(row=k, column=2, value="Motivo não identificado pelas palavras-chave: escolher à mão").font = body
it.cell(row=k, column=3, value=f'=COUNTIFS({R(ITEM)},"",{R(VAL)},"Válida")').font = body
it.cell(row=k, column=4, value=f'=COUNTIFS({R(ITEM)},"",{R(VAL)},"Válida",{R(U12)},"Sim")').font = body
table(it, "Itens", f"A1:D{k}")

# ---------------- Resumo (primeira aba)
rs = wb.create_sheet("Resumo", 0)
rs.sheet_view.showGridLines = False
rs.column_dimensions["A"].width = 52; rs.column_dimensions["B"].width = 14; rs.column_dimensions["C"].width = 14; rs.column_dimensions["D"].width = 60
rs["A1"] = "Cruzamento do histórico de medidas disciplinares"; rs["A1"].font = title
rs["A2"] = "CONTROLE_MEDIDAS_DISCIPLINARES (aba CONTROLE) + Medidas PONTO (aba PONTO) ligados ao cadastro de colaboradores (1610.xls). Gerado em 29/10/2026."; rs["A2"].font = sub
def bloco(row, titulo):
    c = rs.cell(row=row, column=1, value=titulo); c.font = Font(name=F, bold=True, size=11, color="FFFFFF"); c.fill = PatternFill("solid", fgColor=VINHO)
    for j, t in [(2, "CONTROLE"), (3, "PONTO")]:
        x = rs.cell(row=row, column=j, value=t); x.font = Font(name=F, bold=True, size=10, color="FFFFFF"); x.fill = PatternFill("solid", fgColor=VINHO)
    x = rs.cell(row=row, column=4, value="Observação"); x.font = Font(name=F, bold=True, size=10, color="FFFFFF"); x.fill = PatternFill("solid", fgColor=VINHO)
def linha(row, txt, fc, fp, obs=""):
    rs.cell(row=row, column=1, value=txt).font = body
    for j, f in [(2, fc), (3, fp)]:
        c = rs.cell(row=row, column=j, value=f); c.font = body; c.number_format = "#,##0"
    rs.cell(row=row, column=4, value=obs).font = sub
    for j in range(1, 5): rs.cell(row=row, column=j).border = thin
cnt = lambda o, *conds: f'=COUNTIFS({R(ORIG)},"{o}"' + "".join(f",{R(c)},{v}" for c, v in conds) + ")"
bloco(4, "Ligação ao cadastro")
linha(5, "Registros na planilha", cnt("CONTROLE"), cnt("PONTO"))
linha(6, "Ligados pela chapa", cnt("CONTROLE", (LIG, '"chapa"')), cnt("PONTO", (LIG, '"chapa"')), "A PONTO não tem chapa")
linha(7, "Ligados pelo nome", cnt("CONTROLE", (LIG, '"nome"')), cnt("PONTO", (LIG, '"nome"')), "Sem chapa ou chapa inexistente no cadastro: conferir")
linha(8, "Não ligados a ninguém", cnt("CONTROLE", (LIG, '"não ligado"')), cnt("PONTO", (LIG, '"não ligado"')), "Ver aba Pendencias")
bloco(10, "Validade das medidas")
for r_, (t, v, o) in enumerate([("Válidas (contam para reincidência)", '"Válida"', ""),
        ("Válidas nos últimos 12 meses", None, "Base para calcular reincidência hoje"),
        ("Orientação / reorientação", '"Orientação*"', "Registrada, mas não conta para reincidência"),
        ("Não aplicadas", '"Não aplicada*"', "Status 'Não aplicada' na PONTO"),
        ("Não importar (excluir, desconsiderar, não foi aplicada)", '"Não importar*"', "Coluna SITUAÇÃO da CONTROLE")], start=11):
    if v is None:
        linha(r_, t, cnt("CONTROLE", (VAL, '"Válida"'), (U12, '"Sim"')), cnt("PONTO", (VAL, '"Válida"'), (U12, '"Sim"')), o)
    else:
        linha(r_, t, cnt("CONTROLE", (VAL, v)), cnt("PONTO", (VAL, v)), o)
bloco(17, "Revisão")
linha(18, "Válidas sem item do Anexo I identificado", cnt("CONTROLE", (VAL, '"Válida"'), (ITEM, '""')), cnt("PONTO", (VAL, '"Válida"'), (ITEM, '""')), "Escolher o item à mão (aba Pendencias)")
linha(19, "Registros com alguma pendência", cnt("CONTROLE", (PEN, '"<>"')), cnt("PONTO", (PEN, '"<>"')), "Inclui células com várias datas, já separadas")
rs["A21"] = "Colaboradores do cadastro atual com reincidência em 12 meses"; rs["A21"].font = bold
rs["B21"] = f"=COUNTIFS('Por colaborador'!$J$2:$J${NP},\"Reincidência*\")"; rs["B21"].font = bold
rs["A22"] = "Ocorrências com 2 ou mais anteriores do mesmo item (sobe de nível)"; rs["A22"].font = bold
rs["B22"] = f'=COUNTIFS(Reincidencia!$G$2:$G${max(NR,2)},">=2")'; rs["B22"].font = bold

rs["A24"] = "Como foi feito"; rs["A24"].font = Font(name=F, bold=True, size=11, color=VINHO)
notas = [
    "CONTROLE: ligada pela CHAPA. Quando a chapa falta ou não existe no cadastro, procurei pelo nome.",
    "PONTO: não tem chapa, então foi ligada pelo nome (sem acentos e espaços extras). Homônimos e nomes aproximados ficam em Pendências.",
    "O cadastro usado inclui demitidos, para achar o histórico antigo. A aba Por colaborador mostra só quem está ativo, de férias ou afastado.",
    "Item do Anexo I: sugerido por palavras-chave do MOTIVO. É só um ponto de partida e precisa ser revisado antes de importar.",
    "Velocidade aparece como '10 ou 26', porque depende de quanto passou do limite (até 20% ou mais de 20%).",
    "Esquecimento do ponto aparece como '8 (confirmar com DP)', porque o DP ainda vai definir entre o item 8 e o 2.",
    "Células com várias datas: a coluna Data traz a primeira e Todas as datas traz a lista separada.",
    "Reincidência: conta medidas válidas do mesmo item nos 12 meses antes de cada ocorrência. Velocidade fica de fora até definir 10 ou 26.",
    "ADVERTENCIA foi padronizado para Advertência e BDB para BDC (1 registro).",
]
for i, n in enumerate(notas, start=25):
    rs.cell(row=i, column=1, value="• " + n).font = body
    rs.merge_cells(start_row=i, start_column=1, end_row=i, end_column=4)
rs.freeze_panes = "A4"

out = S + "Cruzamento_Historico_Medidas.xlsx"
wb.save(out); print(out, N, NP, NR, NE)
