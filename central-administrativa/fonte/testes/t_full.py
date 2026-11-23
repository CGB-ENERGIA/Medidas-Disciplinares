import asyncio,json,time
from playwright.async_api import async_playwright
URL=''+__import__('pathlib').Path('central-hospedagem.html').resolve().as_uri()+''
XML=open('/tmp/nf.xml').read()
res={'erros':[],'paginas':[],'fluxos':[],'avisos':[]}
def ok(n,c,det=''):res['fluxos'].append((n,'OK' if c else 'FALHOU',det))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={'width':1500,'height':900},accept_downloads=True)
        pg=await ctx.new_page();await pg.route('**/*googleapis*',lambda r:r.abort())
        cdn=[]
        async def rcdn(r):cdn.append(r.request.url);await r.abort()
        await pg.route('**/cdnjs.cloudflare.com/**',rcdn)
        pg.on('pageerror',lambda e:res['erros'].append('JS: '+str(e)[:200]))
        pg.on('console',lambda m:m.type=='error' and 'cdnjs' not in m.text and 'ERR_FAILED' not in m.text and res['erros'].append('console: '+m.text[:200]))
        pg.on('dialog',lambda d:asyncio.ensure_future(d.accept()))
        t0=time.time();await pg.goto(URL);await pg.wait_for_timeout(1500);res['carga_s']=round(time.time()-t0,2)
        ids=await pg.evaluate("PAGINAS.filter(p=>!p.hide).map(p=>p.id)")
        inds=await pg.evaluate("INDS().map(i=>i.id)")
        alvo=ids+inds+['ti-nota-NF-961','ti-nota-nova','catalogo']
        for tema in ['claro','escuro']:
            if tema=='escuro':await pg.click('#b-tema');await pg.wait_for_timeout(300)
            for h in alvo:
                t=time.time();await pg.evaluate(f"location.hash='{h}'");await pg.wait_for_timeout(250)
                ms=await pg.evaluate("render(),0") if False else None
                info=await pg.evaluate("""()=>{const m=document.getElementById('main');const tx=m.innerText;return {n:tx.length,bad:(tx.match(/undefined|NaN|\\[object|Infinity/g)||[]).slice(0,3),of:document.documentElement.scrollWidth>innerWidth+2}}""")
                dur=round((time.time()-t)*1000)
                res['paginas'].append((tema,h,info['n'],info['bad'],info['of'],dur))
        await pg.click('#b-tema');await pg.wait_for_timeout(200)
        # modo alimentação
        await pg.evaluate("location.hash='inicio'");await pg.wait_for_timeout(300)
        b2=await pg.query_selector('.modo button[data-modo="alim"]')
        if b2:
            await b2.click();await pg.wait_for_timeout(1200)
            for h in ['inicio','onde','controle','tipos','qualidade']:
                await pg.evaluate(f"location.hash='{h}'");await pg.wait_for_timeout(250)
                info=await pg.evaluate("(()=>{const tx=document.getElementById('main').innerText;return {n:tx.length,bad:(tx.match(/undefined|NaN|\\[object/g)||[]).slice(0,3)}})()")
                res['paginas'].append(('alim',h,info['n'],info['bad'],False,0))
            ok('Trocar Hospedagem → Alimentação',await pg.evaluate("MODO")=='alim')
            await pg.evaluate("location.hash='inicio'");await pg.wait_for_timeout(500)
            await pg.click('.modo button[data-modo="hosp"]');await pg.wait_for_timeout(1000)
        # gaveta de filtros hospedagem
        await pg.evaluate("location.hash='gerencia'");await pg.wait_for_timeout(300)
        try:
            await pg.click('#b-filtros');await pg.wait_for_timeout(300);v=await pg.evaluate("[...document.querySelectorAll('#f-mes option')].map(o=>o.value).filter(Boolean)[0]")
            await pg.select_option('#f-mes',v);await pg.wait_for_timeout(300)
            btn=await pg.query_selector('#gaveta .btn.primary, [data-gav-ok], #g-aplicar')
            if btn:await btn.click();await pg.wait_for_timeout(500)
            ok('Filtros de Hospedagem (mês)',True,'mês '+str(v))
        except Exception as e:ok('Filtros de Hospedagem',False,str(e)[:100])
        await pg.evaluate("F&&Object.keys(F).forEach(k=>F[k]='');render()")
        # busca rápida
        await pg.keyboard.press('Control+k');await pg.keyboard.type('toner');await pg.wait_for_timeout(400)
        n=await pg.evaluate("CK.itens.length");await pg.keyboard.press('Enter');await pg.wait_for_timeout(500)
        ok('Busca rápida (Ctrl+K "toner")',n>0,f'{n} resultados → {await pg.evaluate("location.hash")}')
        # TI filtros gaveta
        await pg.evaluate("location.hash='ti-custos'");await pg.wait_for_timeout(400)
        await pg.click('.tihero [data-tifab]');await pg.wait_for_timeout(300)
        await pg.select_option('[data-tifd="ct"]','127');await pg.click('[data-tifok]');await pg.wait_for_timeout(400)
        ok('Setor de TI: filtro por contrato',await pg.evaluate("TIF.ct")=='127')
        await pg.click('[data-tilimpa]');await pg.wait_for_timeout(300);ok('Setor de TI: limpar filtros',await pg.evaluate("TIF.ct")=='')
        # metas
        await pg.click('[data-timetaab]');await pg.wait_for_timeout(300);await pg.fill('[data-timeta="geral"]','9.000,00');await pg.click('[data-timetasalva]');await pg.wait_for_timeout(400)
        ok('Mudar meta mensal',await pg.evaluate("TI_CFG.meta")==9000);await pg.evaluate("TI_CFG.meta=8000;TI_VER++;render()")
        # compra manual
        await pg.evaluate("location.hash='ti-nota-nova'");await pg.wait_for_timeout(500)
        await pg.click('[data-timanual]');await pg.wait_for_timeout(400)
        async def fill(s,v):
            await pg.fill(s,v);await pg.dispatch_event(s,'change');await pg.wait_for_timeout(200)
        await fill('[data-tie="num"]','5555');await fill('[data-tie="forn"]','TESTE LTDA')
        await fill('[data-tii="0|desc"]','CABO HDMI 3M');await fill('[data-tii="0|qtd"]','2');await fill('[data-tii="0|vu"]','45,00')
        await pg.click('[data-tidadd="0"]');await pg.wait_for_timeout(300)
        await pg.select_option('[data-tid="0|0|ct"]','127');await pg.dispatch_event('[data-tid="0|0|ct"]','change')
        await pg.select_option('[data-tid="0|0|base"]','Bacabal');await pg.dispatch_event('[data-tid="0|0|base"]','change')
        await pg.select_option('[data-tid="0|0|setor"]','ADMINISTRATIVO');await pg.dispatch_event('[data-tid="0|0|setor"]','change')
        await pg.click('[data-tisalva]');await pg.wait_for_timeout(700)
        n=await pg.evaluate("tiNotas().find(n=>n.num==='5555')")
        ok('Cadastrar compra à mão (sem anexo)',bool(n) and n['total']==90 and n['itens'][0]['dest'][0]['setor']=='ADMINISTRATIVO' and len(n['parc'])==1,json.dumps({'total':n and n['total'],'parc':n and n['parc']}))
        idn=n['id'] if n else ''
        # mudar situação
        await pg.evaluate("location.hash='ti-notas'");await pg.wait_for_timeout(400)
        await pg.select_option(f'[data-tistn="{idn}"]','entregue');await pg.wait_for_timeout(500)
        st=await pg.evaluate(f"tiNotas().find(n=>n.id==='{idn}')")
        ok('Mudar situação da nota (lista)',st['st']=='entregue' and len(st.get('hist',[]))==2,str(st.get('hist')))
        ind=await pg.evaluate("INDS().find(i=>i.cod==='IND-14')")
        ok('IND-14 calcula depois da entrega',ind['v'] is not None,'valor: '+str(ind['v']))
        # prestação de contas: botão mover
        await pg.click('[data-tinvis="situacao"]');await pg.wait_for_timeout(400)
        mv=await pg.query_selector('[data-timove]');
        if mv:await mv.click();await pg.wait_for_timeout(400)
        ok('Prestação de contas: mover nota',mv is not None)
        # excluir
        await pg.evaluate(f"location.hash='ti-nota-{idn}'");await pg.wait_for_timeout(400)
        await pg.click('[data-tiexclui]');await pg.wait_for_timeout(500)
        ok('Excluir compra',not await pg.evaluate("!!tiNotas().find(n=>n.num==='5555')"))
        # PDF e XML
        await pg.evaluate("location.hash='ti-nota-nova'");await pg.wait_for_timeout(400)
        await pg.set_input_files('#tiFile','/tmp/nf961.pdf');await pg.wait_for_timeout(7000)
        r=await pg.evaluate("({n:TIE.itens.length,t:TIE.total,f:TIE.forn,msg:TIE_MSG})")
        ok('Ler PDF da DANFE (sem IA, sem internet)',r['n']==39 and r['t']==8726,f"{r['n']} itens, R$ {r['t']}, {r['f']}")
        await pg.evaluate("TIE=null;location.hash='ti-notas'");await pg.wait_for_timeout(300);await pg.evaluate("location.hash='ti-nota-nova'");await pg.wait_for_timeout(400)
        await pg.set_input_files('#tiFile','/tmp/nf.xml');await pg.wait_for_timeout(1500)
        r=await pg.evaluate("({n:TIE.itens.length,t:TIE.total,p:TIE.parc.length})")
        ok('Ler XML da NF-e (sem IA)',r['n']==2 and r['p']==2,str(r))
        open('/tmp/naonota.txt','w').write('isto nao e uma nota')
        await pg.evaluate("TIE=null;location.hash='ti-notas'");await pg.wait_for_timeout(300);await pg.evaluate("location.hash='ti-nota-nova'");await pg.wait_for_timeout(400)
        await pg.set_input_files('#tiFile','/tmp/naonota.txt');await pg.wait_for_timeout(800)
        m=await pg.evaluate("TIE_MSG");ok('Arquivo errado mostra aviso claro',m.startswith('!'),m[1:110])
        # Excel e print (dependem de internet)
        cdn.clear();await pg.evaluate("TI_NVIS='lista';location.hash='ti-notas';render()");await pg.wait_for_timeout(400)
        await pg.click('[data-tixls="notas"]');await pg.wait_for_timeout(1500)
        res['avisos'].append('Baixar Excel precisa da internet (biblioteca SheetJS): '+('pedido ao CDN feito' if any('xlsx' in u for u in cdn) else 'sem pedido'))
        dl=await pg.evaluate("window.XLSX&&XLSX.local?'gerador local':'nao'");ok('Baixar Excel sem internet',dl=='gerador local',dl)
        try:
            buf=await pg.evaluate("(()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{A:'ção',B:2.5}]),'T');return Array.from(XLSX.write(wb,{type:'array'}))})()")
            open('/tmp/teste.xlsx','wb').write(bytes(buf));import openpyxl;wb=openpyxl.load_workbook('/tmp/teste.xlsx');v=[c.value for c in wb.active[2]];ok('Excel gerado abre no Excel',v==['ção',2.5],str(v))
        except Exception as e:ok('Excel gerado abre no Excel',False,str(e)[:120])
        await pg.evaluate("location.hash='ti-custos'");await pg.wait_for_timeout(400)
        await pg.click('#b-copiar');await pg.wait_for_timeout(5000)
        im=await pg.evaluate("!!document.querySelector('#pmImg img')");ok('Print / Enviar sem internet',im)
        await pg.screenshot(path='printmodal.png')
        await pg.keyboard.press('Escape')
        # celular
        mob=await ctx.new_page();await mob.set_viewport_size({'width':390,'height':844});await mob.route('**/*googleapis*',lambda r:r.abort())
        mob.on('pageerror',lambda e:res['erros'].append('JS(celular): '+str(e)[:200]))
        await mob.goto(URL+'#portal');await mob.wait_for_timeout(1500)
        for h in ['portal','ti-custos','ti-notas','ti-nota-NF-961','ind-12','inicio','pat-painel','fc-painel']:
            await mob.evaluate(f"location.hash='{h}'");await mob.wait_for_timeout(400)
            of=await mob.evaluate("document.documentElement.scrollWidth-innerWidth")
            res['paginas'].append(('celular',h,0,[],of>2,of))
        await mob.evaluate("location.hash='ti-custos'");await mob.wait_for_timeout(500);await mob.screenshot(path='mob1.png')
        await b.close()
asyncio.run(main())
json.dump(res,open('/tmp/res.json','w'),ensure_ascii=False,indent=1)
print('carga',res['carga_s'],'s');print('ERROS:',len(res['erros']));[print(' ',e) for e in res['erros'][:20]]
pr=[x for x in res['paginas'] if x[3] or x[4] or (x[0]!='celular' and x[2]<40)]
print('PAGINAS COM PROBLEMA:',len(pr));[print(' ',x) for x in pr[:30]]
print('paginas testadas:',len(res['paginas']),'mais lenta:',max(res['paginas'],key=lambda x:x[5] if x[0]!='celular' else 0))
for f in res['fluxos']:print(f)
for a in res['avisos']:print('AVISO',a)
