// Isolated browser harness. Synthetic test fixtures never enter the application bundle.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const { chromium } = require('playwright');
const output = path.resolve('.next/phase2d-preview');
(async () => {
 fs.mkdirSync(output, {recursive:true});
 await esbuild.build({stdin:{contents:`import React from 'react'; import {createRoot} from 'react-dom/client'; import {LineupEditor} from './src/components/point-fantasy/lineups/LineupEditor'; import styles from './src/components/point-fantasy/lineups/LineupBuilder.module.css'; createRoot(document.getElementById('root')).render(<div className={styles.builder}><LineupEditor integrated competitionId={8} onBack={()=>{}}/></div>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,outfile:path.join(output,'bundle.js'),define:{'process.env':'{}','process.env.NODE_ENV':'"development"'},plugins:[{name:'fixtures',setup(build){
  build.onResolve({filter:/^@\/contexts\/AuthContext$/},()=>({path:'auth',namespace:'fixture'}));
  build.onResolve({filter:/^@\/services\/pointFantasyLineupService$/},()=>({path:'service',namespace:'fixture'}));
  build.onLoad({filter:/.*/,namespace:'fixture'},args=>({resolveDir:process.cwd(),contents:args.path==='auth' ? `export const useAuth=()=>({user:{status:'ATIVO'}});` : `import {testContext,testMyLineups,testLineup} from './src/components/point-fantasy/lineups/lineupTestFixtures'; export const loadLineupContext=async()=>testContext(); export const listMyFantasyLineups=async()=>testMyLineups([],{estadoIdentidade:'NOVO',identidade:null}); export const getFantasyLineup=async()=>testLineup(); export const createFantasyLineup=async()=>testLineup(); export const updateFantasyLineup=createFantasyLineup; export const deleteFantasyLineup=async()=>({id:12,excluida:true}); export const duplicateFantasyLineup=createFantasyLineup; export const confirmFreeFantasyLineups=async()=>{throw Error('Unexpected registration')}; export const lineupError=e=>e.message;` }));
 }}]});
 const server=http.createServer((req,res)=>{
  const name=req.url==='/bundle.js'?'bundle.js':req.url==='/bundle.css'?'bundle.css':null;
  res.setHeader('Content-Type',name?.endsWith('.js')?'text/javascript':name?'text/css':'text/html');
  res.end(name?fs.readFileSync(path.join(output,name)):'<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial}#root{max-width:1200px;margin:auto;padding:12px}button{cursor:pointer}</style><div id="root"></div><script src="/bundle.js"></script>');
 });
 await new Promise(resolve=>server.listen(3196,'127.0.0.1',resolve)); let browser;
 try {
  browser=await chromium.launch({channel:'msedge',headless:true});
  for(const width of [320,360,390,768,1440]) {
   const page=await browser.newPage({viewport:{width,height:1000}});
   page.on('pageerror',error=>console.error('Browser error:',error.message));
   await page.goto('http://127.0.0.1:3196');
   await page.getByRole('button',{name:/Bora escalar/}).waitFor();
   assert.equal(await page.getByRole('tab').count(),3);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`list overflow ${width}`);
   await page.screenshot({path:path.join(output,`${width}-teams.png`),fullPage:true});
   await page.getByRole('button',{name:/Bora escalar/}).click();
   await page.getByRole('region',{name:'Campinho 4-3-3'}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`editor overflow ${width}`);
   const bench=await page.getByRole('region',{name:'Banco de reservas'}).boundingBox();
   const save=await page.getByRole('button',{name:'Salvar time',exact:true}).boundingBox();
   assert.ok(save.y>=bench.y+bench.height,`save below bench ${width}`);
   await page.screenshot({path:path.join(output,`${width}-editor.png`),fullPage:true});
   await page.close(); console.log(`OK ${width}px: tabs, empty state, pitch, overflow, save below bench`);
  }
 } finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
