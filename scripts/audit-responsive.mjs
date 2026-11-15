/** Reproducible geometry audit of every exported HTML route. BASE_URL must serve out/. */
import { chromium } from 'playwright-core';
import { readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
const widths = process.env.WIDTHS ? process.env.WIDTHS.split(',').map(Number) : [320,360,375,390,430,768,1024,1440];
async function files(dir) { const entries = await readdir(dir,{withFileTypes:true}); return (await Promise.all(entries.map(e=>e.isDirectory()?files(join(dir,e.name)):e.name==='index.html'?[join(dir,e.name)]:[]))).flat(); }
const routes=(await files('out')).map(p=>'/'+relative('out',p).split(sep).slice(0,-1).join('/')+'/').map(p=>p==='//'?'/':p).sort();
const browser=await chromium.launch({headless:true,args:['--no-sandbox']}); const result=[];
for (const width of widths) {
 let next=0; const pages=await Promise.all(Array.from({length:5},()=>browser.newPage({viewport:{width,height:800}, deviceScaleFactor:1})));
 await Promise.all(pages.map(async p=>{ while(next<routes.length){const route=routes[next++]; try {
  const response=await p.goto((process.env.BASE_URL||'http://127.0.0.1:4175')+route,{waitUntil:'domcontentloaded',timeout:30000}); await p.waitForTimeout(300);
  const info=await p.evaluate(()=>{let doc=document.documentElement; const tiny=[],outside=[]; for(const el of document.querySelectorAll('body *')){const s=getComputedStyle(el),r=el.getBoundingClientRect(); if(s.display==='none'||s.visibility==='hidden'||r.width===0||r.height===0)continue; if((r.right>innerWidth+2 || r.left < -2) && !el.closest('[class*="overflow-x-auto"], [class*="overflow-auto"], [class*="overflow-x-scroll"], [class*="overflow-hidden"], [role="dialog"]')) outside.push({tag:el.tagName,cls:String(el.className).slice(0,100),text:el.textContent?.trim().slice(0,45),left:Math.round(r.left),right:Math.round(r.right)}); if(el.matches('button, input:not([type=hidden]), select, textarea') && (r.width<44||r.height<44)) tiny.push({tag:el.tagName,type:el.getAttribute('type'),label:el.getAttribute('aria-label')||el.textContent?.trim().slice(0,35),w:Math.round(r.width),h:Math.round(r.height)}); } return {scrollWidth:doc.scrollWidth, outside:outside.slice(0,10),tiny:tiny.slice(0,15),tinyCount:tiny.length}; });
  result.push({width,route,status:response?.status(),...info});
 }catch(e){result.push({width,route,error:e.message})} }})); await Promise.all(pages.map(p=>p.close())); console.log(width,'done',result.length,'overflow',result.filter(x=>x.width===width&&x.scrollWidth>width+1).length);
}
await writeFile(process.env.REPORT||'/tmp/responsive-audit.json',JSON.stringify({routes:routes.length,result},null,2)); await browser.close();
const failures = result.filter(r => r.error || r.status !== 200 || r.scrollWidth > r.width + 1);
if (failures.length) { console.error(`${failures.length} route(s) failed the audit`); process.exitCode = 1; }
