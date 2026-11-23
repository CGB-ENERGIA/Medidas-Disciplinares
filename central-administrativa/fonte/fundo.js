/* ===== Fundo animado: rede elétrica da CGB (postes, subestações e pulsos de energia) ===== */
(function(){
  try{
  const cv=document.createElement('canvas');cv.id='fundoRede';cv.setAttribute('aria-hidden','true');cv.setAttribute('data-html2canvas-ignore','true');
  document.body.insertBefore(cv,document.body.firstChild);
  const cx=cv.getContext('2d');if(!cx)return;
  const reduz=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W=0,H=0,dpr=1,nos=[],pulsos=[],ult=0,rodando=true,raf=0;
  const escuro=()=>document.documentElement.getAttribute('data-tema')==='escuro';
  function cria(){
    dpr=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';cx.setTransform(dpr,0,0,dpr,0,0);
    const n=Math.max(28,Math.min(78,Math.round(W*H/19000)));nos=[];
    const cols=Math.ceil(Math.sqrt(n*W/H)),rows=Math.ceil(n/cols),gw=W/cols,gh=H/rows;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){if(nos.length>=n)break;
      nos.push({x:(c+.15+Math.random()*.7)*gw,y:(r+.15+Math.random()*.7)*gh,vx:(Math.random()-.5)*.12,vy:(Math.random()-.5)*.12,
        sub:Math.random()<.14,fase:Math.random()*6.28,viz:[],brilho:0})}
    liga();pulsos=[];for(let k=0;k<7;k++)novoPulso()}
  function liga(){const D=Math.min(W,H)*.26;
    for(const a of nos){a.viz=nos.filter(b=>b!==a).map(b=>({b,d:Math.hypot(a.x-b.x,a.y-b.y)})).filter(o=>o.d<D).sort((p,q)=>p.d-q.d).slice(0,a.sub?5:3).map(o=>o.b)}}
  function novoPulso(de){const a=de||nos[Math.floor(Math.random()*nos.length)];if(!a||!a.viz.length)return;const b=a.viz[Math.floor(Math.random()*a.viz.length)];
    pulsos.push({a,b,t:0,v:.006+Math.random()*.008,vidas:2+Math.floor(Math.random()*5)})}
  function losango(x,y,s){cx.beginPath();cx.moveTo(x,y-s);cx.lineTo(x+s,y);cx.lineTo(x,y+s);cx.lineTo(x-s,y);cx.closePath()}
  function desenha(t){
    const esc=escuro(),L=esc?'176,58,82':'113,20,36',P=esc?'232,120,145':'163,33,58';
    cx.clearRect(0,0,W,H);
    /* cabos */
    const vistos=new Set();
    for(const a of nos)for(const b of a.viz){const k=a.x<b.x?a.x+','+b.x:b.x+','+a.x;if(vistos.has(k))continue;vistos.add(k);
      const d=Math.hypot(a.x-b.x,a.y-b.y),al=Math.max(0,.5-d/(Math.min(W,H)*.6))*(esc?.75:.65);
      cx.strokeStyle='rgba('+L+','+al.toFixed(3)+')';cx.lineWidth=(a.sub||b.sub)?1:.7;cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke()}
    /* postes e subestações */
    for(const a of nos){const pis=.5+.5*Math.sin(t/900+a.fase),br=a.brilho;a.brilho*=.94;
      if(a.sub){const s=5+pis*1.2+br*3;losango(a.x,a.y,s);cx.fillStyle='rgba('+L+','+(.10+br*.25)+')';cx.fill();cx.strokeStyle='rgba('+L+','+(.38+br*.4)+')';cx.lineWidth=1.2;cx.stroke();
        losango(a.x,a.y,s*.38);cx.fillStyle='rgba('+P+','+(.45+br*.5)+')';cx.fill()}
      else{cx.beginPath();cx.arc(a.x,a.y,1.6+br*2.4,0,6.283);cx.fillStyle='rgba('+L+','+(.32+pis*.12+br*.5)+')';cx.fill()}}
    /* pulsos de energia */
    for(const p of pulsos){const x=p.a.x+(p.b.x-p.a.x)*p.t,y=p.a.y+(p.b.y-p.a.y)*p.t,tx=p.a.x+(p.b.x-p.a.x)*Math.max(0,p.t-.18),ty=p.a.y+(p.b.y-p.a.y)*Math.max(0,p.t-.18);
      const g=cx.createLinearGradient(tx,ty,x,y);g.addColorStop(0,'rgba('+P+',0)');g.addColorStop(1,'rgba('+P+','+(esc?.85:.7)+')');
      cx.strokeStyle=g;cx.lineWidth=2;cx.lineCap='round';cx.beginPath();cx.moveTo(tx,ty);cx.lineTo(x,y);cx.stroke();
      const r=cx.createRadialGradient(x,y,0,x,y,7);r.addColorStop(0,'rgba('+P+','+(esc?.9:.75)+')');r.addColorStop(1,'rgba('+P+',0)');cx.fillStyle=r;cx.beginPath();cx.arc(x,y,7,0,6.283);cx.fill()}}
  function passo(t){if(!rodando)return;raf=requestAnimationFrame(passo);if(t-ult<33)return;const dt=Math.min(3,(t-ult)/16.7);ult=t;
    for(const a of nos){a.x+=a.vx*dt;a.y+=a.vy*dt;if(a.x<-20||a.x>W+20)a.vx*=-1;if(a.y<-20||a.y>H+20)a.vy*=-1}
    if(Math.round(t/1500)!==Math.round((t-33)/1500))liga();
    for(let i=pulsos.length-1;i>=0;i--){const p=pulsos[i];p.t+=p.v*dt;if(p.t>=1){p.b.brilho=1;pulsos.splice(i,1);if(p.vidas>1){const nx=p.b.viz.filter(z=>z!==p.a);const q=nx.length?nx:p.b.viz;if(q.length)pulsos.push({a:p.b,b:q[Math.floor(Math.random()*q.length)],t:0,v:p.v,vidas:p.vidas-1})}}}
    while(pulsos.length<7)novoPulso();
    desenha(t)}
  cria();
  if(reduz){desenha(0)}else raf=requestAnimationFrame(passo);
  let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{cria();if(reduz)desenha(0)},200)});
  document.addEventListener('visibilitychange',()=>{if(reduz)return;if(document.hidden){rodando=false;cancelAnimationFrame(raf)}else if(!rodando){rodando=true;ult=0;raf=requestAnimationFrame(passo)}});
  new MutationObserver(()=>{if(reduz)desenha(0)}).observe(document.documentElement,{attributes:true,attributeFilter:['data-tema']});
  }catch(e){}
})();
/* ===== Topo animado: um desenho para cada área, conforme a atividade ===== */
(function(){
  try{
  const top=document.querySelector('header.top');if(!top)return;
  const cv=document.createElement('canvas');cv.className='topoCirc';cv.setAttribute('aria-hidden','true');cv.setAttribute('data-html2canvas-ignore','true');
  top.insertBefore(cv,top.firstChild);const cx=cv.getContext('2d');if(!cx)return;
  const reduz=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W=0,H=0,dpr=1,ult=0,rodando=true,raf=0,cena=null,area='';
  const R=(a,b)=>a+Math.random()*(b-a),B=a=>'rgba(255,255,255,'+a+')',ROSA=a=>'rgba(255,214,224,'+a+')';
  function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
  const CENAS={
  /* Rede de pontos conectados, igual à tela de entrada */
  rede(){const n=Math.max(14,Math.round(W/55)),P=Array.from({length:n},()=>({x:R(0,W),y:R(0,H),vx:R(-.18,.18),vy:R(-.12,.12)}));const L=130;
    return {step(dt){for(const p of P){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1}},
      draw(){cx.lineWidth=1;for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const a=P[i],b=P[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<L){cx.strokeStyle='rgba(255,210,220,'+(0.22*(1-d/L))+')';cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke()}}
        for(const p of P){cx.fillStyle='rgba(255,220,228,.7)';cx.beginPath();cx.arc(p.x,p.y,1.8,0,6.283);cx.fill()}}}},
  /* Setor de TI: trilhas de placa de circuito com pacotes de dados */
  ti(){let tr=[],pk=[];
    function trilha(){const pts=[];let x=R(-W*.05,W*1.05),y=Math.round(R(.15,.85)*H/4)*4;pts.push([x,y]);const d=Math.random()<.5?1:-1;let n=3+Math.floor(R(0,4));
      while(n--){x+=d*R(30,150);pts.push([x,y]);if(Math.random()<.6){const ny=Math.max(6,Math.min(H-6,y+(Math.random()<.5?-1:1)*(8+Math.round(R(0,3))*4)));x+=d*Math.abs(ny-y);y=ny;pts.push([x,y])}}
      const seg=[];let L=0;for(let i=1;i<pts.length;i++){const q=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(q);L+=q}return {pts,seg,L,via:Math.random()<.5}}
    const pt=(t,s)=>{let a=s;for(let i=0;i<t.seg.length;i++){if(a<=t.seg[i]){const f=a/t.seg[i],p=t.pts[i],q=t.pts[i+1];return [p[0]+(q[0]-p[0])*f,p[1]+(q[1]-p[1])*f]}a-=t.seg[i]}return t.pts[t.pts.length-1]};
    for(let i=0;i<Math.max(8,W/70);i++)tr.push(trilha());
    return {step(dt){for(let i=pk.length-1;i>=0;i--){pk[i].s+=pk[i].v*dt;if(pk[i].s>pk[i].t.L+26)pk.splice(i,1)}while(pk.length<Math.max(5,W/240))pk.push({t:tr[Math.floor(R(0,tr.length))],s:0,v:R(.9,2.5)})},
      draw(){cx.lineWidth=1;cx.strokeStyle=B(.075);for(const t of tr){cx.beginPath();cx.moveTo(...t.pts[0]);for(const p of t.pts.slice(1))cx.lineTo(...p);cx.stroke();const e=t.pts[t.pts.length-1];cx.beginPath();cx.arc(e[0],e[1],2.2,0,6.283);cx.fillStyle=B(.12);cx.fill();if(t.via){cx.beginPath();cx.arc(t.pts[0][0],t.pts[0][1],2.6,0,6.283);cx.strokeStyle=B(.14);cx.stroke();cx.strokeStyle=B(.075)}}
        for(const p of pk){const [x,y]=pt(p.t,p.s);cx.strokeStyle=ROSA(.55);cx.lineWidth=1.6;cx.lineCap='round';cx.beginPath();let f=true;for(let s=Math.max(0,p.s-26);s<=p.s;s+=3){const q=pt(p.t,s);f?cx.moveTo(q[0],q[1]):cx.lineTo(q[0],q[1]);f=false}cx.stroke();cx.fillStyle=B(.9);cx.fillRect(x-1.5,y-1.5,3,3)}}}},
  /* Patrimônio: etiquetas de patrimônio (código de barras) e o feixe do leitor passando */
  pat(){const tags=[];const n=Math.max(10,Math.round(W/110));
    for(let i=0;i<n;i++){const w=R(30,46),h=R(14,20);tags.push({x:(i+R(.1,.6))*W/n,y:R(6,H-h-6),w,h,bar:Array.from({length:Math.round(w/3)},()=>Math.random()<.65?R(.6,2.2):0),lido:0})}
    let fx=-80;
    return {step(dt){fx+=1.6*dt;if(fx>W+80)fx=-80;for(const t of tags){if(Math.abs(fx-(t.x+t.w/2))<t.w/2)t.lido=1;else t.lido*=.985}},
      draw(){for(const t of tags){const a=.07+t.lido*.18;rr(t.x,t.y,t.w,t.h,3);cx.strokeStyle=B(a+.04);cx.lineWidth=1;cx.stroke();let x=t.x+4;for(const b of t.bar){if(b){cx.fillStyle=B(a+.06);cx.fillRect(x,t.y+3,b,t.h-8)}x+=3;if(x>t.x+t.w-4)break}
          if(t.lido>.2){cx.strokeStyle=ROSA(t.lido*.9);cx.lineWidth=1.8;cx.beginPath();cx.moveTo(t.x+t.w+3,t.y+t.h/2);cx.lineTo(t.x+t.w+6,t.y+t.h/2+3);cx.lineTo(t.x+t.w+12,t.y+t.h/2-4);cx.stroke()}}
        const g=cx.createLinearGradient(fx-40,0,fx+4,0);g.addColorStop(0,ROSA(0));g.addColorStop(1,ROSA(.16));cx.fillStyle=g;cx.fillRect(fx-40,0,44,H);cx.fillStyle=ROSA(.55);cx.fillRect(fx,0,1.5,H)}}},
  /* Hospedagem / Alimentação: rotas entre as bases, com equipes em deslocamento */
  hosp(){const bases=[];const n=Math.max(6,Math.round(W/190));for(let i=0;i<n;i++)bases.push({x:(i+R(.25,.75))*W/n,y:R(.3,.7)*H,f:R(0,6)});
    const rotas=[];for(let i=0;i<bases.length-1;i++){const a=bases[i],b=bases[i+1];rotas.push({a,b,c:[(a.x+b.x)/2,R(.1,.9)*H]})}
    const qp=(r,t)=>{const u=1-t;return [u*u*r.a.x+2*u*t*r.c[0]+t*t*r.b.x,u*u*r.a.y+2*u*t*r.c[1]+t*t*r.b.y]};const vs=[];
    return {step(dt){for(let i=vs.length-1;i>=0;i--){vs[i].t+=vs[i].v*dt;if(vs[i].t>=1){vs[i].r.b.chega=1;vs.splice(i,1)}}while(vs.length<Math.max(3,rotas.length*.7)){const r=rotas[Math.floor(R(0,rotas.length))];vs.push({r,t:0,v:R(.0025,.005)})}for(const b of bases)b.chega=(b.chega||0)*.97},
      draw(t){cx.setLineDash([3,5]);cx.lineWidth=1.2;cx.strokeStyle=B(.13);for(const r of rotas){cx.beginPath();cx.moveTo(r.a.x,r.a.y);cx.quadraticCurveTo(r.c[0],r.c[1],r.b.x,r.b.y);cx.stroke()}cx.setLineDash([]);
        for(const b of bases){const p=1+.15*Math.sin(t/700+b.f)+(b.chega||0)*.4;cx.fillStyle=B(.16+(b.chega||0)*.4);cx.beginPath();cx.arc(b.x,b.y-6*p,4*p,Math.PI*.85,Math.PI*.15,false);cx.lineTo(b.x,b.y);cx.closePath();cx.fill();cx.beginPath();cx.arc(b.x,b.y-6*p,1.5*p,0,6.283);cx.fillStyle=B(.35);cx.fill();cx.beginPath();cx.ellipse(b.x,b.y+1,6*p,2,0,0,6.283);cx.fillStyle=B(.06);cx.fill()}
        for(const v of vs){const [x,y]=qp(v.r,v.t),[x2,y2]=qp(v.r,Math.max(0,v.t-.06));cx.strokeStyle=ROSA(.5);cx.lineWidth=2;cx.lineCap='round';cx.beginPath();cx.moveTo(x2,y2);cx.lineTo(x,y);cx.stroke();rr(x-4,y-3,8,6,2);cx.fillStyle=B(.85);cx.fill()}}}},
  /* Fale Conosco: balões de conversa subindo, alguns "digitando" */
  fc(){const bs=[];const novo=(y0)=>({x:R(0,W),y:y0==null?H+R(0,20):y0,w:R(26,50),h:R(13,18),v:R(.12,.3),dig:Math.random()<.45,lado:Math.random()<.5?1:-1,f:R(0,6)});
    for(let i=0;i<Math.max(10,W/120);i++)bs.push(novo(R(-10,H)));
    return {step(dt){for(let i=0;i<bs.length;i++){bs[i].y-=bs[i].v*dt;if(bs[i].y<-24)bs[i]=novo()}},
      draw(t){for(const b of bs){const a=Math.max(0,Math.min(1,(b.y+20)/(H*.6)))*.16;rr(b.x,b.y,b.w,b.h,7);cx.strokeStyle=B(a+.05);cx.lineWidth=1;cx.stroke();cx.fillStyle=B(a*.5);cx.fill();
          const tx=b.lado>0?b.x+8:b.x+b.w-8;cx.beginPath();cx.moveTo(tx-3,b.y+b.h-.5);cx.lineTo(tx-b.lado*2,b.y+b.h+5);cx.lineTo(tx+3,b.y+b.h-.5);cx.fillStyle=B(a+.05);cx.fill();
          if(b.dig){for(let k=0;k<3;k++){const s=.5+.5*Math.sin(t/180-k*.9+b.f);cx.beginPath();cx.arc(b.x+b.w/2+(k-1)*6,b.y+b.h/2,1.3+s*.6,0,6.283);cx.fillStyle=ROSA(.25+s*.5);cx.fill()}}
          else{cx.fillStyle=B(a+.08);cx.fillRect(b.x+6,b.y+b.h/2-1,b.w-14,2)}}}}},
  /* Administrativo: linhas de transmissão com pulsos de energia */
  adm(){const postes=[];const n=Math.max(6,Math.round(W/160));for(let i=0;i<=n;i++)postes.push(i*W/n+R(-15,15));
    const fios=[.32,.5,.68].map((k,j)=>({y:H*k,sag:R(5,9),j}));const pul=[];
    const fy=(f,x)=>{let i=0;while(i<postes.length-1&&postes[i+1]<x)i++;const a=postes[i],b=postes[i+1]||W,u=(x-a)/((b-a)||1);return f.y+f.sag*4*u*(1-u)};
    return {step(dt){for(let i=pul.length-1;i>=0;i--){pul[i].x+=pul[i].v*dt;if(pul[i].x>W+30||pul[i].x<-30)pul.splice(i,1)}while(pul.length<5){const d=Math.random()<.7?1:-1;pul.push({f:fios[Math.floor(R(0,3))],x:d>0?-20:W+20,v:d*R(1.6,3.2)})}},
      draw(){cx.strokeStyle=B(.12);cx.lineWidth=1;for(const x of postes){cx.beginPath();cx.moveTo(x,H*.18);cx.lineTo(x,H);cx.stroke();cx.beginPath();cx.moveTo(x-10,H*.3);cx.lineTo(x+10,H*.3);cx.stroke()}
        for(const f of fios){cx.beginPath();for(let x=0;x<=W;x+=8){const y=fy(f,x);x?cx.lineTo(x,y):cx.moveTo(x,y)}cx.strokeStyle=B(.09);cx.stroke()}
        for(const p of pul){const s=Math.sign(p.v);cx.lineWidth=2;cx.lineCap='round';cx.strokeStyle=ROSA(.55);cx.beginPath();for(let k=0;k<=30;k+=3){const x=p.x-s*k,y=fy(p.f,x);k?cx.lineTo(x,y):cx.moveTo(x,y)}cx.stroke();const y=fy(p.f,p.x);const g=cx.createRadialGradient(p.x,y,0,p.x,y,8);g.addColorStop(0,B(.9));g.addColorStop(1,B(0));cx.fillStyle=g;cx.beginPath();cx.arc(p.x,y,8,0,6.283);cx.fill()}}}}
  };
  const qual=()=>'rede';
  function cria(){const r=top.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';cx.setTransform(dpr,0,0,dpr,0,0);area=qual();cena=CENAS[area]()}
  function quadro(t){if(qual()!==area)cria();cx.clearRect(0,0,W,H);cena.draw(t||0)}
  function passo(t){if(!rodando)return;raf=requestAnimationFrame(passo);if(t-ult<33)return;const dt=Math.min(3,(t-ult)/16.7);ult=t;if(qual()!==area)cria();cena.step(dt);quadro(t)}
  cria();if(reduz){quadro(0);new MutationObserver(()=>quadro(0)).observe(document.body,{attributes:true,attributeFilter:['data-area']})}else raf=requestAnimationFrame(passo);
  let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{cria();quadro(0)},200)});
  document.addEventListener('visibilitychange',()=>{if(reduz)return;if(document.hidden){rodando=false;cancelAnimationFrame(raf)}else if(!rodando){rodando=true;ult=0;raf=requestAnimationFrame(passo)}});
  }catch(e){}
})();
