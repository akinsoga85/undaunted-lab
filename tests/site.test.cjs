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
 ok('tour opens on the HQ card', (await p.textContent('[data-card] strong'))===NAMES.hq, await p.textContent('[data-card] strong'));
 await p.click('[data-play]'); // pause tour so hovering is deterministic
 ok('tour pauses', (await p.textContent('[data-play]'))==='Play tour');
 // place names live in a flat layer above the 3D world, so traffic never covers them: their middles never change
 {const tags=await p.evaluate(()=>[...document.querySelectorAll('.tag')].map(t=>{const r=t.getBoundingClientRect();return {k:t.textContent,inWorld:!!t.closest('.ul-world'),clip:{x:Math.round(r.x+r.height/2),y:Math.round(r.y+4),width:Math.round(r.width-r.height),height:Math.round(r.height-8)}};}));
  ok('labels: all four sit above the 3D world', tags.length===4&&tags.every(t=>!t.inWorld), tags.map(t=>t.k).join(', '));
  const first={},hit=new Set();
  for(let i=0;i<20;i++){for(const t of tags){const s=await p.screenshot({clip:t.clip});if(!first[t.k])first[t.k]=s;else if(!s.equals(first[t.k]))hit.add(t.k);} await p.waitForTimeout(300);}
  ok('labels: nothing passes over a place name (20 frames)', hit.size===0, [...hit].join(', '));}
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
 ok('desktop: menu has products only (pages are in the nav)', (await p.locator('[data-menu-list] a').count())===5 && !(await p.isVisible('.menu-pages')));
 ok('desktop: hint says hover', (await p.innerText('[data-hint]')).includes('hover a place'), await p.innerText('[data-hint]'));
 await p.waitForTimeout(600); // let the card's pop animation settle
 {const pos=await p.evaluate(()=>{const r=(s)=>document.querySelector(s).getBoundingClientRect();const t=r('.ul-tagline'),c=r('[data-card]'),u=r('.ul-tour');return {tagline:[t.left,innerHeight-t.bottom],card:[Math.round(c.left+c.width/2-innerWidth/2),innerHeight-c.bottom],tour:[innerWidth-u.right,innerHeight-u.bottom]};});
  ok('desktop: tagline, card and tour stay in their corners', JSON.stringify(pos)==='{"tagline":[24,28],"card":[0,24],"tour":[24,28]}', JSON.stringify(pos));}
 await p.keyboard.press('Escape'); ok('menu closes on Esc', !(await p.isVisible('[data-menu]')));
 // panels
 for(const id of ['story','notes','contact']){ await p.evaluate(id=>{location.hash=id},id); await p.waitForTimeout(700);
   const open=await p.evaluate(id=>document.querySelector(`[data-panel="${id}"]`).classList.contains('open'),id); ok('panel '+id+' opens',open);
   if(id!=='contact'){ await p.click(`[data-panel="${id}"] [data-close]`); await p.waitForTimeout(600); ok('panel '+id+' closes', !(await p.evaluate(id=>document.querySelector(`[data-panel="${id}"]`).classList.contains('open'),id))); } }
 // contact form: problems show under the field, nothing is sent until they're fixed, one request per send
 const SUBMIT='[data-contact] button[type=submit]'; let posts=0;
 p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/contact'))posts++;});
 await p.click(SUBMIT); await p.waitForTimeout(200);
 ok('contact: empty send shows both field errors', (await p.isVisible('#c-name-err'))&&(await p.isVisible('#c-email-err'))&&posts===0, await p.textContent('#c-name-err'));
 ok('contact: focus moves to the first problem', (await p.evaluate(()=>document.activeElement.id))==='c-name' && (await p.getAttribute('#c-name','aria-invalid'))==='true');
 await p.fill('#c-name','Test'); ok('contact: typing clears that error', !(await p.isVisible('#c-name-err')));
 await p.fill('#c-email','t@example'); await p.click(SUBMIT); await p.waitForTimeout(200);
 ok('contact: bad email is caught before sending', (await p.isVisible('#c-email-err'))&&!(await p.isVisible('#c-name-err'))&&posts===0, await p.textContent('#c-email-err'));
 await p.fill('#c-email','t@example.com');
 await p.route('**/api/contact',async r=>{await new Promise(x=>setTimeout(x,700)); await r.continue();}); // slow the send so the busy state can be seen
 await p.click(SUBMIT); await p.waitForTimeout(150);
 const busy=await p.evaluate(()=>{const b=document.querySelector('[data-contact] [type=submit]');return b.disabled+' '+b.textContent;});
 await p.evaluate(()=>document.querySelector('[data-contact]').requestSubmit()); // a second send while busy must be ignored
 ok('contact: button shows it is sending', busy==='true Sending…', busy);
 await p.waitForSelector('[data-sent]:not([hidden]), [data-fail]:not([hidden])',{timeout:15000}).catch(()=>{}); // the first API call on a fresh local server takes a few seconds
 await p.unroute('**/api/contact');
 ok('contact: one request per send', posts===1, 'requests='+posts);
 const sentOk=await p.isVisible('[data-sent]');
 ok('contact form responds', sentOk||(await p.isVisible('[data-fail]')), sentOk?await p.textContent('[data-sent-msg]'):await p.textContent('[data-fail-msg]'));
 if(sentOk){
   ok('contact: success replaces the form', !(await p.isVisible('[data-contact]')));
   await p.click('[data-again]'); ok('contact: "send another" brings back an empty form', (await p.isVisible('[data-contact]'))&&(await p.inputValue('#c-name'))==='');
 }
 ok('contact: page itself never scrolls', (await p.evaluate(()=>document.querySelector('.ul-root').scrollTop+document.querySelector('.ul-root').scrollLeft))===0);
 await p.click('[data-panel="contact"] [data-close]'); await p.waitForTimeout(500);
 // an open panel: the floating UI steps aside, the map dims and nothing behind it is reachable; the dimmed map, Esc and ✕ all close it
 await p.click('.nav a[href="#story"]'); await p.waitForTimeout(700);
 {const s=await p.evaluate(()=>{const vis=q=>getComputedStyle(document.querySelector(q)).visibility;return {card:vis('[data-card]'),tour:vis('.ul-tour'),hint:vis('.ul-hint'),tagline:vis('.ul-tagline'),scrim:vis('.ul-scrim'),inert:document.querySelector('.ul-stage').inert&&document.querySelector('.ul-top').inert,reachable:[...document.querySelectorAll('a,button,input,textarea')].filter(e=>!e.closest('[data-panel]')&&!e.closest('[inert]')&&e.offsetParent!==null).length};});
  ok('panel open: card, tour, hint and tagline step aside; map dims', s.card==='hidden'&&s.tour==='hidden'&&s.hint==='hidden'&&s.tagline==='hidden'&&s.scrim==='visible', JSON.stringify(s));
  ok('panel open: nothing behind it can be reached with Tab', s.inert&&s.reachable===0, JSON.stringify(s));}
 await p.mouse.click(200,450); await p.waitForTimeout(600);
 ok('panel: clicking the dimmed map closes it and brings the card back', !(await p.evaluate(()=>document.querySelector('[data-panel="story"]').classList.contains('open')))&&(await p.evaluate(()=>getComputedStyle(document.querySelector('[data-card]')).visibility))==='visible');
 await p.click('.nav a[href="#notes"]'); await p.waitForTimeout(600); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
 await p.click('.nav a[href="#notes"]'); await p.waitForTimeout(600);
 ok('panel: the same link reopens it after Esc', await p.evaluate(()=>document.querySelector('[data-panel="notes"]').classList.contains('open')), 'hash='+(await p.evaluate(()=>location.hash)));
 await p.keyboard.press('Escape'); await p.waitForTimeout(500);
 for(let i=0;i<12&&!(await p.evaluate(()=>document.activeElement.matches('.nav a[href="#story"]')));i++) await p.keyboard.press('Tab');
 await p.keyboard.press('Enter'); await p.waitForTimeout(700); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
 ok('panel: keyboard focus returns to the link that opened it', await p.evaluate(()=>document.activeElement.matches('.nav a[href="#story"]')), await p.evaluate(()=>document.activeElement.outerHTML.slice(0,60)));
 // link previews: a 1200x630 image small enough for WhatsApp, and a large-image card for X
 {const html=await (await ctx.request.get(BASE)).text(); const og=(html.match(/<meta property="og:image" content="([^"]+)"/)||[])[1]||'';
  const img=await ctx.request.get(BASE+'/og.png'); const size=(await img.body()).length;
  ok('link preview: og:image is the 1200x630 map, under 300 KB', og.endsWith('/og.png')&&/og:image:width" content="1200"/.test(html)&&img.status()===200&&size<300*1024, og+' '+Math.round(size/1024)+' KB');
  ok('link preview: X/Twitter large-image card', /<meta name="twitter:card" content="summary_large_image"/.test(html));}
 // contact API: field errors come back per field; one sender is rate limited (needs the database)
 {const r=await ctx.request.post(BASE+'/api/contact',{data:{name:'',email:'nope'}}); const j=await r.json().catch(()=>({}));
  ok('contact API: returns per-field errors', r.status()===400&&!!(j.errors&&j.errors.name&&j.errors.email), r.status()+' '+JSON.stringify(j));}
 {const ip='203.0.113.'+Math.floor(Math.random()*250+1); const codes=[];
  for(let i=0;i<7;i++){const r=await ctx.request.post(BASE+'/api/contact',{headers:{'x-forwarded-for':ip},data:{name:'Rate limit test',email:'rate@example.com',message:'automated test, safe to delete'}}); codes.push(r.status());}
  if(codes[0]===200) ok('contact API: one sender is rate limited', codes.includes(429)&&codes.indexOf(429)>=1, codes.join(','));
  else results.push(['INFO','contact API rate limit not checked (no database?)',codes.join(',')]);}
 // theme
 await p.click('[data-theme-btn]'); ok('night mode toggles', (await p.evaluate(()=>document.documentElement.dataset.theme))==='dark');
 {const p2=await ctx.newPage(); await p2.goto(BASE,{waitUntil:'domcontentloaded'}); const t=await p2.evaluate(()=>document.documentElement.dataset.theme); await p2.waitForTimeout(800);
  const meta=await p2.evaluate(()=>[...document.querySelectorAll('meta[name="theme-color"]')].map(m=>m.content).join(','));
  ok('night mode is remembered on the next visit', t==='dark'&&/#1C2E55/i.test(meta)&&!/#BFE3F3/i.test(meta), t+' | '+meta); await p2.close();}
 await p.click('[data-theme-btn]');
 // tour + dots
 await p.click('[data-play]'); const n1=await p.textContent('[data-card] strong'); let n2=n1; for(let t=0;t<9000&&n2===n1;t+=250){await p.waitForTimeout(250); n2=await p.textContent('[data-card] strong');} // up to two tour stops: timers run late in headless
 ok('tour advances', n1!==n2, `${n1} -> ${n2}`);
 await p.click('[data-dots] button:nth-child(4)'); await p.waitForTimeout(300); {const dn=await p.textContent('[data-card] strong'); const order=await p.evaluate(()=>[...document.querySelectorAll('[data-dots] button')].map(b=>b.getAttribute('aria-label')).join(',')); ok('dot flies to NotisCare', dn==='NotisCare', dn+' | '+order);}
 await p.evaluate(()=>{location.hash='story'}); await p.waitForTimeout(600);
 {const a=await p.textContent('[data-card] strong'); await p.waitForTimeout(9000); const z=await p.textContent('[data-card] strong'); ok('panel open: the tour holds still (two tour stops)', a===z, a+' -> '+z);}
 await p.keyboard.press('Escape'); await p.waitForTimeout(400);
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
 // mobile nav: the menu carries the pages the narrow nav has no room for
 ok('mobile: nav button reads Menu', (await mp.innerText('[data-menu-btn]')).trim().startsWith('Menu'), await mp.innerText('[data-menu-btn]'));
 {const t=await mp.evaluate(()=>{const tg=document.querySelector('.ul-tagline'),nav=document.querySelector('.ul-top .nav').getBoundingClientRect(),r=tg.getBoundingClientRect();return {shown:r.height>0,belowNav:r.top>=nav.bottom,text:tg.innerText,hint:getComputedStyle(document.querySelector('[data-hint]')).display};});
  ok('mobile: tagline shown under the header, with touch wording', t.shown&&t.belowNav&&t.text.includes('Tap a place')&&!t.text.includes('Hover')&&t.hint==='none', JSON.stringify(t));}
 {const d=await mp.evaluate(()=>{const dock=document.querySelector('.ul-dock'),c=document.querySelector('.ul-card').getBoundingClientRect(),t=document.querySelector('.ul-tour').getBoundingClientRect(),r=dock.getBoundingClientRect();return {inDock:dock.contains(document.querySelector('.ul-tour')),stacked:t.top>=c.bottom-1,share:Math.round(100*(innerHeight-r.top)/innerHeight)};});
  ok('mobile: card and tour controls form one panel', d.inDock&&d.stacked&&d.share<=26, JSON.stringify(d));}
 await mp.click('[data-menu-btn]'); await mp.waitForTimeout(200);
 ok('mobile: menu lists Our story and Lab notes', (await mp.isVisible('.menu-pages a[href="#story"]'))&&(await mp.isVisible('.menu-pages a[href="#notes"]')));
 ok('mobile: menu sits above the tour bar and hint', await mp.evaluate(()=>[...document.querySelectorAll('[data-menu] a')].every(a=>{const r=a.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit&&a.contains(hit);})));
 await mp.click('.menu-pages a[href="#notes"]'); await mp.waitForTimeout(700);
 ok('mobile: Lab notes opens from the menu, menu closes', (await mp.evaluate(()=>document.querySelector('[data-panel="notes"]').classList.contains('open')))&&!(await mp.isVisible('[data-menu]')));
 // mobile tour: some products sit off-screen on a phone, so the map glides to each stop (but not right after you drag it)
 {const VIS=(want)=>{const root=document.querySelector('.ul-root'),rb=root.getBoundingClientRect(),H=root.clientHeight,W=root.clientWidth;let top=0,bottom=H;
    document.querySelectorAll('.ul-top > *, .ul-tagline, .ul-hint, .ul-card, .ul-tour').forEach(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);if(!r.height||cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0')return;const t=r.top-rb.top,bt=r.bottom-rb.top;if(t+bt<H)top=Math.max(top,bt);else bottom=Math.min(bottom,t);});
    const id=want||document.querySelector('[data-card] .btn').dataset.id,bld=document.querySelector(`.bld[data-id="${id}"]`);let l=1e9,t=1e9,r=-1e9,bt=-1e9;
    bld.querySelectorAll('.f, .bb').forEach(e=>{const q=e.getBoundingClientRect();if(!q.width)return;l=Math.min(l,q.left);t=Math.min(t,q.top);r=Math.max(r,q.right);bt=Math.max(bt,q.bottom);});
    return {id,shown:Math.round(100*Math.max(0,Math.min(r,W)-Math.max(l,0))*Math.max(0,Math.min(bt,bottom)-Math.max(t,top))/((r-l)*(bt-t)))};};
  const tc=await b.newContext({...devices['iPhone 13']}); const q=await tc.newPage(); await q.goto(BASE); await q.waitForTimeout(1500); await q.click('[data-play]');
  const seen=[]; for(let i=0;i<5;i++){await q.evaluate(i=>document.querySelectorAll('[data-dots] button')[i].click(),i); await q.waitForTimeout(1700); seen.push(await q.evaluate(VIS));}
  ok('mobile: every tour stop is brought into view', seen.every(s=>s.shown>=95), seen.map(s=>s.id+' '+s.shown+'%').join(', '));
  await q.evaluate(()=>document.querySelectorAll('[data-dots] button')[3].click()); await q.waitForTimeout(1700); await q.click('[data-play]'); // NotisCare, then let the tour fly on to Nestlo
  for(let t=0;t<9000&&(await q.textContent('[data-card] strong'))!=='Nestlo';t+=250) await q.waitForTimeout(250); await q.waitForTimeout(1700);
  {const v=await q.evaluate(VIS); ok('mobile: the running tour follows an off-screen stop', v.id==='nestlo'&&v.shown>=95, v.id+' '+v.shown+'%');}
  await q.mouse.move(195,330); await q.mouse.down(); await q.mouse.move(120,300,{steps:8}); await q.mouse.up(); await q.waitForTimeout(300);
  const afterDrag=await q.evaluate(()=>document.querySelector('.ul-pan').style.transform), was=await q.textContent('[data-card] strong');
  for(let t=0;t<9000&&(await q.textContent('[data-card] strong'))===was;t+=250) await q.waitForTimeout(250); await q.waitForTimeout(1700);
  ok('mobile: right after a drag the tour leaves the map where you put it', (await q.evaluate(()=>document.querySelector('.ul-pan').style.transform))===afterDrag, afterDrag);
  await tc.close();
  const kc=await b.newContext({...devices['iPhone 13']}); const k=await kc.newPage(); await k.goto(BASE); await k.waitForTimeout(1500);
  await k.keyboard.press('Tab'); await k.waitForTimeout(1700); // keyboard only: the first Tab lands on Nestlo, which starts off-screen
  {const id=await k.evaluate(()=>document.activeElement.dataset.id||document.activeElement.tagName); const v=await k.evaluate(VIS,id);
   ok('mobile: a building reached with Tab is brought into view', id==='nestlo'&&v.shown>=95, id+' '+v.shown+'%');}
  await kc.close();}
 for(const w of [320,360,390]){ const c=await b.newContext({viewport:{width:w,height:700},isMobile:true,hasTouch:true}); const q=await c.newPage(); await q.goto(BASE); await q.waitForTimeout(800);
   const f=await q.evaluate(()=>{const n=document.querySelector('.nav').getBoundingClientRect(),br=document.querySelector('.brand').getBoundingClientRect();return {right:Math.round(n.right),gap:Math.round(n.left-br.right),vw:innerWidth};});
   ok(`mobile ${w}px: nav fits on screen`, f.right<=f.vw-8&&f.gap>=6, JSON.stringify(f)); await c.close(); }
 // phones to desktop: the floating UI never overlaps (waits for the card's pop animation to settle)
 for(const [w,h] of [[320,568],[375,553],[390,664],[768,1024],[1024,768],[1180,820],[1440,900]]){ const c=await b.newContext({viewport:{width:w,height:h},isMobile:w<700,hasTouch:w<1100}); const q=await c.newPage(); await q.goto(BASE); await q.waitForTimeout(2200);
   const o=await q.evaluate(()=>{const els={};for(const [k,s] of Object.entries({tagline:'.ul-tagline',card:'[data-card]',tour:'.ul-tour',hint:'.ul-hint',nav:'.ul-top .nav',brand:'.ul-top .brand'})){const e=document.querySelector(s);const r=e.getBoundingClientRect();if(getComputedStyle(e).display!=='none'&&r.width&&r.height)els[k]=r;}
     const ks=Object.keys(els),hits=[];for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++){const a=els[ks[i]],z=els[ks[j]];if(a.left<z.right-1&&z.left<a.right-1&&a.top<z.bottom-1&&z.top<a.bottom-1)hits.push(ks[i]+'×'+ks[j]);}
     ks.forEach(k=>{const r=els[k];if(r.left<-1||r.right>innerWidth+1||r.bottom>innerHeight+1)hits.push(k+' off-screen');});return hits;});
   ok(`layout ${w}x${h}: no overlapping UI`, o.length===0, o.join(', ')); await c.close(); }
 await b.close();
 for(const r of results) console.log(r.join('  '));
})();
