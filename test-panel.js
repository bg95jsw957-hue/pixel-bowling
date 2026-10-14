// Pixel Bowling physics TEST panel (loaded only by test.html). Uses the game's global lets.
(function(){"use strict";
const MPS=120*0.0254*41.5/42, MPH=MPS*2.23694;
// seeded RNG so "repeat last throw" is exact
let seed=12345;const srng=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
__test.setRng(srng);
// skip family start screen
const SUx=document.getElementById('setup');if(SUx)SUx.classList.add('hide');if(__test.state==='setup')__test.reset();
const P=[ // [var, label, min, max, step, getter, setter]
 ['SP_MIN','Speed min',0.2,2,0.05],['SP_MAX','Speed max',0.4,3,0.05],['M_BALL','Ball mass',4,30,0.5],['M_PIN','Pin mass',1,8,0.1],
 ['REV_MAX','Hook strength',0,4,0.05],['MU_OIL','Oil friction (front)',0.0002,0.01,0.0001],['MU_DRY','Backend friction',0.002,0.04,0.0005],
 ['OIL_END','Oil ends at lane y (foul 175, pins 22)',22,175,1],['OIL_EDGE','Edge/middle friction (crown)',1,6,0.1],
 ['TOPPLE_J','Pin topple impulse',0.2,3,0.05],['V_TIP','Pin topple speed',0.02,0.4,0.01],['E_PP','Pin-pin restitution',0,1,0.02],['E_BP','Ball-pin restitution',0,1,0.02],
 ['SETTLE','Settle cap (s)',0.5,6,0.1]];
const get=n=>n==='SETTLE'?SETTLE/120:eval(n), set=(n,v)=>{if(n==='SETTLE')SETTLE=Math.round(v*120);else{eval(n+'='+(+v));if(n==='M_PIN')I_LY=M_PIN*15*15/12;}};
const DEF={};P.forEach(p=>DEF[p[0]]=get(p[0]));
const css=document.createElement('style');css.textContent=`#tp{position:fixed;left:0;right:0;bottom:0;max-height:55vh;overflow-y:auto;-webkit-overflow-scrolling:touch;background:rgba(10,6,24,.93);color:#fff;font:12px/1.2 -apple-system,monospace;z-index:6;padding:6px 8px 20px;display:none}
#tp.on{display:block}#tp .r{display:grid;grid-template-columns:1fr 64px;gap:2px 6px;margin:5px 0}#tp label{grid-column:1/3;color:#ffd84a}#tp input[type=range]{width:100%;height:28px}#tp input[type=number]{width:60px;font-size:16px}
#tb{position:fixed;top:calc(env(safe-area-inset-top) + 62px);left:6px;z-index:7;display:flex;flex-wrap:wrap;gap:4px;max-width:98vw}#tb button{font:bold 12px monospace;padding:7px 8px;border:2px solid #000;border-radius:5px;background:#ffd84a}
#ro{position:fixed;top:calc(env(safe-area-inset-top) + 100px);left:6px;z-index:7;background:rgba(0,0,0,.65);color:#5ae0ff;font:bold 12px monospace;padding:4px 6px;border-radius:4px;pointer-events:none;white-space:pre}
#om{position:fixed;right:6px;top:calc(env(safe-area-inset-top) + 100px);z-index:7;border:2px solid #ffd84a;display:none;image-rendering:pixelated;width:84px;height:300px}#om.on{display:block}
#cp{position:fixed;inset:10% 6%;z-index:9;background:#111;color:#0f0;font:12px monospace;display:none;padding:8px}#cp.on{display:block}#cp textarea{width:100%;height:80%;font-size:13px}`;
document.head.append(css);
const tb=document.createElement('div');tb.id='tb';const B=(t,f)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.onclick=e=>{e.stopPropagation();f(b);};tb.append(b);return b;};
const tp=document.createElement('div');tp.id='tp';const ro=document.createElement('div');ro.id='ro';const om=document.createElement('canvas');om.id='om';om.width=42;om.height=150;
const cp=document.createElement('div');cp.id='cp';cp.innerHTML='<textarea readonly></textarea><br><button type="button">CLOSE</button>';
document.body.append(tb,tp,ro,om,cp);
for(const el of [tp,tb,cp,ro,om])for(const ev of ['pointerdown','touchstart'])el.addEventListener(ev,e=>e.stopPropagation(),{passive:true});
tp.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});cp.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});
const inputs={};
for(const [n,lbl,mn,mx,st] of P){const r=document.createElement('div');r.className='r';r.innerHTML=`<label>${lbl} <small>(${n})</small></label>`;
 const rg=document.createElement('input');rg.type='range';rg.min=mn;rg.max=mx;rg.step=st;const nb=document.createElement('input');nb.type='number';nb.step=st;
 const upd=v=>{set(n,v);rg.value=v;nb.value=(+v).toPrecision(4);drawOil();};rg.oninput=()=>upd(rg.value);nb.onchange=()=>upd(nb.value);rg.value=nb.value=get(n);inputs[n]=upd;r.append(rg,nb);tp.append(r);}
B('TUNE',()=>tp.classList.toggle('on'));
const sl=[1,0.5,0.25];let si=0;B('SPEED 1x',b=>{si=(si+1)%3;SLOMO=sl[si];b.textContent='SPEED '+sl[si]+'x';});
B('RE-RACK',()=>{__test.setupBall(true);});
let last=null;
const L0=window.launch;window.launch=function(pv,sv){last={x:ball.x,tx:aim.tx,pv,sv,seed};entry=null;launchV=null;const r=L0(pv,sv);launchV=Math.hypot(ball.vx,ball.vy);return r;};
B('REPEAT',()=>{if(!last)return;__test.setupBall(true);seed=last.seed;aim.x=last.x;ball.x=last.x;aim.tx=last.tx;lockSpin=last.sv;lockPow=last.pv;launch(last.pv,last.sv);});
B('OIL MAP',()=>{om.classList.toggle('on');drawOil();});
B('COPY',()=>{const o={};P.forEach(p=>o[p[0]]=+(+get(p[0])).toPrecision(4));const t=JSON.stringify(o,null,1);cp.querySelector('textarea').value=t;cp.classList.add('on');try{navigator.clipboard&&navigator.clipboard.writeText(t);}catch(e){}});
B('DEFAULTS',()=>{for(const k in DEF)inputs[k](DEF[k]);});
cp.querySelector('button').onclick=()=>cp.classList.remove('on');
// readout
let entry=null,launchV=null;const PIN1Y=PIN_Y+3*SP*0.866;
function drawOil(){const x=om.getContext('2d');const lo=Math.min(MU_OIL,MU_DRY),hi=Math.max(MU_DRY,MU_OIL*OIL_EDGE);
 for(let yy=0;yy<150;yy++)for(let xx=0;xx<42;xx++){const ly=22+yy/150*153,mu=oilMu(LX+xx+0.5,ly),t=(mu-lo)/(hi-lo||1);x.fillStyle=`rgb(${Math.round(60+180*t)},${Math.round(90+120*t)},${Math.round(230-200*t)})`;x.fillRect(xx,yy,1,1);}}
function tick(){const b=ball;if(b&&state==='roll'&&entry===null&&b.y<=PIN1Y+BR+PR+0.5)entry=Math.atan2(-b.vx,-b.vy)*180/Math.PI;
 const down=pins?pins.filter(p=>p.down).length:0;ro.textContent=`speed ${launchV==null?'-':(launchV*MPH).toFixed(1)+' mph'}\nentry ${entry==null?'-':entry.toFixed(1)+' deg'}${entry!=null?(entry>0?' (L)':' (R)'):''}\npins down ${down}\nslow-mo ${SLOMO}x`;
 if(om.classList.contains('on')&&b&&state==='roll'){const x=om.getContext('2d');x.fillStyle='#fff';x.fillRect(Math.round(b.x-LX),Math.round((b.y-22)/153*150),1,1);}
 requestAnimationFrame(tick);}
tick();drawOil();
// faint oil sheen over the lane, stronger where oil is heavier (crown)
const DB=window.drawBumpers;window.drawBumpers=function(){DB();const ys=[];for(let ly=Math.max(OIL_END,PIN_Y);ly<=175;ly+=4)ys.push(ly);
 for(let i=0;i<10;i++){const x0=LX+i*4.2,x1=x0+4.2,mu=oilMu((x0+x1)/2,START_Y);const a=Math.max(0,Math.min(0.16,0.0005/mu));g.globalAlpha=a;g.fillStyle='#bfe8ff';
  g.beginPath();const p1=proj(x0,OIL_END),p2=proj(x1,OIL_END),p3=proj(x1,175),p4=proj(x0,175);g.moveTo(p1.x,p1.y);g.lineTo(p2.x,p2.y);g.lineTo(p3.x,p3.y);g.lineTo(p4.x,p4.y);g.closePath();g.fill();}g.globalAlpha=1;};
window.__tp={P,get:get,set:set,get last(){return last},get entry(){return entry}};
})();
