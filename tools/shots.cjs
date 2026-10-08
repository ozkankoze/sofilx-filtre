const { chromium } = require('playwright');
const OUT='/tmp/claude-0/-home-claude/d8da4748-cf42-55e4-a4ae-4c87878852d2/scratchpad/live/';
const pages=(process.argv[2]||'/').split(',');
(async()=>{const b=await chromium.launch();
for(const [w,h,n] of [[1440,900,'d'],[390,844,'m']]){const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
for(const u of pages){await p.goto('http://localhost:4321'+u,{waitUntil:'networkidle'});await p.waitForTimeout(400);const name=n+'_'+(u.replace(/[\/?=]/g,'_')||'home')+'.png';await p.screenshot({path:OUT+name,fullPage:process.argv[3]==='full'});
const sw=await p.evaluate(()=>document.documentElement.scrollWidth);console.log(n,u,'sw',sw);}
console.log(n,'errors',errs.filter(e=>!/fonts|googletagmanager|ERR_|Failed to load resource/.test(e)).slice(0,5));await ctx.close();}
await b.close();})();
