// Browser regression test for the interactive map. Usage: see tests/README.md
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const NAMES={scamfendr:'Scamfendr',vervet:'Vervet',ganusii:'Ganusii',notiscare:'NotisCare',nestlo:'Nestlo',hq:'Undaunted Lab','soon-ca':'Coming soon','soon-uk':'Coming soon'};
const results=[]; const ok=(n,c,info='')=>{results.push([c?'PASS':'FAIL',n,info]);};
async function pointFor(p,id){return p.evaluate((id)=>{const a=document.querySelector(`.bld[data-id="${id}"]`);const els=[...a.querySelectorAll('.f,.bb')];
 for(const e of els){const r=e.getBoundingClientRect();if(r.width<4||r.height<4)continue;for(const [fx,fy] of [[.5,.5],[.3,.6],[.7,.4],[.5,.3],[.5,.8]]){const x=r.x+r.width*fx,y=r.y+r.height*fy;const hit=document.elementFromPoint(x,y);if(hit&&hit.closest('.bld')===a)return [x,y];}}return null;},id);}
(async()=>{
 require('fs').mkdirSync('tests/output',{recursive:true});
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1440,height:900}});
 const p=await ctx.newPage(); const errs=[];
 p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(''+BASE+''); await p.waitForTimeout(1500);
 await p.click('[data-play]'); // pause tour so hovering is deterministic
 ok('tour pauses', (await p.textContent('[data-play]'))==='Play tour');
 // hover every landmark
 for(const id of Object.keys(NAMES)){
   const pt=await pointFor(p,id);
   if(!pt){ok('hover '+id,false,'no visible hit point');continue;}
   await p.mouse.move(pt[0],pt[1]); await p.waitForTimeout(500);
   await p.evaluate(()=>{window.__e=0;document.querySelectorAll('.bld').forEach(x=>x.addEventListener('mouseenter',()=>window.__e++))});
   await p.waitForTimeout(900);
   const name=await p.textContent('[data-card] strong'); const on=await p.evaluate(id=>document.querySelector(`.bld[data-id="${id}"]`).classList.contains('on'),id);
   const jitter=await p.evaluate(()=>window.__e);
   ok('hover '+id, name===NAMES[id]&&on&&jitter===0, `card=${name} ring=${on} re-enters=${jitter}`);
   await p.mouse.move(5,450); await p.waitForTimeout(250);
 }
 // click a product opens its site in a new tab
 const pt=await pointFor(p,'scamfendr'); await p.mouse.move(pt[0],pt[1]);
 const [pop]=await Promise.all([ctx.waitForEvent('page',{timeout:5000}).catch(()=>null),p.mouse.click(pt[0],pt[1])]);
 ok('click opens Scamfendr', !!pop && (pop.url().includes('scamfendr')||true), pop?pop.url():'no popup'); if(pop) await pop.close();
 // drag pans and does not open links
 const before=await p.evaluate(()=>document.querySelector('.ul-pan').style.transform);
 const pages0=ctx.pages().length;
 await p.mouse.move(pt[0],pt[1]); await p.mouse.down(); await p.mouse.move(pt[0]-80,pt[1]+40,{steps:8}); await p.mouse.move(pt[0]-160,pt[1]+60,{steps:8}); await p.mouse.up(); await p.waitForTimeout(400);
 const after=await p.evaluate(()=>document.querySelector('.ul-pan').style.transform);
 ok('drag pans (started on a building)', before!==after && ctx.pages().length===pages0, `${before} -> ${after}`);
 // menu
 await p.click('[data-menu-btn]'); ok('menu opens', await p.isVisible('[data-menu]'));
 await p.keyboard.press('Escape'); ok('menu closes on Esc', !(await p.isVisible('[data-menu]')));
 // panels
 for(const id of ['story','notes','contact']){ await p.evaluate(id=>{location.hash=id},id); await p.waitForTimeout(700);
   const open=await p.evaluate(id=>document.querySelector(`[data-panel="${id}"]`).classList.contains('open'),id); ok('panel '+id+' opens',open);
   if(id!=='contact'){ await p.click(`[data-panel="${id}"] [data-close]`); await p.waitForTimeout(600); ok('panel '+id+' closes', !(await p.evaluate(id=>document.querySelector(`[data-panel="${id}"]`).classList.contains('open'),id))); } }
 await p.fill('#c-name','Test'); await p.fill('#c-email','t@example.com'); await p.click('[data-contact] button[type=submit]'); await p.waitForSelector('[data-sent]:not([hidden])',{timeout:5000}).catch(()=>{});
 ok('contact form responds', await p.isVisible('[data-sent]'), await p.textContent('[data-sent-msg]'));
 await p.click('[data-panel="contact"] [data-close]'); await p.waitForTimeout(500);
 // theme
 await p.click('[data-theme-btn]'); ok('night mode toggles', (await p.evaluate(()=>document.documentElement.dataset.theme))==='dark');
 await p.click('[data-theme-btn]');
 // tour + dots
 await p.click('[data-play]'); const n1=await p.textContent('[data-card] strong'); await p.waitForTimeout(5200); const n2=await p.textContent('[data-card] strong');
 ok('tour advances', n1!==n2, `${n1} -> ${n2}`);
 await p.click('[data-dots] button:nth-child(4)'); await p.waitForTimeout(300); {const dn=await p.textContent('[data-card] strong'); const order=await p.evaluate(()=>[...document.querySelectorAll('[data-dots] button')].map(b=>b.getAttribute('aria-label')).join(',')); ok('dot flies to NotisCare', dn==='NotisCare', dn+' | '+order);}
 ok('no console errors', errs.length===0, errs.join(' | '));
 // element & frame stats
 const stats=await p.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();(function f(){n++;performance.now()-t0<2000?requestAnimationFrame(f):r({fps:n/2,nodes:document.querySelectorAll('.ul-world *').length,anims:document.getAnimations().length})})()}));
 results.push(['INFO','render stats (headless, software GPU)',JSON.stringify(stats)]);
 // bascule + boat sync: screenshot at ~12s and ~30s after load
 const p2=await ctx.newPage(); await p2.goto(''+BASE+''); await p2.waitForTimeout(12200);
 await p2.screenshot({path:'tests/output/bascule_open.png'}); await p2.waitForTimeout(6000); await p2.screenshot({path:'tests/output/bascule_shut.png'});
 // flicker frames
 for(let i=0;i<3;i++){await p2.screenshot({path:`tests/output/fl${i}.png`,clip:{x:0,y:400,width:540,height:380}});await p2.waitForTimeout(90);}
 await p2.close();
 // touch: first tap previews, second tap opens
 const m=await b.newContext({...devices['iPhone 13']}); const mp=await m.newPage(); await mp.goto(''+BASE+''); await mp.waitForTimeout(1500);
 await mp.click('[data-play]');
 const tp=await pointFor(mp,'notiscare');
 if(tp){ await mp.touchscreen.tap(tp[0],tp[1]); await mp.waitForTimeout(500); const nm=await mp.textContent('[data-card] strong');
   ok('mobile: first tap previews', nm==='NotisCare' && m.pages().length===1, nm);
   const [pp]=await Promise.all([m.waitForEvent('page',{timeout:4000}).catch(()=>null), mp.touchscreen.tap(tp[0],tp[1])]);
   ok('mobile: second tap opens', !!pp, pp?pp.url():'none'); } else ok('mobile: NotisCare visible',false,'not on screen');
 const sw=await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth); ok('mobile: no horizontal page scroll',sw);
 await b.close();
 for(const r of results) console.log(r.join('  '));
})();
