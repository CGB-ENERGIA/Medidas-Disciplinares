import asyncio,json,sys
from playwright.async_api import async_playwright
JS="""(()=>{const m=document.getElementById('main');const out={cut:[],ell:0,bal:[],ovf:document.documentElement.scrollWidth>innerWidth+2};
m.querySelectorAll('.tw,.panel,.tirank,.lvenc').forEach(e=>{if(e.scrollWidth>e.clientWidth+3){const p=e.closest('.panel');const h=p&&p.querySelector('h3');out.cut.push((h?h.textContent:'?')+' '+e.className.split(' ')[0]+' '+e.scrollWidth+'>'+e.clientWidth)}});
let n=0;m.querySelectorAll('*').forEach(e=>{const cs=getComputedStyle(e);if(cs.textOverflow==='ellipsis'&&e.scrollWidth>e.clientWidth+1)n++});out.ell=n;
m.querySelectorAll('.xg2,.xg2b,.xg3').forEach(g=>{const ps=[...g.children].filter(c=>c.offsetHeight);if(ps.length<2)return;const hs=ps.map(p=>{const inner=[...p.children].reduce((s,c)=>s+c.offsetHeight,0);return inner});const mx=Math.max(...hs),mn=Math.min(...hs);if(mx>mn*1.45&&mx-mn>160){out.bal.push(ps.map(p=>(p.querySelector('h3')||{}).textContent).join(' | ')+' '+hs.join('/'))}});
return out})()"""
async def main():
  W=int(sys.argv[1]) if len(sys.argv)>1 else 1695
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page(viewport={'width':W,'height':900})
    await pg.goto(''+__import__('pathlib').Path('central-hospedagem.html').resolve().as_uri()+'#inicio');await pg.wait_for_timeout(2500)
    if W>=1300:
      await pg.evaluate("document.body.classList.contains('rail-pin')||document.getElementById('b-railpin')&&document.getElementById('b-railpin').click()");await pg.wait_for_timeout(400)
    print('main width',await pg.evaluate("document.getElementById('main').clientWidth"))
    ids=await pg.evaluate("PAGS().filter(p=>!p.hide).map(p=>p.id)")
    for h in ids:
      await pg.evaluate(f"location.hash='{h}'");await pg.wait_for_timeout(500)
      r=await pg.evaluate(JS)
      if r['cut'] or r['bal'] or r['ovf'] or r['ell']:print(h,json.dumps(r,ensure_ascii=False))
    await b.close()
asyncio.run(main())
