SOURCE = "/tmp/claude-0/-home-claude/9ac52ce2-edc7-57a9-8053-1cc80c593aba/scratchpad/artifact-files/20f25978-b702-4f16-b33e-c77d794c995b/index.html"
D="/tmp/claude-0/-home-claude/9ac52ce2-edc7-57a9-8053-1cc80c593aba/scratchpad/teste/uso/"
import os, time, base64; os.makedirs(D, exist_ok=True)
from playwright.sync_api import sync_playwright
R=[]
def ok(n,c,e=""): R.append(("OK     " if c else "FALHOU ")+n+(f" — {e}" if e!="" else ""))
with sync_playwright() as pw:
    page=pw.chromium.launch().new_page(viewport={"width":1440,"height":1000}); err=[]; page.on("pageerror",lambda e: err.append(str(e)[:200]))
    page.route("**/*", lambda r: r.continue_() if r.request.url.startswith("file:") else r.abort())
    t0=time.time(); page.goto("file://"+SOURCE); page.wait_for_function("typeof REG!=='undefined' && REG.some(r=>r.exemplo)"); E=page.evaluate
    ok("Site abre com o exemplo carregado", True, f"{time.time()-t0:.1f}s")
    st=E("(()=>{const m={};REG.filter(r=>r.exemplo).forEach(r=>m[r.status]=(m[r.status]||0)+1);return m})()")
    ok("Solicitações em todas as etapas", all(k in st for k in ["coord","dp","aplicacao","conferencia","concluida","recusada","cancelada"]), st)
    ev=E("({fotos:REG.filter(r=>r.exemplo&&(r.fotos||[]).length).length, prints:REG.filter(r=>r.exemplo&&(r.imagens||[]).length).length, assinados:REG.filter(r=>r.exemplo&&r.anexo&&r.anexoArq).length})")
    ok("Evidências: fotos de ocorrência, prints nos documentos e documentos assinados", ev["fotos"]>0 and ev["prints"]>0 and ev["assinados"]>0, ev)
    # fotos visíveis no detalhe
    rid=E("REG.find(r=>r.exemplo&&(r.fotos||[]).length).id"); E(f"state.role='dp'; state.pessoa=null; state.tab='fila'; state.filtro='todas'; state.sel={rid}; render()")
    ok("Foto da ocorrência aparece na medida", E("document.querySelectorAll('.fotos-mini img').length")>0)
    E("document.querySelector('.fotos-mini .foto-th').click()"); page.wait_for_timeout(200); ok("Foto abre ampliada", E("!!document.getElementById('lightbox')")); page.screenshot(path=D+"01_foto.png"); E("document.getElementById('lightbox').remove()")
    rid=E("REG.find(r=>r.exemplo&&(r.imagens||[]).length&&r.status==='aplicacao').id"); E(f"state.sel={rid}; render()"); page.wait_for_timeout(200)
    ok("Print aparece no documento", E("document.querySelectorAll('#doc-box .doc-fig img').length")>0)
    page.locator('#doc-box').screenshot(path=D+"02_doc_com_print.png")
    pdf=E(f"(async()=>{{const b=pdfMedida(REG.find(r=>r.id==={rid}));const a=new Uint8Array(await b.arrayBuffer());let s='';for(const x of a)s+=String.fromCharCode(x);return btoa(s)}})()")
    open(D+"03_documento.pdf","wb").write(base64.b64decode(pdf)); ok("PDF do documento com o print gerado", len(pdf)>20000, f"{len(pdf)*3//4//1024} KB")
    rid=E("REG.find(r=>r.exemplo&&r.status==='conferencia'&&r.anexoArq).id"); E(f"state.sel={rid}; render()")
    ok("Documento assinado anexado com botão Baixar", E("!!document.querySelector('[data-act=baixar-assinado]')"))
    # perfis × pessoas × telas
    tabs=["inicio","fila","nova","entrada","enviados","painel","historico","regras","ajuda"]
    tot=0; lento=0; t1=time.time()
    for role in ["supervisor","coordenador","dp"]:
        ps=[None]+E(f"pessoasDoPerfil('{role}').map(p=>p.k)")[:6]
        for p in ps:
            for t in tabs+(["importacao"] if role=="dp" else []):
                a=time.time(); E(f"state.role='{role}'; state.pessoa={('{role:%r,k:%r}'%(role,p)) if p else 'null'}; state.tab='{t}'; state.sel=null; state.form=null; render()"); dt=time.time()-a; tot+=1; lento+=dt>0.5
    ok(f"{tot} telas abertas (3 perfis × pessoas × telas)", not err, f"{time.time()-t1:.1f}s, {lento} acima de 0,5 s")
    # visões
    for role,nome in [("supervisor","04_painel_supervisor"),("coordenador","05_painel_coordenador"),("dp","06_painel_dp")]:
        k=E(f"pessoasDoPerfil('{role}').map(p=>p.k).sort((a,b)=>REG.filter(r=>r.exemplo&&colab(r.colab).{'sup' if role=='supervisor' else 'coord'}===b).length-REG.filter(r=>r.exemplo&&colab(r.colab).{'sup' if role=='supervisor' else 'coord'}===a).length)[0]") if role!="dp" else None
        E(f"state.role='{role}'; state.pessoa={('{role:%r,k:%r}'%(role,k)) if k else 'null'}; state.tab='painel'; render()"); page.wait_for_timeout(200)
        page.screenshot(path=D+nome+".png", full_page=True)
    E("state.role='supervisor'; state.pessoa=null; state.tab='entrada'; render()"); page.wait_for_timeout(150); page.screenshot(path=D+"07_caixa_supervisor.png")
    msgs=E("mensagens().filter(m=>m.para==='supervisor').length"); ok("Caixa de entrada com histórico de mensagens", msgs>20, f"{msgs} mensagens para supervisores")
    E("state.role='dp'; state.tab='fila'; state.filtro='todas'; render()"); page.screenshot(path=D+"08_solicitacoes_dp.png")
    # fluxo completo numa solicitação nova
    E("state.role='supervisor'; state.pessoa=null; state.tab='nova'; state.form=null; render()")
    c=E("COLABS.find(c=>c.real&&c.ativo!==false&&!REG.some(r=>!r.imp&&r.colab===c.id)).id")
    E(f"Object.assign(state.form,{{colab:'{c}',data:somaDias(HOJE,-2),desvios:[35],relato:'estava sem capacete na rede',texto:'Em '+fmt(somaDias(HOJE,-2))+', V.Sa. executou atividade sem a utilização dos EPIs obrigatórios.',confirmado:true,passo:4,maxPasso:4}}); render()")
    E("document.getElementById('enviar').click()"); page.wait_for_timeout(150); nid=E("state.sel")
    ok("Supervisor envia", E(f"REG.find(r=>r.id==={nid}).status")=="coord")
    E("state.role='coordenador'; render(); document.getElementById('motivo').value=''; document.querySelector('[data-act=aprovar]').click()"); page.wait_for_timeout(100)
    ok("Coordenador autoriza", E(f"REG.find(r=>r.id==={nid}).status")=="dp")
    E("state.role='dp'; render(); document.querySelector('[data-act=gerar]').click()"); page.wait_for_timeout(100)
    ok("DP elabora e envia", E(f"REG.find(r=>r.id==={nid}).status")=="aplicacao")
    E("state.role='supervisor'; render()"); page.locator("#arquivo").set_input_files(D+"03_documento.pdf"); E("document.querySelector('[data-act=aplicar]').click()"); page.wait_for_timeout(100)
    ok("Supervisor aplica com o documento assinado", E(f"REG.find(r=>r.id==={nid}).status")=="conferencia")
    E("state.role='dp'; render(); ['ck0','ck1','ck2'].forEach(i=>document.getElementById(i).checked=true); document.querySelector('[data-act=concluir]').click()"); page.wait_for_timeout(100)
    ok("DP arquiva e conclui", E(f"REG.find(r=>r.id==={nid}).status")=="concluida")
    page.set_viewport_size({"width":390,"height":844})
    of=[]
    for role in ["supervisor","coordenador","dp"]:
        for t in ["painel","fila","entrada","inicio"]:
            E(f"state.role='{role}'; state.pessoa=null; state.tab='{t}'; state.sel=null; render()")
            if E("document.documentElement.scrollWidth>window.innerWidth+1"): of.append(role+"/"+t)
    E("state.role='dp'; state.tab='painel'; render()"); page.screenshot(path=D+"09_celular_dp.png", full_page=False)
    ok("Celular sem rolagem lateral", not of, of)
    E("document.documentElement.dataset.tema='escuro'; state.role='supervisor'; state.tab='painel'; render()"); page.set_viewport_size({"width":1440,"height":1000}); page.screenshot(path=D+"10_tema_escuro.png")
    ok("Nenhum erro de script", not err, err[:3])
print("\n".join(R)); print("TOTAL", sum(r.startswith("OK") for r in R), "ok,", sum(r.startswith("FALHOU") for r in R), "falhas")
