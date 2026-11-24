# Converte a TABELA DE ACOMPANHAMENTO do RH em candidatos e vagas do Contratações CGB (telas Início, Candidatos,
# Agenda, Vagas, Histórico e Painel). Uso:
#   python banco/processos-tratar.py TABELA_ACOMPANHAMENTO.xlsx banco/talentos-cidades.json contratacoes-exportacao-processos/processos.json
# Usa as mesmas regras de padronização do banco de talentos (talentos-tratar.py: função, cidade, datas).
import sys, re, json, hashlib, datetime as dt, os
from collections import Counter
from openpyxl import load_workbook

ARGS = sys.argv[1:4]
CIDS = ARGS[1]
# reaproveita as funções de padronização do tratamento do banco de talentos
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'talentos-tratar.py'), encoding='utf-8').read()
src = src.split('# ---------- leitura ----------')[0]
sys.argv = [sys.argv[0], '', '', CIDS, '']
exec(src)
TAB, CIDS, SAIDA = ARGS

HOJE = dt.date(2026, 11, 24)
H = HOJE.isoformat()
BASES = {'BACABAL': 'BACABAL', 'BCB': 'BACABAL', 'SANTA INES': 'SANTA INÊS', 'STI': 'SANTA INÊS', 'PEDREIRAS': 'PEDREIRAS', 'PDS': 'PEDREIRAS',
         'PRESIDENTE DUTRA': 'PRESIDENTE DUTRA', 'PDT': 'PRESIDENTE DUTRA', 'BARRA DO CORDA': 'BARRA DO CORDA', 'BDC': 'BARRA DO CORDA',
         'ITAPECURU': 'ITAPECURU', 'ITAPECURU MIRIM': 'ITAPECURU', 'ITM': 'ITAPECURU'}
MOT = [(r'PCD', 'COTA PCD'), (r'^MOB', 'MOBILIZAÇÃO'), (r'SUBST', 'SUBSTITUIÇÃO'), (r'AUMENTO', 'AUMENTO NO QUADRO'), (r'BANCO', 'BANCO RH')]
SETOR = {'SEMST': 'SESMT', 'ADMINISTRATIVO': 'ADM', 'ALMOXARIFE': 'ALMOXARIFADO'}
CC = {'CONST.': 'CONSTRUÇÃO', 'CONST': 'CONSTRUÇÃO', 'ADM': 'ADMINISTRATIVO'}
# colunas da tabela -> etapas do site (chave, se tem agenda)
COL = {'CURRICULOS E CERTIFICADOS': ('cv', False), 'ENTREVISTAS': ('ent', True), 'TESTE DE ATENCAO': ('ta', True), 'DIRECAO DEFENSIVA': ('dd', True),
       'CNH': ('cnh', False), 'LINK': ('link', False), 'ANALISE BERNHOEFT': ('bern', False), 'ANALISE JURIDICO': ('jur', False),
       'REQUISICAO DE PESSOAS': ('req', False), 'DOCUMENTACAO PESSOAL': ('doc', False), 'ASO ADMISSIONAL': ('aso', True),
       'INTEGRACAO CGB': ('icgb', True), 'INTEGRACAO EQTL': ('ieqtl', True)}
ORDEM = ['cv', 'link', 'cnh', 'ent', 'ta', 'dd', 'bern', 'jur', 'req', 'doc', 'aso', 'icgb', 'ieqtl']
NOME_ET = {'cv': 'Currículo e certificados', 'link': 'Cadastro (link)', 'cnh': 'CNH', 'ent': 'Entrevista', 'ta': 'Teste de atenção', 'dd': 'Direção defensiva',
           'bern': 'Bernhoeft', 'jur': 'Análise interna', 'req': 'RP', 'doc': 'Documentação', 'aso': 'ASO', 'icgb': 'Integração CGB', 'ieqtl': 'Integração EQTL'}
AVISOS = []

def iso(v):
    if isinstance(v, dt.datetime): return v.date().isoformat()
    if isinstance(v, dt.date): return v.isoformat()
    return ''
def data_txt(t):
    """'ADMITIDO 05/01/2026', '23/11 - DP', 'REFAZER 28/08' -> data ISO (ano 2026 quando falta)"""
    m = re.search(r'(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?', t or '')
    if not m: return ''
    a = m.group(3) or '2026'; a = '20' + a[-2:] if len(a) <= 3 else a
    try:
        d = dt.date(int(a), int(m.group(2)), int(m.group(1)))
        return d.isoformat() if 2024 <= d.year <= 2027 else ''
    except ValueError: return ''

def etapa(k, ag, v, andamento):
    """valor da célula -> {s, d, t} do site"""
    if isinstance(v, (dt.datetime, dt.date)):
        d = iso(v)
        if ag and andamento: return {'s': 'ag', 'd': d}
        if d > H: return {'s': 'ag', 'd': d}
        return {'s': 'ok', 'd': d}
    t = limpa(v)
    if not t or t in (',,', '?', '-', '–'): return None
    k_ = norm(t)
    if k_ in ('OK', 'X', 'OK.'): return {'s': 'ok'}
    if k_ in ('NOK', 'NAO OK', 'INAPTO', 'REPROVADO'): return {'s': 'nok'}
    if k_ in ('NA', 'N/A', 'NAO SE APLICA'): return {'s': 'na'}
    if k_.startswith('OK'):
        r = t[2:].strip(' -_:').capitalize()
        return {'s': 'ok', 't': r} if r else {'s': 'ok'}
    if 'NAO COMPARECEU' in k_: return {'s': 'nok', 't': 'Não compareceu'}
    if k == 'cnh':
        if 'PROVIS' in k_ or k_ == 'P': return {'s': 'pend', 't': 'CNH provisória: conferir'}
        if 'VENCIDA' in k_: return {'s': 'nok', 't': 'CNH vencida'}
        if re.fullmatch(r'[A-E]{1,2}', k_): return {'s': 'ok', 't': 'Categoria ' + k_}
    d = data_txt(t)
    r = {'s': 'ag' if (ag and andamento and d) else 'pend', 't': t[:120]}
    if d: r['d'] = d
    return r

def mot(v):
    k = norm(limpa(v))
    for rx, m in MOT:
        if re.search(rx, k): return m
    return ''

def base_de(v):
    k = norm(limpa(v))
    return BASES.get(k, '')

wb = load_workbook(TAB, data_only=True)
cands, ids = [], Counter()
for aba in ['FINALIZADOS', 'ACOMPANHAMENTO ']:
    ws = wb[aba]
    cab = [norm(limpa(c.value)) for c in ws[1]]
    ix = {h: i for i, h in enumerate(cab) if h}
    g = lambda r, h: r[ix[h]] if h in ix and ix[h] < len(r) else None
    for n_lin, r in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        nome = nome_ok(g(r, 'CANDIDATO'))
        if not nome or norm(nome) in ('A CONTRATAR', 'CANDIDATO'): continue
        sit_t = norm(limpa(g(r, 'SITUACAO')))
        obs = limpa(g(r, 'OBS'))
        if sit_t.startswith('CONCLU'): sit = 'concluido'
        elif sit_t.startswith('CANC') or sit_t.startswith('CAND') or sit_t.startswith('DESIST'): sit = 'cancelado'
        elif sit_t.startswith('SUSP'): sit = 'suspenso'
        elif sit_t.startswith('EM AND'): sit = 'andamento'
        else:
            sit = 'andamento' if aba.startswith('ACOMP') else 'cancelado'
            AVISOS.append([aba.strip(), n_lin, nome, 'Situação em branco', f'considerado {"em andamento" if sit == "andamento" else "cancelado"}'])
        et = {}
        for h, (k, ag) in COL.items():
            if h in ix:
                e = etapa(k, ag, g(r, h), sit == 'andamento')
                if e: et[k] = e
        # datas
        datas = sorted(x.get('d') for x in et.values() if x.get('d'))
        d0 = iso(g(r, 'DATA')) or iso(g(r, 'DATA ABERTURA')) or (datas[0] if datas else '')
        if not d0: AVISOS.append([aba.strip(), n_lin, nome, 'Sem data de abertura nem datas nas etapas', 'fica sem data de abertura'])
        c = {'nome': nome, 'ct': str(limpa(g(r, 'CT'))).split('.')[0], 'data': d0, 'situacao': sit,
             'funcao': funcao(g(r, 'FUNCAO')).upper(), 'solicitante': limpa(g(r, 'SOLICITADA POR:')).upper(),
             'setor': SETOR.get(norm(limpa(g(r, 'SETOR'))), limpa(g(r, 'SETOR')).upper()),
             'ccusto': CC.get(norm(limpa(g(r, 'C.CUSTO'))), limpa(g(r, 'C.CUSTO')).upper()),
             'base': base_de(g(r, 'BASE')), 'motivo': mot(g(r, 'MOTIVO')), 'etapas': et, 'obs': obs, 'vagaId': '', 'origem': 'planilha'}
        if not c['base'] and limpa(g(r, 'BASE')): c['obs'] = '; '.join(x for x in [obs, 'Base na planilha: ' + titulo(limpa(g(r, 'BASE')))] if x)
        mres = re.search(r'RESID[EI]\s+(EM|NO|NA)\s+(.+)$', norm(obs))
        if mres:
            raw = re.split(r'\s*(\(|/|;|,|\d|\bVERIFICAR\b|\bSO TEM\b|\bCANDIDATO\b|\.| - | – )', mres.group(2))[0].strip()
            if raw: c['cidade'] = cidade({'PDT': 'Presidente Dutra', 'STI': 'Santa Inês', 'BDC': 'Barra do Corda', 'PDS': 'Pedreiras'}.get(raw, raw), '', nome)
        # encerramento
        if sit == 'concluido':
            fim = data_txt(obs) if re.search(r'ADMI', norm(obs)) else ''
            c['dataFim'] = fim or (et.get('icgb') or {}).get('d') or (datas[-1] if datas else '') or d0
            if fim: c['dataAdmissao'] = fim
        elif sit == 'cancelado':
            nok = next((k for k in ORDEM if (et.get(k) or {}).get('s') == 'nok'), '')
            if nok: c.update(motivoCancel='Reprovado na etapa', etapaCancel=nok)
            elif sit_t.startswith('DESIST') or re.search(r'DESIST|NAO TEM INTERE|NAO QUIS|NAO ACEIT|NAO QUER', norm(obs)):
                c.update(motivoCancel='Desistência do candidato', etapaCancel='')
            elif 'NAO COMPARECEU' in norm(obs): c.update(motivoCancel='Não compareceu', etapaCancel='')
            elif re.search(r'NAO VAI SEGUIR|VAGA CANCEL|SUSPENS', norm(obs)): c.update(motivoCancel='Vaga cancelada pelo solicitante', etapaCancel='')
            else: c.update(motivoCancel='Outro motivo', etapaCancel='')
            c['motivoTexto'] = obs[:160]
            c['dataFim'] = (datas[-1] if datas else '') or d0
        if sit in ('concluido', 'cancelado') and not c.get('dataFim'):
            AVISOS.append([aba.strip(), n_lin, nome, 'Encerrado sem nenhuma data', 'aparece no Histórico sem mês'])
        txt = f'Importado da Tabela de Acompanhamento do RH (aba {aba.strip().title()}, linha {n_lin})'
        c['hist'] = [{'d': H + 'T12:00:00.000Z', 't': txt, 'u': ''}]
        # última movimentação = data mais recente já passada (etapas, abertura, encerramento): é o que o site usa para "parado há N dias"
        passadas = [x for x in datas + [d0, c.get('dataFim', '')] if x and x <= H]
        if passadas: c['atualizadoEm'] = max(passadas)
        chave = '|'.join([aba.strip(), norm(nome), c['funcao'], c['data'], c['ct'], c['solicitante']])
        ids[chave] += 1
        c['id'] = 'imp' + hashlib.sha1((chave + ('#%d' % ids[chave] if ids[chave] > 1 else '')).encode()).hexdigest()[:12]
        cands.append({k: v for k, v in c.items() if v not in ('', None) or k in ('vagaId', 'obs', 'etapas')})

# mesma pessoa em andamento duas vezes para a mesma função: mantém as duas (são linhas diferentes), mas avisa
and_por_nome = Counter((norm(c['nome']), c['funcao']) for c in cands if c['situacao'] == 'andamento')
for (nm, fn), q in and_por_nome.items():
    if q > 1: AVISOS.append(['ACOMPANHAMENTO', '', nm, f'{q} processos em andamento para {fn}', 'conferir se é linha repetida'])

# ---------- vagas (aba NECESSIDADE) ----------
vagas = []
ws = wb['NECESSIDADE']
cab = [norm(limpa(c.value)) for c in ws[1]]
ix = {h: i for i, h in enumerate(cab) if h}
g = lambda r, h: r[ix[h]] if h in ix and ix[h] < len(r) else None
vc = Counter()
for n_lin, r in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
    if not any(r): continue
    fn = funcao(g(r, 'FUNCAO')).upper()
    if not fn: continue
    st = norm(limpa(g(r, 'STATUS'))); sit_v = norm(limpa(g(r, 'SITUACAO')))
    aberta = st.startswith('ABERT') and not sit_v.startswith('CANCEL') and not sit_v.startswith('CONCLU')
    v = {'ct': str(limpa(g(r, 'CT'))).split('.')[0], 'data': iso(g(r, 'DATA')), 'funcao': fn, 'solicitante': limpa(g(r, 'SOLICITADA POR:')).upper(),
         'setor': SETOR.get(norm(limpa(g(r, 'SETOR'))), limpa(g(r, 'SETOR')).upper()), 'ccusto': CC.get(norm(limpa(g(r, 'C.CUSTO'))), limpa(g(r, 'C.CUSTO')).upper()),
         'base': base_de(g(r, 'BASE')), 'motivo': '', 'status': 'aberta' if aberta else 'fechada', 'obs': limpa(g(r, 'OBSERVACAO:')), 'origem': 'planilha'}
    if not v['base'] and limpa(g(r, 'BASE')): v['obs'] = '; '.join(x for x in [v['obs'], 'Base na planilha: ' + titulo(limpa(g(r, 'BASE')))] if x)
    if not aberta: v.update(fechadaEm=v['data'] or H, obsFech='Cancelada (planilha)' if sit_v.startswith('CANCEL') else 'Fechada na planilha')
    chave = '|'.join([v['ct'], v['data'], fn, v['solicitante'], v['base'], str(n_lin)])
    v['id'] = 'impv' + hashlib.sha1(chave.encode()).hexdigest()[:12]
    vagas.append({k: x for k, x in v.items() if x not in ('', None) or k in ('obs', 'motivo')})

json.dump({'gerado': H, 'fonte': os.path.basename(TAB), 'candidatos': cands, 'vagas': vagas, 'avisos': AVISOS}, open(SAIDA, 'w', encoding='utf-8'), ensure_ascii=False)
print('candidatos', len(cands), Counter(c['situacao'] for c in cands))
print('motivos', Counter(c.get('motivoCancel') for c in cands if c['situacao'] == 'cancelado'))
print('etapas reprovação', Counter(c.get('etapaCancel') for c in cands if c.get('motivoCancel') == 'Reprovado na etapa'))
print('sem base', sum(1 for c in cands if not c.get('base')), '| sem data', sum(1 for c in cands if not c.get('data')), '| encerrados sem dataFim', sum(1 for c in cands if c['situacao'] in ('concluido', 'cancelado') and not c.get('dataFim')))
print('vagas', len(vagas), Counter(v['status'] for v in vagas))
print('avisos', len(AVISOS), Counter(a[3].split(' processos')[0] if 'processos' in a[3] else a[3] for a in AVISOS))
print('valores pend', Counter((k, e.get('t', '')) for c in cands for k, e in c['etapas'].items() if e['s'] == 'pend').most_common(25))
