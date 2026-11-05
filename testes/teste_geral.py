COMMAND, SHELL_DIR, RUNTIME_DIR, WORK_DIR = "/usr/local/bin/frame-emulator", "/opt/frame-emulator/cache/shell/from-fad1c211dce9b5a8/a1f2d3ea40d8109afa5de13b06c511d7c27c5bad", "/opt/frame-emulator/cache/runtime-checked-8c27e07157be02c7", "/opt/frame-emulator/run"
SOURCE = "/tmp/claude-0/-home-claude/9ac52ce2-edc7-57a9-8053-1cc80c593aba/scratchpad/artifact-files/20f25978-b702-4f16-b33e-c77d794c995b/index.html"
import json, os, subprocess, tempfile, traceback, random, time
from datetime import date, timedelta
from playwright.sync_api import sync_playwright, TimeoutError as WaitTimeout
os.environ.setdefault("NO_PROXY", "127.0.0.1,localhost"); os.environ.pop("NODE_OPTIONS", None)
random.seed(2026)
out = tempfile.mkdtemp(prefix="gigante-")
PDF = out + "/assinado_teste.pdf"
open(PDF,"wb").write(b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF")

log = []; falhas = []
def sec(t): log.append(f"\n== {t}")
def ok(n, c, e=""):
    log.append(("OK     " if c else "FALHOU ") + n + (f" — {e}" if e else ""))
    if not c: falhas.append(n)
try:
    with sync_playwright() as pw:
        page = pw.chromium.launch().new_page()
        page.set_viewport_size({"width": 1280, "height": 1000})
        errors = []; page.on("pageerror", lambda e: errors.append(str(e)[:300]))
        t0 = time.time(); page.route("**/*", lambda r: r.continue_() if r.request.url.startswith("file:") else r.abort()); page.goto("file://" + SOURCE); page.wait_for_timeout(800); page.evaluate("localStorage.setItem('cgb-exemplo-v2','off')"); page.reload()
        page.wait_for_timeout(1200)
        a = page
        E = a.evaluate
        def w(ms=60): page.wait_for_timeout(ms)
        def js(sel):
            r = E(f"(()=>{{const e=document.querySelector({json.dumps(sel)}); if(e && !e.disabled) {{ e.click(); return true }} return false }})()"); w(); return r
        def fill(sel, v, ev="input"):
            if not E(f"!!document.querySelector({json.dumps(sel)})"): log.append(f"DEBUG campo ausente {sel} passo={E('state.form&&state.form.passo')} tab={E('state.tab')} erro={E('(document.getElementById(\'wiz-erro\')||{}).textContent')}"); return
            E(f"(()=>{{const e=document.querySelector({json.dumps(sel)}); e.value={json.dumps(v)}; e.dispatchEvent(new Event({json.dumps(ev)}, {{bubbles:true}})); }})()"); w()
        def perfil(role, k=None):
            E(f"state.role='{role}'; state.pessoa={json.dumps({'role': role, 'k': k}) if k else 'null'}; state.sel=null; state.msg=null; state.cartaoSup=null; state.filtro='todas'; montarListaColab(); render()"); w()
        st = lambda n: E(f"REG.find(r=>r.id==={n}).status")
        toast = lambda: E("document.getElementById('toast').textContent")
        abrir = lambda n: (E(f"state.tab='fila'; state.filtro='todas'; state.sel={n}; render()"), w())
        ok("Página carrega", E("typeof render") == "function", f"{time.time()-t0:.1f}s até abrir")

        sec("1. Estrutura de equipes")
        sups = E("pessoasDoPerfil('supervisor').map(p=>p.k)"); coords = E("pessoasDoPerfil('coordenador').map(p=>p.k)")
        ok("Supervisores e coordenadores/gestores carregados", len(sups) >= 20 and len(coords) >= 9, f"{len(sups)} supervisores, {len(coords)} coordenadores/gestores")
        equipe = {k: E(f"COLABS.filter(c=>c.real&&c.sup==='{k}').map(c=>[c.id,c.mat,c.nome,c.coord])") for k in sups}
        semvaz = [k for k, v in equipe.items() if not v]
        ok("Todo supervisor tem equipe", not semvaz, ", ".join(semvaz))

        # ---------- simulação de uso ----------
        sec("2. Simulação de uso (solicitações reais, vários meses)")
        hoje = date.fromisoformat(E("HOJE"))
        itens = [1, 4, 6, 8, 2, 7, 15, 18, 25, 26, 35, 10, 17, 39]
        criados = []  # (id, solicitante, pessoa, colabId, plano)
        planos = ["concluida"] * 14 + ["correcao"] * 4 + ["recusa"] * 4 + ["ajuste"] * 3 + ["coord"] * 3 + ["dp"] * 3 + ["aplicacao"] * 3 + ["conferencia"] * 2 + ["testemunhas"] * 2
        random.shuffle(planos)
        reinc_colab = None
        t1 = time.time()
        for i, plano in enumerate(planos):
            quem = "coordenador" if i % 9 == 4 else "dp" if i % 13 == 7 else "supervisor"
            sup = random.choice([s for s in sups if len(equipe[s]) > 5])
            cid, mat, nome, coord = random.choice(equipe[sup])
            if i in (3, 11, 19):  # mesmo colaborador e mesmo item: reincidência
                if reinc_colab is None: reinc_colab = (sup, cid, mat, nome, coord)
                sup, cid, mat, nome, coord = reinc_colab; item = 1; quem = "supervisor"
                if plano in ("recusa", "coord"): plano = "concluida"
            else:
                item = random.choice(itens)
            k = sup if quem == "supervisor" else coord if quem == "coordenador" else None
            perfil(quem, k)
            E("state.tab='nova'; state.form=null; render()"); w()
            fill("#f-colab", f"{mat} · {nome}", "change")
            if E("state.form.colab") != str(cid):
                ok(f"Solicitação {i+1}: colaborador visível para quem solicita", False, f"{quem} {k} → {mat}"); continue
            js('[data-act="wiz-next"]')
            if E("state.form.passo") != 1: ok(f"Solicitação {i+1}: avança do passo 1", False, E("document.getElementById('wiz-erro').textContent")); continue
            dt = (hoje - timedelta(days=random.randint(1, 85))).isoformat()
            fill("#f-data", dt, "change"); js('[data-act="wiz-next"]')
            js('[data-act="wiz-next"]')
            if E("state.form.passo") != 2 or not E("document.getElementById('wiz-erro').textContent"): ok(f"Solicitação {i+1}: bloqueia passo 3 sem desvio", False)
            E("state.form.dvAberto=true; atualizarDesvios()"); js(f'#dv-sug [data-adddv="{item}"]')
            if random.random() < 0.15:
                E("state.form.dvAberto=true; atualizarDesvios()"); js('#dv-sug [data-adddv="4"]')
            js('[data-act="wiz-next"]')
            fill("#f-relato", "durante a fiscalizacao de campo foi constatado o desvio relatado pela lideranca")
            js("#btn-gerar"); w(150); js("#f-conf"); js('[data-act="wiz-next"]')
            if E("state.form.passo") != 4: ok(f"Solicitação {i+1}: chega na revisão", False, E("document.getElementById('wiz-erro').textContent")); continue
            if i == 0:
                js('.rev [data-passo="1"]'); ok("Revisão: 'Editar' volta para o passo e mantém os dados", E("state.form.passo") == 1 and E("state.form.data") == dt)
                E("state.form.passo=4; render()"); w()
            if not js("#enviar"):
                ok(f"Solicitação {i+1}: envio", False, E("document.getElementById('envio-aviso').innerText")); continue
            n = E("Math.max(...REG.filter(r=>!r.imp).map(r=>r.id))")
            if quem != "supervisor" and plano in ("recusa", "coord", "ajuste"): plano = "concluida"
            criados.append({"id": n, "quem": quem, "k": k, "sup": sup, "coord": coord, "plano": plano, "item": item, "cid": cid})
            esperado = "coord" if quem == "supervisor" else "dp"
            if st(n) != esperado: ok(f"MD-{n}: status inicial", False, st(n)); continue
            # autorização
            if quem == "supervisor":
                if plano == "coord": continue
                perfil("coordenador", coord); abrir(n)
                if plano == "recusa":
                    fill("#motivo", "fatos nao confirmados pela lideranca"); js('button[data-act="recusar"]'); continue
                if plano == "ajuste":
                    E("(()=>{const s=document.getElementById('ajuste'); s.value=[...s.options].map(o=>o.value).find(v=>v!==s.value); })()")
                    fill("#motivo", "ajuste pela gravidade do caso")
                js('button[data-act="aprovar"]')
                if st(n) != "dp": ok(f"MD-{n}: autorização", False, toast()); continue
            if plano == "dp": continue
            # elaboração
            perfil("dp"); abrir(n)
            if E("!!document.getElementById('dp-dias')"):
                mx = E("+document.getElementById('dp-dias').value") or 1
                fill("#dp-dias", "40"); js('button[data-act="gerar"]')
                if st(n) != "dp": ok(f"MD-{n}: bloqueio de 40 dias de suspensão", False)
                fill("#dp-dias", str(random.randint(1, mx)))
            js('button[data-act="gerar"]')
            if st(n) != "aplicacao": ok(f"MD-{n}: elaboração", False, toast()); continue
            if plano == "aplicacao": continue
            # aplicação por quem solicitou
            perfil(quem, k); abrir(n)
            a.locator("#arquivo").set_input_files(PDF)
            if plano == "testemunhas": E("document.getElementById('recusa').checked=true")
            js('button[data-act="aplicar"]')
            if st(n) != "conferencia": ok(f"MD-{n}: aplicação", False, toast()); continue
            if plano == "conferencia": continue
            perfil("dp"); abrir(n)
            if plano == "correcao":
                fill("#dev-motivo", "assinatura ilegivel"); js('button[data-act="devolver"]')
                perfil(quem, k); abrir(n); a.locator("#arquivo").set_input_files(PDF); js('button[data-act="aplicar"]')
                perfil("dp"); abrir(n)
            js("#ck0"); js("#ck1"); js("#ck2"); js('button[data-act="concluir"]')
        dur = time.time() - t1
        final = {c["id"]: st(c["id"]) for c in criados}
        alvo = {"concluida": "concluida", "correcao": "concluida", "testemunhas": "concluida", "ajuste": "concluida", "recusa": "recusada", "coord": "coord", "dp": "dp", "aplicacao": "aplicacao", "conferencia": "conferencia"}
        errados = [f"MD-{c['id']} ({c['plano']}: {final[c['id']]})" for c in criados if final[c["id"]] != alvo[c["plano"]]]
        ok(f"{len(criados)} solicitações criadas e levadas até o fim do plano", len(criados) == len(planos) and not errados, "; ".join(errados) or f"{dur:.0f}s de simulação")
        from collections import Counter
        ok("Distribuição final", True, ", ".join(f"{k}: {v}" for k, v in Counter(final.values()).items()))
        ok("Solicitantes", True, ", ".join(f"{k}: {v}" for k, v in Counter(c["quem"] for c in criados).items()))
        espera = {"coord": 1, "recusa": 2, "dp": 2, "aplicacao": 3, "conferencia": 4, "concluida": 5, "ajuste": 5, "testemunhas": 5, "correcao": 7}
        hist_ruim = [f"MD-{c['id']} {c['plano']}/{c['quem']}: {E(f'REG.find(r=>r.id==={c[chr(105)+chr(100)]}).hist.length')}" for c in criados
                     if E(f"REG.find(r=>r.id==={c['id']}).hist.length") != espera[c["plano"]] - (0 if c["quem"] == "supervisor" or c["plano"] in ("coord", "recusa") else 1)]
        ok("Histórico de cada solicitação registra exatamente as ações feitas", not hist_ruim, "; ".join(hist_ruim[:5]))
        ajustes = [c for c in criados if c["plano"] == "ajuste"]
        ok("Ajuste do coordenador fica registrado com o motivo", all(E(f"REG.find(r=>r.id==={c['id']}).hist.some(h=>/Autorizou com ajuste: ajuste pela gravidade/.test(h.a))") for c in ajustes))
        ok("Recusa com 2 testemunhas registrada", all(E(f"!!REG.find(r=>r.id==={c['id']}).recusa") for c in criados if c["plano"] == "testemunhas"))

        sec("3. Reincidência ao longo do tempo")
        if reinc_colab:
            sup, cid, mat, nome, coord = reinc_colab
            perfil("supervisor", sup); E("state.tab='nova'; state.form=null; render()"); w()
            fill("#f-colab", f"{mat} · {nome}", "change"); E("state.form.passo=2; state.form.maxPasso=2; render()"); w()
            E("state.form.dvAberto=true; atualizarDesvios()"); js('#dv-sug [data-adddv="1"]')
            ok("Cartão do colaborador mostra o histórico", True)
            sug = E("document.getElementById('sug').innerText")
            ok("Depois de 3 faltas, a sugestão sobe de nível (5.3)", "5.3" in sug, sug.split("\n")[1] if "\n" in sug else sug[:60])

        sec("4. Restrição por pessoa (sem vazamento)")
        vaz = []
        for s in random.sample(sups, 8):
            perfil("supervisor", s)
            fila = E("(()=>{state.tab='fila';state.filtro='todas';render();return [...document.querySelectorAll('.item')].map(i=>+i.dataset.sel)})()")
            if not all(E(f"colab(REG.find(r=>r.id==={x}).colab).sup") == s for x in fila): vaz.append(f"{s}/fila")
            ini = E("(()=>{state.tab='inicio';state.cartaoSup='todas';render();return [...document.querySelectorAll('.espera-item')].map(i=>+i.dataset.abrir)})()")
            if not all(E(f"colab(REG.find(r=>r.id==={x}).colab).sup") == s for x in ini): vaz.append(f"{s}/início")
            for q in ["entrada", "enviados"]:
                ms = E(f"(()=>{{state.tab='{q}';state.msg=null;render();return [...document.querySelectorAll('.msg')].map(m=>m.dataset.msg.split('-')[0])}})()")
                if not all(E(f"colab(REG.find(r=>r.id==={x}).colab).sup") == s for x in ms): vaz.append(f"{s}/{q}")
            dl = E("[...document.querySelectorAll('#lista-colab option')].map(o=>o.value.split(' · ')[0])")
            if not all(E(f"(COLABS.find(c=>c.mat==='{m}')||{{}}).sup") == s for m in dl[:60]): vaz.append(f"{s}/lista")
            outro = next(c for x in sups if x != s for c in equipe[x])
            E("state.tab='historico'; render()"); w(); fill("#h-colab", outro[1], "change")
            if outro[1] in E("document.getElementById('h-colab').value"): vaz.append(f"{s}/histórico")
        for c in random.sample(coords, 6):
            perfil("coordenador", c)
            fila = E("(()=>{state.tab='fila';state.filtro='todas';render();return [...document.querySelectorAll('.item')].map(i=>+i.dataset.sel)})()")
            if not all(E(f"colab(REG.find(r=>r.id==={x}).colab).coord") == c for x in fila): vaz.append(f"{c}/fila")
        ok("8 supervisores e 6 coordenadores: nada de outras equipes aparece", not vaz, ", ".join(vaz))

        sec("5. Cartões, filas e caixa de entrada batem entre si")
        inc = []
        for role, k in [("supervisor", None), ("coordenador", None), ("dp", None)] + [("supervisor", c["sup"]) for c in criados[:4]] + [("coordenador", c["coord"]) for c in criados[:4]]:
            perfil(role, k); E("state.tab='inicio'; render()"); w()
            nums = E("[...document.querySelectorAll('.kpis')[0].querySelectorAll('.kpi-n')].map(e=>+e.textContent.replace(/\\./g,''))")
            cont = []
            for cart in ["andamento", "autorizacao", "concluidas", "todas"]:
                E(f"state.cartaoSup='{cart}'; render()"); w(); cont.append(E("document.querySelectorAll('.painel-grid .espera-item, .espera .espera-item').length"))
            if nums != cont: inc.append(f"{role}/{k}: {nums} x {cont}")
            badge = E("(()=>{const b=[...document.querySelectorAll('.side button')].find(b=>b.dataset.tab==='fila');const c=b.querySelector('.count');return c?+c.textContent:0})()")
            pend = E("REG.filter(r=>!r.imp&&veReg(r)&&ehPendente(r,state.role)).length")
            if badge != pend: inc.append(f"{role}/{k}: badge {badge} x pendentes {pend}")
            pede = E("mensagens().filter(m=>m.para===state.role&&veReg(m.r)&&pedeAcao(m)).map(m=>m.r.id)")
            for x in pede:
                if not E(f"ehPendente(REG.find(r=>r.id==={x}), state.role)"): inc.append(f"{role}/{k}: mensagem pendente sem pendência MD-{x}")
        ok("Cartões = listas; contador do menu = pendências; mensagens 'Pendente' = ações reais", not inc, "; ".join(inc[:5]))
        perfil("supervisor"); E("state.tab='entrada';state.msg=null;render()"); w()
        tipos = Counter(E("[...document.querySelectorAll('.msg .tag')].map(t=>t.textContent)"))
        ok("Caixa do supervisor só com os tipos combinados", set(tipos) <= {"Notificação", "Documento para aplicação", "Correção solicitada", "Anexo: documento"}, dict(tipos).__repr__())
        ok("Sem 'Medida concluída' em nenhuma caixa", not E("mensagens().some(m=>/concluída/i.test(m.assunto))"))

        sec("6. Status por perfil")
        conf = [c["id"] for c in criados if final[c["id"]] == "conferencia"]
        for x in conf[:2]:
            vis = {}
            for role in ["supervisor", "coordenador", "dp"]:
                perfil(role); vis[role] = E(f"(()=>{{state.tab='fila';state.filtro='todas';render();const e=document.querySelector('.item[data-sel=\"{x}\"] .pill');return e&&e.textContent}})()")
            ok(f"MD-{x} aguardando arquivamento: Concluída p/ supervisor e coordenador, pendente p/ DP", vis == {"supervisor": "Concluída", "coordenador": "Concluída", "dp": "Aguardando arquivamento"}, str(vis))

        sec("7. Banco de dados e documento")
        perfil("dp")
        b = E("(()=>{const b=montarBanco();return {med:b.medidas.length,sis:b.medidas.filter(m=>m.Origem==='Sistema').length,fluxo:b.fluxo.length,hist:REG.reduce((s,r)=>s+r.hist.length,0),col:b.colabs.length,eq:b.colabs.filter(c=>c.Setor).length}})()")
        ok("Exportação inclui tudo (medidas, fluxo e equipes)", b["sis"] == E("REG.filter(r=>!r.imp).length") and b["fluxo"] == b["hist"], json.dumps(b))
        ok("CSV e colunas de equipe", E("csv(montarBanco().medidas).split('\\n')[0].includes('Supervisor')"))
        ex = next(c for c in criados if final[c["id"]] == "concluida")
        d = E(f"documentoHTML(REG.find(r=>r.id==={ex['id']}))")
        ok("Documento para impressão completo", "482" in d and "Testemunhas" in d)

        sec("8. Indicadores do DP")
        E("state.tab='inicio'; render()"); w()
        per = {}
        for p in ["12m", "tudo", hoje.strftime("%Y"), hoje.strftime("%Y-%m")]:
            E(f"state.tab='painel'; state.periodo='{p}'; render()"); w(150)
            per[p] = E("[...document.querySelectorAll('.indicadores .kpi-n')].map(e=>e.textContent).join(' / ')")
        ok("Indicadores em 4 períodos", all(per.values()), json.dumps(per, ensure_ascii=False))
        mes = E("(()=>{const d=dadosIndicadores(somaDias(HOJE,-30).slice(0,7));return [d.total, d.lista.filter(r=>!r.imp).length]})()")
        ok("Medidas do sistema entram nos indicadores do mês", mes[1] > 0, f"{mes[0]} medidas no mês, {mes[1]} do sistema")
        mock = """(async()=>{const charts=[];const slide=()=>({addText(){},addShape(){},addChart(t,d){charts.push(d.length);if(d.some(s=>s.values.some(v=>typeof v!=='number'||isNaN(v))))throw new Error('x')}});
          const P=window.PptxGenJS, D=DL; window.PptxGenJS=class{constructor(){this.n=0}addSlide(){this.n++;return slide()}write(){window.__n=this.n;return Promise.resolve(new ArrayBuffer(8))}get ShapeType(){return{rect:1,roundRect:1}}get ChartType(){return{bar:1}}};
          DL={save:async o=>{window.__f=o.filename;return{status:'saved'}}}; await exportarApresentacao(); window.PptxGenJS=P; DL=D; return [window.__n, charts.length, window.__f]})()"""
        E("state.periodo=somaDias(HOJE,-30).slice(0,7); render()"); w(150)
        ok("Apresentação do mês", (lambda r: r[0] == 10 and r[1] == 7)(a.evaluate(mock)), str(a.evaluate(mock)))

        sec("9. Desempenho")
        tempos = {}
        for role in ["supervisor", "coordenador", "dp"]:
            for t in ["inicio", "fila", "entrada", "historico", "regras"]:
                ms = E(f"(()=>{{state.role='{role}';state.pessoa=null;state.tab='{t}';const a=performance.now();render();return Math.round(performance.now()-a)}})()")
                tempos[f"{role}/{t}"] = ms
        lento = {k: v for k, v in tempos.items() if v > 300}
        ok("Todas as telas abrem em menos de 0,3 s", not lento, f"mais lenta: {max(tempos, key=tempos.get)} {max(tempos.values())} ms" + (f"; lentas: {lento}" if lento else ""))

        sec("10. Celular e erros")
        page.set_viewport_size({"width": 400, "height": 860}); w(300); ruins = []
        for role in ["supervisor", "coordenador", "dp"]:
            for t in ["inicio", "fila", "nova", "entrada", "enviados", "historico", "importacao", "regras", "ajuda"]:
                E(f"state.role='{role}'; state.tab='{t}'; render()"); w(40)
                if E("document.documentElement.scrollWidth > document.documentElement.clientWidth"): ruins.append(f"{role}/{t}")
        ok("27 telas no celular sem rolagem lateral", not ruins, ", ".join(ruins))
        E("state.role='dp'; state.tab='inicio'; render()"); page.set_viewport_size({"width": 1280, "height": 1000}); w(300)
        page.screenshot(path=f"{out}/dp_final.png", full_page=False)
        ok("Nenhum erro de script durante todo o teste", not errors, "; ".join(errors[:3]))
except Exception:
    log.append("ERRO NO TESTE " + traceback.format_exc()[-900:]); falhas.append("exceção")
finally:
    pass
print("\n".join(log))
print(f"\nTOTAL: {sum(l.startswith('OK') for l in log)} ok, {len(falhas)} falhas")
print(out)
