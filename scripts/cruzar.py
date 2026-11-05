import pandas as pd, re, unicodedata, difflib, pickle
from datetime import date, datetime

A = "/mnt/user-data/attachments/9ac52ce2-edc7-57a9-8053-1cc80c593aba/"
S = "/tmp/claude-0/-home-claude/9ac52ce2-edc7-57a9-8053-1cc80c593aba/scratchpad/"
HOJE = pd.Timestamp("2026-10-29")

def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().upper()
    return re.sub(r"\s+", " ", re.sub(r"[^A-Z ]", " ", s)).strip()

def chapa(v):
    if v is None or (isinstance(v, float) and pd.isna(v)) or str(v).strip() in ("", "nan"): return None
    s = str(v).strip()
    s = re.sub(r"\.0$", "", s)
    return s.lstrip("0") or "0"

# ---------- cadastro (todos, inclusive demitidos, para achar o histórico antigo)
cad = pd.read_excel(S + "conv/colab.xlsx", dtype=str)
cad = cad[cad["NOME"].notna() & cad["CHAPA"].notna() & ~cad["FUNÇÃO"].fillna("").str.endswith("Total")].drop_duplicates("CHAPA")
cad["chapa"] = cad["CHAPA"].map(chapa)
cad["nn"] = cad["NOME"].map(norm)
cad = cad[["chapa", "NOME", "FUNÇÃO", "SEÇÃO", "SITUAÇÃO", "ADMISSÃO", "DEMISSÃO", "nn"]]
por_chapa = cad.set_index("chapa").to_dict("index")
por_nome = {}
for r in cad.itertuples():
    por_nome.setdefault(r.nn, []).append(r.chapa)
nomes = list(por_nome)

def achar_nome(n):
    nn = norm(n)
    if not nn: return None, "sem nome"
    if nn in por_nome:
        cs = por_nome[nn]
        if len(cs) == 1: return cs[0], "nome exato"
        # homônimos: prefere quem não está demitido
        at = [c for c in cs if not str(por_chapa[c]["SITUAÇÃO"]).upper().startswith("DEMIT")]
        if len(at) == 1: return at[0], "nome exato (homônimo demitido ignorado)"
        return None, f"nome repetido no cadastro ({len(cs)} chapas)"
    m = difflib.get_close_matches(nn, nomes, n=2, cutoff=0.9)
    if len(m) == 1 and len(por_nome[m[0]]) == 1: return por_nome[m[0]][0], "nome aproximado, conferir"
    return None, "não encontrado no cadastro"

# ---------- item do Anexo I sugerido por palavra-chave (sempre revisar)
REGRAS = [
    (r"VELOCIDADE", "10 ou 26", "Velocidade: 10 se excedeu até 20%, 26 se mais de 20%"),
    (r"PONTO|JORNADA|JORNANDA|REGISTR\w* .*PONTO|BATID", "8 (confirmar com DP)", "Registro de ponto / jornada"),
    (r"DIALOGO DE SEGURANCA", "6", "DDS"),
    (r"DIRETRIZ|DERETRIZ|DIRECIONAMENTO", "39", "Indisciplina / insubordinação"),
    (r"VEICULO DA EMPRESA PARA FINS|VIATURA PARA FINS|FINS DIVERSOS|FINS DIVERVOS", "11", "Uso de bem da empresa para fins alheios"),
    (r"ALTURA|ATERRAMENTO|REGRA DE OURO|CALCO|SINALIZ|\bEPC\b|ENERGIZAD", "17", "Procedimento com risco à segurança"),
    (r"CHEK ?LIST|CHECK ?LIST", "2", "Checklist / procedimento sem risco"),
    (r"PONTUALMENTE|ATRASO", "8", "Descumprir a jornada"),
    (r"SOBRE ?AVISO|CHAMADO DE EMERGENCIA|POCS|FOTOS|META|PROGRAMACAO", "7", "Prazos / atividades incompletas"),
    (r"FALT\w* .*(TREINAMENTO|EXAME)", "16", "Faltar a treinamento ou exame"),
    (r"FALT\w*|AUSENCIA|NAO COMPARECEU", "1", "Faltar sem justificativa"),
    (r"(EPI|EPC|LUVA|CAPACETE|PERNEIRA|COLETE|CINTO|TALABARTE|OCULOS|BOTA).*(VENCID|DANIFIC|NAO AUTORIZ)", "18", "EPI/EPC/ferramenta danificado ou vencido"),
    (r"\bEPI|\bEPIS|CAPACETE|PERNEIRA|COLETE|TALABARTE|CINTO DE SEGURANCA|LUVA", "35", "Não usar EPI"),
    (r"\bAPR\b|ANALISE PRELIMINAR", "25", "APR não feita ou incompleta"),
    (r"CELULAR|TELEFONE", "15", "Uso de celular"),
    (r"CRACHA", "4", "Crachá"),
    (r"\bDDS\b|DIALOGO DIARIO", "6", "DDS"),
    (r"CARONA", "30", "Carona"),
    (r"ALCOOL|EMBRIAG|BEBIDA|ENTORPEC|DROGA", "45", "Álcool ou drogas"),
    (r"AGREDI|AGRESSAO FISICA|BRIGA", "46", "Agressão física"),
    (r"AMEAC|AGRESSAO VERBAL|XING", "20", "Ameaça ou agressão verbal"),
    (r"DESRESPEIT|OFENS|PRECONCEIT|GROSSEIR|MAL EDUCAD", "14", "Desrespeito"),
    (r"INSUBORDIN|INDISCIPLIN|DESOBED|DIRETRIZES|ORDEM DO SUPERIOR|DETERMINACAO", "39", "Indisciplina / insubordinação"),
    (r"FUMAR|FUMANDO|CIGARRO", "5", "Fumar"),
    (r"ASSIN\w* .*(OUTR|POR ELE|NO LUGAR)", "34", "Assinar por outra pessoa"),
    (r"FALS|FRAUD|ADULTER|INFORMAC\w* INCORRET", "32", "Informação falsa em sistema"),
    (r"MULTA|INFRACAO DE TRANSITO|AUTUAC", "13", "Infração de trânsito"),
    (r"COMBUSTIVEL|EXTRAVI|DESVIO DE MATERIA|SUMIC", "29", "Desvio ou extravio de material"),
    (r"SESMT|NAO COMUNIC\w* .*(INCIDENTE|ACIDENTE)", "40", "Não comunicar incidente"),
    (r"AUSENTOU|SAIU ANTES|ABANDON|SEM AUTORIZACAO DO SUPERIOR|HORARIO", "8", "Descumprir a jornada"),
    (r"CHECK ?LIST", "2", "Checklist / procedimento sem risco"),
    (r"(PROCEDIMENTO|NORMA|POP).*(SEGURANCA|RISCO|ENERGIZ|ALTURA)|(SEGURANCA|RISCO).*(PROCEDIMENTO|NORMA)", "17", "Procedimento com risco à segurança"),
    (r"PRAZO|LEITURA|INCOMPLET|ATRAS|NAO ENTREG|ADERENCIA|PRESTACAO DE CONTAS|NOTA", "7", "Prazos / atividades incompletas"),
    (r"PROCEDIMENTO|PROCEDIMENTOS|OPERACIONAL", "2", "Procedimento sem risco à segurança"),
]
def sugerir_item(motivo):
    m = norm(motivo)
    if not m: return "", "sem motivo"
    for rx, item, desc in REGRAS:
        if re.search(rx, m): return item, desc
    return "", "não identificado"

def data(v):
    if v is None or (isinstance(v, float) and pd.isna(v)) or str(v).strip() in ("", "nan"): return pd.NaT
    try:
        return pd.Timestamp(v) if re.match(r"^\d{4}-\d{2}-\d{2}", str(v)) else pd.to_datetime(str(v).strip(), dayfirst=True)
    except Exception:
        return pd.NaT

def datas_texto(v):
    s = str(v or "")
    if s in ("", "nan"): return []
    iso = re.findall(r"\d{4}-\d{2}-\d{2}", s)
    if iso: return [pd.Timestamp(x) for x in iso]
    out = []
    for d, m, y in re.findall(r"(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?", s):
        y = y or "2026"; y = "20" + y if len(y) == 2 else y
        try: out.append(pd.Timestamp(int(y), int(m), int(d)))
        except Exception: pass
    return out

linhas = []

# ---------- CONTROLE
c = pd.read_excel(A + "6d930922-CONTROLE_MEDIDAS_DISCIPLINARES.xlsx", sheet_name="CONTROLE", header=1, dtype=str)
c.columns = [x.strip() for x in c.columns]
for i, r in c.iterrows():
    pend = []
    ch = chapa(r["CHAPA"]); como = ""
    if ch and ch in por_chapa:
        como = "chapa"
        ratio = difflib.SequenceMatcher(None, norm(r["NOME"]), por_chapa[ch]["nn"]).ratio()
        if ratio < 0.85: pend.append("nome na planilha diferente do cadastro para esta chapa")
    elif ch:
        ch2, como2 = achar_nome(r["NOME"])
        if ch2: pend.append(f"chapa {ch} não existe no cadastro; achado pelo nome ({como2})"); ch, como = ch2, "nome"
        else: pend.append(f"chapa {ch} não existe no cadastro"); como = "não ligado"
    else:
        ch, como2 = achar_nome(r["NOME"])
        pend.append("sem chapa na planilha" + (f"; achado pelo nome ({como2})" if ch else ""))
        como = "nome" if ch else "não ligado"
    med = str(r["MEDIDA APLICADA"] or "").strip().upper().replace("ADVERTENCIA", "ADVERTÊNCIA")
    sit = str(r["SITUAÇÃO"] or "").strip().upper()
    dt = data(r["DATA"])
    if pd.isna(dt): pend.append("sem data")
    if sit in ("EXCLUIR", "DESCONSIDERAR", "NÃO FOI APLICADA"): valid = "Não importar (" + sit.lower() + ")"
    elif med == "REORIENTAÇÃO": valid = "Orientação (não conta para reincidência)"
    else: valid = "Válida"
    doc = str(r["DOCUMENTO"] or "").strip().upper()
    if valid == "Válida" and doc == "PENDENTE": pend.append("documento assinado pendente")
    item, desc = sugerir_item(r["MOTIVO"])
    if not item: pend.append("item do Anexo I não identificado")
    dias = r["QTD DIAS"]
    linhas.append(dict(origem="CONTROLE", linha=i + 3, chapa=ch, ligado_por=como, nome_planilha=str(r["NOME"] or "").strip(),
        base=str(r["BASE"] or "").strip().upper().replace("BDB", "BDC"), ccusto=str(r["C.CUSTO"] or "").strip().upper(),
        data=dt, todas_datas="", qtd_datas=1 if not pd.isna(dt) else 0,
        medida=med.title().replace("Advertência", "Advertência"), dias=int(dias) if str(dias).strip().isdigit() else None,
        motivo=str(r["MOTIVO"] or "").strip(), item=item, item_desc=desc, documento=doc.title(), validade=valid,
        responsavel="", situacao_planilha=sit.title(), obs=str(r["obs"] or "").strip() if str(r["obs"]) != "nan" else "", pendencias="; ".join(pend)))

# ---------- PONTO
p = pd.read_excel(A + "938e9d9f-Medidas_PONTO.xlsx", sheet_name="PONTO", header=1, dtype=str)
p.columns = [x.strip() for x in p.columns]
for i, r in p.iterrows():
    pend = []
    ch, como2 = achar_nome(r["Nome"])
    como = "nome" if ch else "não ligado"
    if not ch: pend.append(como2)
    elif como2 != "nome exato": pend.append(como2)
    ds = datas_texto(r["Ponto Manual"])
    if not ds: pend.append("sem data")
    if len(ds) > 1: pend.append(f"{len(ds)} datas na mesma célula (separadas na coluna Todas as datas)")
    st = str(r["STATUS"] or "").strip()
    valid = "Válida" if st == "Aplicada" else "Não aplicada (não conta para reincidência)"
    linhas.append(dict(origem="PONTO", linha=i + 3, chapa=ch, ligado_por=como, nome_planilha=str(r["Nome"] or "").strip(),
        base=str(r["BASE"] or "").strip().upper(), ccusto=str(r["C.custo"] or "").strip().upper().replace("ALMOX", "ALMOXARIFADO").replace("ALMOXARIFADOARIFADO", "ALMOXARIFADO"),
        data=min(ds) if ds else pd.NaT, todas_datas="; ".join(d.strftime("%d/%m/%Y") for d in sorted(ds)), qtd_datas=len(ds),
        medida=str(r["Documento"] or "").strip().title(), dias=None, motivo="Esquecimento do registro de ponto",
        item="8 (confirmar com DP)", item_desc="Registro de ponto / jornada", documento="", validade=valid,
        responsavel=str(r["Responsável"] or "").strip(), situacao_planilha=st, obs="", pendencias="; ".join(pend)))

h = pd.DataFrame(linhas)
# dados do cadastro
for col, src in [("nome_cadastro", "NOME"), ("funcao", "FUNÇÃO"), ("secao", "SEÇÃO"), ("situacao_cadastro", "SITUAÇÃO")]:
    h[col] = h["chapa"].map(lambda x: por_chapa.get(x, {}).get(src, "") if x else "")
h["nome_cadastro"] = h["nome_cadastro"].fillna("").str.title()

# reincidência: mesmo item, válidas, nos 12 meses anteriores a cada ocorrência
h["item_base"] = h["item"].str.extract(r"^(\d+)")[0]
v = h[(h.validade == "Válida") & h.chapa.notna() & h.data.notna()].copy()
h["ultimos_12m"] = (h.validade == "Válida") & h.data.notna() & (h.data > HOJE - pd.Timedelta(days=365))
h["reinc_12m"] = 0
for idx, r in v.iterrows():
    if not r.item_base or r.item == "10 ou 26": continue
    q = v[(v.chapa == r.chapa) & (v.item_base == r.item_base) & (v.data < r.data) & (v.data >= r.data - pd.Timedelta(days=365))]
    h.at[idx, "reinc_12m"] = len(q)
pickle.dump(h, open(S + "hist.pkl", "wb"))
print(len(h)); print(h.ligado_por.value_counts().to_dict()); print(h.validade.value_counts().to_dict())
print(h.groupby("origem").ligado_por.value_counts().to_dict())
print("item vazio", (h.item == "").sum(), "itens", h.item.value_counts().head(12).to_dict())
print("ult12 válidas", h.ultimos_12m.sum(), "reinc>=2", (h.reinc_12m >= 2).sum())
print(h[h.item == ""].motivo.str.slice(0, 70).value_counts().head(25).to_string())
