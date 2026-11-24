# Trata as planilhas do RH para o Banco de talentos (aba Inscritos do Contratações CGB).
# Uso: python banco/talentos-tratar.py BANCO_RH.xlsx TRIAGEM_PcD.xlsx banco/talentos-cidades.json contratacoes-exportacao-talentos/talentos-novos.json [TABELA_ACOMPANHAMENTO.xlsx]
# Entrada: BANCO_RH_TRIAGEM_2.xlsx e TRIAGEM_PcD_1.xlsx. Saída: talentos-novos.json (formato do site) + relatório.
import sys, re, json, unicodedata, hashlib, datetime as dt
from openpyxl import load_workbook

A, B, CIDS, SAIDA = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
HOJE = dt.date(2026, 11, 24)
CID_XY = json.load(open(CIDS, encoding='utf-8'))

def sem(s): return unicodedata.normalize('NFD', str(s)).encode('ascii', 'ignore').decode()
def norm(s): return ' '.join(sem(s or '').upper().split())
def limpa(v):
    if v is None: return ''
    s = ' '.join(str(v).replace('\n', ' ').split()).strip(' ;,')
    return '' if norm(s) in ('', 'NONE', 'N/I', '-', '–') else s
def titulo(s):
    pequenas = {'DA', 'DE', 'DO', 'DAS', 'DOS', 'E', 'D'}
    out = []
    for i, w in enumerate(s.lower().split()):
        out.append(w if (i and w.upper() in pequenas) else w[:1].upper() + w[1:])
    return ' '.join(out)

AJUSTES = []   # o que foi corrigido (vai para o relatório)
def aj(fonte, nome, campo, antes, depois):
    if str(antes or '') != str(depois or ''): AJUSTES.append([fonte, nome, campo, str(antes or ''), str(depois or '')])

# ---------- datas ----------
def data(v, fonte='', nome=''):
    if v is None or v == '': return ''
    if isinstance(v, dt.datetime): d = v.date()
    elif isinstance(v, dt.date): d = v
    else:
        s = re.sub(r'\D', '', str(v))
        d = None
        cands = []
        if len(s) == 8: cands = [(s[:2], s[2:4], s[4:])]
        elif len(s) == 7: cands = [(s[:2], s[2:4], s[4:]), (s[:2], s[2:3], s[3:]), (s[:1], s[1:3], s[3:])]
        elif len(s) == 6: cands = [(s[:2], s[2:4], '20' + s[4:])]
        elif len(s) == 9: cands = [(s[:2], s[2:4], s[4:8])]
        for dd, mm, aa in cands:
            if len(aa) == 3: aa = '2' + aa if aa.startswith('0') else aa[:1] + '0' + aa[1:]   # 225 -> 2025, 026 -> 2026
            try:
                x = dt.date(int(aa), int(mm), int(dd))
                if 2018 <= x.year <= 2026: d = x; break
            except ValueError: pass
        aj(fonte, nome, 'data', v, d.isoformat() if d else '(inválida, ficou sem data)')
    if d and d > HOJE: return ''
    return d.isoformat() if d else ''

# ---------- telefone ----------
def tel(v, fonte='', nome=''):
    s = limpa(v)
    if not s: return ''
    d = re.sub(r'\D', '', s.split('/')[0])
    if d.startswith('55') and len(d) in (12, 13): d = d[2:]
    if d.startswith('0') and len(d) in (11, 12): d = d[1:]
    if len(d) == 11: f = f'({d[:2]}) {d[2:7]}-{d[7:]}'
    elif len(d) == 10: f = f'({d[:2]}) 9{d[2:6]}-{d[6:]}' if d[2] in '6789' else f'({d[:2]}) {d[2:6]}-{d[6:]}'
    elif len(d) == 9: f = f'{d[:5]}-{d[5:]}'
    else: f = s
    return f

# ---------- cidade ----------
CN = {norm(k): k for k in CID_XY}
ALIAS = {'PRESIDENTE DUTA': 'Presidente Dutra', 'SANTO ANTONIO DO LOPES': 'Santo Antônio dos Lopes', 'GUARACIABA ZONA RURAL DE BACABAL': 'Bacabal',
         'ZONA RURAL DE PDS': 'Pedreiras', 'BELA VISTA': 'Bela Vista do Maranhão', 'ANANINDEUA': 'Ananindeua - PA', 'BARCARENA': 'Barcarena - PA',
         'CAMOCIM': 'Camocim - CE', 'CORRENTINA BAHIA': 'Correntina - BA', 'CURRAL NOVO DO PIAUI': 'Curral Novo do Piauí', 'GOIANIA': 'Goiânia - GO',
         'GRANJA': 'Granja - CE', 'IPORA': 'Iporá - GO', 'JEQUIE': 'Jequié - BA', 'JI-PARANA': 'Ji-Paraná - RO', 'LAGOA DO PIAUI': 'Lagoa do Piauí',
         'MARABA': 'Marabá - PA', 'OEIRAS': 'Oeiras - PI', 'OURICURI': 'Ouricuri - PE', 'PETROLINA': 'Petrolina - PE', 'PORTEL': 'Portel - PA',
         'RIO VERDE': 'Rio Verde - GO', 'SALVADOR': 'Salvador - BA', 'SAO BENEDITO DO RIO PRETO': 'São Benedito do Rio Preto', 'SAO JOSE DO BEL MONTE': 'São José do Belmonte - PE',
         'SERRA TALHADA': 'Serra Talhada - PE', 'TERESINA': 'Teresina/PI', 'TIMON': 'Timon', 'VILA BOA': 'Vila Boa - GO', 'SANTA INES': 'Santa Inês', 'SAO LUIS': 'São Luís', 'SAAO LUIS': 'São Luís', 'SAO LUIS GONZAGA': 'São Luís Gonzaga do Maranhão',
         'SAO LUIS GONZAGA DO MA': 'São Luís Gonzaga do Maranhão', 'SAO LUIS GONZAGA DO': 'São Luís Gonzaga do Maranhão', 'POVOADO JAPAOZINHO': 'Gonçalves Dias', 'SANTAREM': 'Santarém - PA', 'ITAPECURU': 'Itapecuru Mirim', 'ITAPERCURU MIRIM': 'Itapecuru Mirim',
         'ITAPECURU MIRIN': 'Itapecuru Mirim', 'ITAPECURU-MIRIM': 'Itapecuru Mirim', 'PINDARE MIRIM': 'Pindaré-Mirim', 'PINDARE': 'Pindaré-Mirim',
         'ALTAMIRA': 'Altamira do Maranhão', 'ALTO ALEGRE': 'Alto Alegre do Maranhão', 'ALTO-ALEGRE': 'Alto Alegre do Maranhão',
         'TUMTUM': 'Tuntum', 'IGUARAPE GRANDE': 'Igarapé Grande', 'PIO XLL': 'Pio XII', 'CODO': 'Codó', 'COROATA': 'Coroatá',
         'ESPERANTINOPOLIS': 'Esperantinópolis', 'TRIZIDELA O VALE': 'Trizidela do Vale', 'SANTA FILOMENA': 'Santa Filomena do Maranhão',
         'SAO DOMINGOS': 'São Domingos do Maranhão', 'SAO MATEUS': 'São Mateus do Maranhão', 'PASSO DO LUMIAR': 'Paço do Lumiar',
         'VITORIA DO MEARIM': 'Vitória do Mearim', 'ZE DOCA': 'Zé Doca', 'PERITORO': 'Peritoró', 'BARRERINHAS': 'Barreirinhas',
         'ACAILANDA': 'Açailândia', 'ACAILANDIA': 'Açailândia', 'PRESIDENTE SARNEY': 'Presidente Sarney', 'TUTOIA': 'Tutóia',
         'SANTA LUZIA DO PARUA': 'Santa Luzia do Paruá', 'BARREIRINHAS': 'Barreirinhas', 'BALSAS': 'Balsas', 'TIMON': 'Timon',
         'MARACACUME': 'Maracaçumé', 'PASSAGEM FRANCA': 'Passagem Franca', 'SANTA CRUZ': 'Santa Cruz', 'BELEM': 'Belém - PA',
         'FORTALEZA CEARA': 'Fortaleza - CE', 'RIO VERDE GOIAS': 'Rio Verde - GO', 'GOIAS': 'Goiás', 'BAHIA': 'Bahia', 'PIAUI': 'Piauí'}
UFS = {'MA', 'PA', 'PI', 'CE', 'BA', 'TO', 'GO', 'PB', 'PE', 'RJ', 'RS', 'RO', 'SC', 'PR', 'MT', 'AP', 'AL', 'AM'}
def cidade(v, fonte='', nome=''):
    s = limpa(v)
    if not s: return ''
    orig = s
    s = re.split(r'\s/\s', s)[0]                                   # "Pedreiras-MA / Barra do Corda-MA" -> a primeira
    m = re.match(r'^(POV(OADO|\.)?\s+[^/(,]+)[/(,]\s*([^)]+)\)?$', norm(s))   # "Povoado Brejinho/Bacabal" -> Bacabal
    if m: s = m.group(3)
    m = re.match(r'^POV(OADO|\.)?\s+.*?\s((GONCALVES DIAS|MIRADOR|BACABAL).*)$', norm(s))
    if m: s = m.group(2)
    s = re.sub(r'^CENTRO,\s*', '', s, flags=re.I)
    s = re.sub(r'^PONTA DE SANTANA-', '', s, flags=re.I)
    uf = ''
    m = re.search(r'[\s\-–/,(]+\s*([A-Za-z]{2})\.?\)?\s*$', s)
    if m and m.group(1).upper() in UFS: uf = m.group(1).upper(); s = s[:m.start()]
    k = norm(s).strip(' -–')
    k = re.sub(r'\s*-\s*', '-', k) if k.startswith('ITAPECURU') or k.startswith('GUAJARA') else k
    if k in CN: r = CN[k]
    elif k in ALIAS: r = ALIAS[k]
    elif k.replace('-', ' ') in CN: r = CN[k.replace('-', ' ')]
    elif k.replace('-', ' ') in ALIAS: r = ALIAS[k.replace('-', ' ')]
    else:
        so = ' '.join(s.split()).strip(' -–')
        r = titulo(re.sub(r'\s*-\s*', ' - ', so) if 'GUAJAR' in norm(so) else so)
        if uf and uf != 'MA': r += ' - ' + uf
    if r in CID_XY or (uf in ('', 'MA') and ' - ' not in r): pass
    aj(fonte, nome, 'cidade', orig, r)
    return r

# ---------- função ----------
FUNC = [
    (r'^(AUX(ILIAR|\.)?\s*(DE\s*)?)?ELE?R?I?C?I?S?T?A$|^ELERICISTA$|^ELETRCISTA$|^ELETRICSTA$|^ELETRICISTA$', None),
]
def funcao(v, fonte='', nome=''):
    s = limpa(v)
    if not s: return ''
    k = norm(s).replace('.', '. ').replace('  ', ' ')
    k = ' '.join(k.split())
    regras = [
        (r'LINHA VIVA|\bLV\b', 'Eletricista de Linha Viva' if not k.startswith('ENC') else 'Encarregado de Linha Viva'),
        (r'^(AUX(ILIAR|\.)?)( DE)? ELE', 'Auxiliar de Eletricista'),
        (r'^ELE[A-Z]*C[A-Z]*STA( DE REDE)?$', 'Eletricista'),
        (r'^(AUX(ILIAR|\.)?)( DE)? ALMOX|^ALMOXARIF', 'Auxiliar de Almoxarifado'),
        (r'^ANALISTA DE ALMOX', 'Analista de Almoxarifado'),
        (r'^(AUX(ILIAR|\.)?)( DE)? ADM|^ADMINISTRATIVO$', 'Auxiliar Administrativo'),
        (r'^ASSIST(ENTE|\.)? ADM', 'Assistente Administrativo'),
        (r'^ANALISTA DE RH', 'Analista de RH'),
        (r'^(AUX(ILIAR|\.)?)( DE)? PROJETISTA', 'Auxiliar de Projetista'),
        (r'^(AUX(ILIAR|\.)?)( DE)? FROTA', 'Auxiliar de Frota'),
        (r'SERVI[CÇ]OS? ?GERAIS|^ASG$', 'Auxiliar de Serviços Gerais'),
        (r'CARRETEIRO', 'Motorista Carreteiro'),
        (r'GUINDAUTO', 'Motorista Operador de Guindauto'),
        (r'GUI[N]?CHO', 'Motorista Operador de Guincho'),
        (r'^MOTORI?S?TA$', 'Motorista'),
        (r'^ENC(ARREGADO)?( (OP|OPERACIONAL|OCUPACIONAL))?$', 'Encarregado Operacional'),
        (r'^SUPERVISOR', 'Supervisor Operacional'),
        (r'ENFERMAGEM', 'Técnico de Enfermagem'),
        (r'SEG(URAN[CÇ]A|URACDA|\.)?( DO)? TRAB|^SEGURANCA DO TRABALHO$', 'Técnico de Segurança do Trabalho'),
        (r'PLANEJAMENTO', 'Técnico de Planejamento'),
        (r'MEDICAO', 'Técnico de Medição'),
        (r'FI[S]?CAL QUALIDADE', 'Auxiliar de Fiscal de Qualidade'),
        (r'^MECANICO', 'Mecânico'),
        (r'^LEVANTADOR', 'Levantador'),
        (r'^VIGIA', 'Vigia'),
        (r'^PODADOR', 'Podador'),
        (r'^ESTAGIARIO', 'Estagiário'),
        (r'^ENGENHARIA', 'Engenharia de Produção'),
        (r'^SESMT$', 'SESMT'),
    ]
    if ',' in k:   # várias funções: padroniza cada uma
        r = ', '.join(dict.fromkeys(funcao(p, '', '') for p in s.split(',') if limpa(p)))
        aj(fonte, nome, 'função', s, r); return r
    for rx, nome_f in regras:
        if re.search(rx, k):
            aj(fonte, nome, 'função', s, nome_f); return nome_f
    r = titulo(k); aj(fonte, nome, 'função', s, r); return r

def setor(v):
    k = norm(limpa(v))
    return {'ADMNISTRATIVO': 'ADMINISTRATIVO', 'ESTAGIO': 'ESTÁGIO', 'ALMOXARIFE': 'ALMOXARIFADO', 'ADM': 'ADMINISTRATIVO'}.get(k, limpa(v).upper())

def cnh(v):
    k = norm(limpa(v)).replace(' ', '').replace('/', '')
    if not k or re.search(r'\d{4}', k) or k in ('NAOPOSSUI', 'NAO'): return ''
    k = k.replace('(P)', '')
    return k if re.fullmatch(r'[A-E]{1,3}', k) else ''

def cert(v):
    if isinstance(v, (dt.date, dt.datetime)): return 'OK'
    k = norm(limpa(v))
    return {'ANALISE': 'EM ANÁLISE', 'ANALISAR': 'EM ANÁLISE', 'NOK': 'NÃO OK', 'NAO OK': 'NÃO OK', 'N/A': 'N/A'}.get(k, limpa(v).upper())

def st_padrao(v):
    k = norm(limpa(v))
    m = {'REPROVADA': 'REPROVADO', 'ANDAMENTO': 'EM ANDAMENTO', 'CERTIFICADOS OK': 'CERTIFICADO OK', 'OK': 'APROVADO NA TRIAGEM',
         'CONTRATANDO': 'EM CONTRATAÇÃO', 'ANALISE E TESTE': 'EM ANÁLISE E TESTE', 'EM ANALISE': 'EM ANÁLISE', 'CONCLUIDO': 'CONTRATADO (processo concluído)',
         'DESISTENTE': 'DESISTIU', 'ADMITIDO': 'ADMITIDO', 'AGUARDANDO DOCUMENTACAO': 'AGUARDANDO DOCUMENTAÇÃO'}
    return m.get(k, limpa(v).upper())

def email(v):
    s = limpa(v).lower().replace(' ', '')
    return s if re.fullmatch(r'[^@\s]+@[^@\s]+\.[a-z.]+', s) else ''

def nome_ok(v): return ' '.join(str(v or '').upper().split())

# ---------- leitura ----------
REG = []   # (pessoa-base, hist)
def add(fonte, nome, d, tel_, mail, cid, cnh_, tags, h):
    n = nome_ok(nome)
    if not n or len(n) < 4: return
    h = {k: v for k, v in {'d': d, 'fonte': fonte, **h}.items() if v}
    REG.append({'nome': n, 'tel': tel_, 'email': mail, 'cidade': cid, 'cnh': cnh_, 'tags': tags, 'h': h})

F1 = 'Banco RH 2 (triagem)'
ws = load_workbook(A, data_only=True)['BANCO DE RH 2 ( TRIAGEM)']
for r in ws.iter_rows(min_row=3, values_only=True):
    if not r[1]: continue
    n = nome_ok(r[1]); obs = limpa(r[11]); sit = st_padrao(r[10])
    t = tel(r[7], F1, n)
    if not t and re.search(r'\d{8}', str(r[8] or '')): t = tel(r[8], F1, n); aj(F1, n, 'telefone (estava na coluna CNH)', r[8], t)
    if not sit and re.search(r'REPROVAD', norm(obs)): sit = 'REPROVADO'
    tags = ['excgb'] if re.search(r'EX[ -]?FUNCION', norm(obs)) else []
    add(F1, n, data(r[0], F1, n), t, email(r[9]), cidade(r[5], F1, n), cnh(r[8]), tags,
        {'funcao': funcao(r[3], F1, n), 'area': setor(r[2]), 'cert': cert(r[4]), 'st': sit, 'resp': titulo(limpa(r[6])) if limpa(r[6]) else '', 'obs': obs.capitalize() if obs.isupper() else obs})

wb = load_workbook(B, data_only=True)
F2 = 'Triagem de candidatos 2026'
BASE = {'PDT': 'Presidente Dutra', 'BACABAL': 'Bacabal', 'SANTA INES': 'Santa Inês', 'BARRA DO CORDA': 'Barra do Corda', 'ITAPECURU': 'Itapecuru Mirim', 'PEDREIRAS': 'Pedreiras'}
ok_ = lambda v: limpa(v).upper()
for r in wb['TRIAGEM'].iter_rows(min_row=3, values_only=True):
    if not r[4]: continue
    n = nome_ok(r[4]); sit = st_padrao(r[9])
    integ = norm(limpa(r[25]))
    if integ == 'CONCLUIDA': sit = 'CONTRATADO (integração concluída)'
    etapas = [('Psicológico', r[13]), ('Direção defensiva', r[14]), ('Jurídico', r[19]), ('Bernhorft', r[21]), ('RP', r[22]), ('Doc. DP', r[23]), ('ASO', r[24]), ('Integração', r[25])]
    resumo = ' · '.join(f'{k}: {ok_(v).capitalize()}' for k, v in etapas if limpa(v))
    base = BASE.get(norm(limpa(r[2])), titulo(limpa(r[2])))
    obs = '; '.join(x for x in [('Base ' + base) if base else '', ('Motivo: ' + limpa(r[8])) if limpa(r[8]) else '', resumo, limpa(r[26]).capitalize()] if x)
    c = norm(limpa(r[16]))
    add(F2, n, data(r[1], F2, n), '', '', '', '' if c in ('', 'NAO POSSUI') else c.replace('/', ''), ['pcd'] if norm(limpa(r[3])) == 'PCD' or norm(limpa(r[26])) == 'PCD' else [],
        {'funcao': funcao(r[5], F2, n), 'area': setor(r[7] or r[3]), 'cert': cert(r[11]), 'st': sit, 'resp': ('Solicitante ' + titulo(limpa(r[6]))) if limpa(r[6]) else '', 'obs': obs})

F3 = 'Requisição de vagas 2026'
for r in wb['REQUISIÇÃO'].iter_rows(min_row=4, values_only=True):
    if not r[2]: continue
    n = nome_ok(r[2]); stt = norm(limpa(r[15])); ob = limpa(r[16])
    sit = 'DESISTIU' if 'DESISTIU' in norm(ob) else {'ABERTO': 'EM ANDAMENTO (requisição aberta)', 'CANCELADO': 'CANCELADO', 'FECHADO': 'REQUISIÇÃO FECHADA'}.get(stt, '')
    et = [('Certificado', r[6]), ('Psi', r[7]), ('Direção', r[8]), ('Jurídico', r[9]), ('Bernhorft', r[10]), ('RP', r[11]), ('Doc. DP', r[12]), ('ASO', r[13]), ('Integração', r[14])]
    def ev(v):
        if isinstance(v, dt.datetime): return v.strftime('%d/%m')
        d_ = data(v, F3, n); return (d_[8:] + '/' + d_[5:7]) if d_ else limpa(v).capitalize()
    resumo = ' · '.join(f'{k} {ev(v)}' for k, v in et if limpa(v))
    if norm(limpa(r[14])) and isinstance(r[14], dt.datetime) and r[14].date() <= HOJE: sit = 'CONTRATADO (integração feita)'
    obs = '; '.join(x for x in [('Etapas: ' + resumo) if resumo else '', ('Prazo ' + ev(r[4])) if limpa(r[4]) else '', ob.capitalize() if ob.isupper() else ob] if x)
    add(F3, n, data(r[3], F3, n), '', '', '', '', [], {'funcao': funcao(r[1], F3, n), 'st': sit, 'resp': ('Solicitante ' + titulo(limpa(r[5]))) if limpa(r[5]) else '', 'obs': obs})

F4 = 'Triagem PcD 2026'
for r in wb['CONTROLE PCD'].iter_rows(min_row=3, values_only=True):
    if not r[1]: continue
    n = nome_ok(r[1]); lc = limpa(r[4])
    fn = '' if norm(lc) in ('', 'OK', 'NOK') else funcao(lc, F4, n)
    if fn: aj(F4, n, 'função (estava na coluna Laudo do candidato)', lc, fn)
    sit = st_padrao(r[8])
    if sit == 'PENDENTE': sit = 'EM ANÁLISE (PcD)'
    if sit in ('ENQUADRADO', 'REABILITADO'): sit = sit + ' (PcD)'
    ob = limpa(r[10])
    obs = '; '.join(x for x in [('Deficiência ' + limpa(r[2]).lower()) if limpa(r[2]) else '', ('Entrevista ' + data(r[3], F4, n)[8:] + '/' + data(r[3], F4, n)[5:7]) if data(r[3], F4, n) else '',
                                ('Laudo do candidato ' + ok_(lc).lower()) if norm(lc) in ('OK', 'NOK') else '', ('Laudo caracterizador ' + limpa(r[6]).lower()) if limpa(r[6]) else '',
                                ('Jurídico ' + limpa(r[7]).lower()) if limpa(r[7]) else '', ob[:1].upper() + ob[1:] if ob else ''] if x)
    add(F4, n, data(r[0], F4, n), tel(r[9], F4, n), '', cidade(r[5], F4, n), '', ['pcd'], {'funcao': fn, 'st': sit, 'obs': obs})

# ---------- Tabela de acompanhamento (FINALIZADOS + ACOMPANHAMENTO) ----------
if len(sys.argv) > 5:
    wbc = load_workbook(sys.argv[5], data_only=True)
    BASES = {'PDT': 'Presidente Dutra', 'STI': 'Santa Inês', 'BDC': 'Barra do Corda', 'BCB': 'Bacabal', 'ITM': 'Itapecuru Mirim', 'ITAPECURU': 'Itapecuru Mirim', 'PDS': 'Pedreiras'}
    ETP = [(11, 'Currículo/certificados'), (12, 'Entrevista'), (13, 'Teste de atenção'), (14, 'Direção defensiva'), (15, 'CNH'), (16, 'Link'),
           (17, 'Bernhoeft'), (18, 'Jurídico'), (19, 'RP'), (20, 'Documentação'), (21, 'ASO'), (22, 'Integração CGB'), (23, 'Integração Equatorial')]
    def ev(v, f, n):
        if isinstance(v, (dt.datetime, dt.date)): return v.strftime('%d/%m')
        k = norm(limpa(v))
        return {'NOK': 'não ok', 'NA': 'n/a', 'X': 'feito', 'OK': 'ok'}.get(k, limpa(v).lower())
    for aba, F in [('FINALIZADOS', 'Acompanhamento RH · finalizados'), ('ACOMPANHAMENTO ', 'Acompanhamento RH · em andamento')]:
        for r in wbc[aba].iter_rows(min_row=2, values_only=True):
            r = list(r[:25]) + [None] * max(0, 25 - len(r))
            n = nome_ok(r[10])
            if not n or norm(n) in ('A CONTRATAR', 'CANDIDATO'): continue
            sit, ob = norm(limpa(r[3])), limpa(r[24])
            nok = [nm for j, nm in ETP if norm(limpa(r[j])) in ('NOK', 'INAPTO') or norm(limpa(r[j])).startswith('NAO COMPARECEU')]
            adm = re.search(r'ADMI(TID|SS)[A-Z]*\s*(CGB\s*)?(\d{1,2}/\d{1,2}(/\d{2,4})?)?', norm(ob))
            if sit.startswith('CONCLU'):
                st = ('ADMITIDO' + (' em ' + adm.group(3) if adm and adm.group(3) else '')) if adm or isinstance(r[22], (dt.datetime, dt.date)) or norm(limpa(r[22])) == 'OK' else 'CONTRATADO (processo concluído)'
            elif sit.startswith('CANC') or sit.startswith('CAND'):
                st = ('REPROVADO (' + ', '.join(nok).lower() + ')') if nok else ('DESISTIU' if re.search(r'DESIST|NAO TEM INTERE|NAO QUIS|NAO ACEIT', norm(ob)) else 'CANCELADO')
            elif sit.startswith('DESIST'): st = 'DESISTIU'
            elif sit.startswith('SUSP'): st = 'SUSPENSO'
            else: st = 'EM ANDAMENTO' + (' (pendência: ' + ', '.join(nok).lower() + ')' if nok else '')
            mres = re.search(r'RESID[EI]\s+(EM|NO|NA)\s+(.+)$', norm(ob))
            cid = ''
            if mres:
                raw = re.split(r'\s*(\(|/|;|,|\d|\bVERIFICAR\b|\bSO TEM\b|\bCANDIDATO\b|\.| - | – )', mres.group(2))[0].strip()
                raw = {'PRESIDEBTE DUTRA': 'PRESIDENTE DUTRA', 'PIDARE MIRIM': 'PINDARE MIRIM', 'CANTANHEIDE': 'CANTANHEDE', 'GUAJAU': 'GRAJAU',
                       'SAO BENEDITO DO RIO PETRO': 'SAO BENEDITO DO RIO PRETO', 'PI': ''}.get(raw, raw)
                cid = '' if not raw else cidade({'PDT': 'Presidente Dutra', 'STI': 'Santa Inês', 'BDC': 'Barra do Corda'}.get(raw, raw), F, n)
            base = BASES.get(norm(limpa(r[8])), titulo(limpa(r[8])) if limpa(r[8]) else '')
            mot = limpa(r[9]).upper()
            tags = ['excgb'] if re.search(r'EX[ -]?(COLABORADOR|FUNCION)', norm(ob)) else []
            if 'PCD' in mot: tags.append('pcd')
            if 'ESCOLINHA' in norm(limpa(r[11])): tags.append('escola')
            etapas = ' · '.join(f'{nm} {ev(r[j], F, n)}' for j, nm in ETP if limpa(r[j]))
            obs = '; '.join(x for x in [('CT ' + str(r[1]).strip()) if limpa(r[1]) else '', ('Base ' + base) if base else '', ('Motivo: ' + mot.capitalize()) if mot else '',
                                        etapas, (ob[:1].upper() + ob[1:].lower()) if ob else ''] if x)
            c = cert(r[11]) if limpa(r[11]) else ''
            c = 'OK' if c.startswith('OK') else c
            add(F, n, data(r[2] or r[0], F, n), '', '', cid, '', tags,
                {'funcao': funcao(r[4], F, n), 'area': setor(r[6]), 'cert': c, 'st': st, 'resp': ('Solicitante ' + titulo(limpa(r[5]))) if limpa(r[5]) else '', 'obs': obs})

# ---------- junta por pessoa ----------
def chave(n): return norm(n)
P, dup_linhas = {}, 0
for x in REG:
    k = chave(x['nome'])
    p = P.setdefault(k, {'nome': x['nome'], 'tel': '', 'email': '', 'cidade': '', 'cnh': '', 'tags': [], 'hist': []})
    for c in ('tel', 'email', 'cidade', 'cnh'):
        if x[c] and not p[c]: p[c] = x[c]
    for t in x['tags']:
        if t not in p['tags']: p['tags'].append(t)
    if x['h'] in p['hist']: dup_linhas += 1; continue
    p['hist'].append(x['h'])
# mesma pessoa com nome escrito diferente: mesmo telefone + primeiro e último nome iguais
por_tel = {}
for k, p in list(P.items()):
    d = re.sub(r'\D', '', p['tel'])
    if len(d) >= 10: por_tel.setdefault(d, []).append(k)
uniu = []
for d, ks in por_tel.items():
    if len(ks) < 2: continue
    base = ks[0]
    for k in ks[1:]:
        a, b = base.split(), k.split()
        import difflib
        dif = [(x, y) for x, y in zip(a, b) if x != y]
        digitacao = len(a) == len(b) and len(dif) == 1 and difflib.SequenceMatcher(None, *dif[0]).ratio() >= 0.75
        if a[0] == b[0] and (set(a) <= set(b) or set(b) <= set(a) or digitacao):
            q = P.pop(k); p = P[base]
            if len(q['nome']) > len(p['nome']): p['nome'] = q['nome']
            for c in ('email', 'cidade', 'cnh'):
                if q[c] and not p[c]: p[c] = q[c]
            p['tags'] += [t for t in q['tags'] if t not in p['tags']]
            p['hist'] += [h for h in q['hist'] if h not in p['hist']]
            uniu.append([base, k, p['tel']])
L = []
for k, p in P.items():
    p['hist'].sort(key=lambda h: h.get('d', ''), reverse=True)
    p['id'] = 't' + hashlib.sha1(k.encode()).hexdigest()[:10]
    L.append({'id': p['id'], 'nome': p['nome'], 'tel': p['tel'], 'email': p['email'], 'cidade': p['cidade'], 'cnh': p['cnh'], 'tags': p['tags'], 'hist': p['hist']})
L.sort(key=lambda p: p['nome'])
json.dump({'gerado': HOJE.isoformat(), 'fontes': sorted({x['h']['fonte'] for x in REG}), 'pessoas': L}, open(SAIDA, 'w', encoding='utf-8'), ensure_ascii=False)
json.dump({'ajustes': AJUSTES, 'uniu': uniu, 'linhas': len(REG), 'linhas_repetidas': dup_linhas}, open(SAIDA.replace('.json', '-ajustes.json'), 'w', encoding='utf-8'), ensure_ascii=False)
from collections import Counter
print('linhas lidas', len(REG), '| linhas repetidas removidas', dup_linhas, '| pessoas', len(L), '| unidas pelo telefone', len(uniu))
print('por fonte', Counter(h['fonte'] for p in L for h in p['hist']))
print('pessoas em mais de uma planilha', sum(1 for p in L if len({h['fonte'] for h in p['hist']}) > 1))
print('PcD', sum(1 for p in L if 'pcd' in p.get('tags', [])), '| ex-CGB', sum(1 for p in L if 'excgb' in p.get('tags', [])))
print('sem telefone', sum(1 for p in L if not p.get('tel')), '| sem cidade', sum(1 for p in L if not p.get('cidade')))
print('cidades fora da lista do site', Counter(p['cidade'] for p in L if p.get('cidade') and p['cidade'] not in CID_XY).most_common(60))
print('funções', Counter(h.get('funcao', '∅') for p in L for h in p['hist']).most_common(60))
print('situações', Counter(h.get('st', '∅') for p in L for h in p['hist']).most_common(40))
print('ajustes', Counter(a[2] for a in AJUSTES))
