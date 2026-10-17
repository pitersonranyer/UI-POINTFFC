// Local browser validation only: all ranking HTTP responses are synthetic test fixtures.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const { chromium } = require('playwright');
const output = path.resolve('.next/phase2g-preview');
const entry = (id, mine = false) => ({ escalacaoId:id, nomePublico:`#ABC2345 · Seleção com nome público muito longo para testar a leitura e a quebra de linha ${id}`, identidade:id === 3 ? null : {identificadorPublico:'ABC2345',nomeBase:'Seleção',sequencial:id},formacao:'4-3-3',meuTime:mine,posicao:null,pontuacao:null });
(async () => {
 fs.mkdirSync(output,{recursive:true});
 await esbuild.build({stdin:{contents:`import React from 'react'; import {createRoot} from 'react-dom/client'; import {FantasyLineupBuilder} from './src/components/point-fantasy/lineups/FantasyLineupBuilder'; import styles from './src/components/point-fantasy/lineups/LineupBuilder.module.css'; createRoot(document.getElementById('root')).render(<div className={styles.builder}><FantasyLineupBuilder competitionId={8}/></div>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,outfile:path.join(output,'bundle.js'),define:{'process.env':'{}','process.env.NODE_ENV':'"development"','process.env.NEXT_PUBLIC_API_URL':'"https://ranking-fixture.test"'},plugins:[{name:'isolated-auth-and-editor',setup(build){
  build.onResolve({filter:/^@\/contexts\/AuthContext$/},()=>({path:'auth',namespace:'fixture'}));
  build.onResolve({filter:/^@\/services\/pointFantasyLineupService$/},()=>({path:'editor',namespace:'fixture'}));
  build.onLoad({filter:/.*/,namespace:'fixture'},args=>({resolveDir:process.cwd(),contents:args.path==='auth' ? `export const useAuth=()=>({isAuthenticated:!new URLSearchParams(location.search).has('anonymous'),isLoading:false,user:{idUsuario:10,status:'ATIVO'},accessToken:'test-session'});` : `import {testContext,testMyLineups,testLineup} from './src/components/point-fantasy/lineups/lineupTestFixtures'; export const loadLineupContext=async()=>testContext(); export const listMyFantasyLineups=async()=>testMyLineups([]); export const listFantasyCompetitions=async()=>[testContext().competition]; export const getFantasyLineup=async()=>testLineup(); export const createFantasyLineup=async()=>{throw Error('Unexpected write')}; export const updateFantasyLineup=createFantasyLineup; export const duplicateFantasyLineup=createFantasyLineup; export const deleteFantasyLineup=createFantasyLineup; export const confirmFreeFantasyLineups=createFantasyLineup; export const lineupError=e=>e.message;` }));
 }}]});
 const server=http.createServer((req,res)=>{
  const name=req.url==='/bundle.js'?'bundle.js':req.url==='/bundle.css'?'bundle.css':null;
  res.setHeader('Content-Type',name?.endsWith('.js')?'text/javascript':name?'text/css':'text/html');
  res.end(name?fs.readFileSync(path.join(output,name)):'<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"><style>:root{--surface:white;--text-primary:#111;--text-secondary:#66706a;--line:#e8e9ec}*{box-sizing:border-box}body{margin:0;font-family:Arial}#root{max-width:1120px;margin:auto;padding:12px}</style><div id="root"></div><script src="/bundle.js"></script>');
 });
 await new Promise(resolve=>server.listen(3197,'127.0.0.1',resolve)); let browser;
 try {
  browser=await chromium.launch({channel:'msedge',headless:true});
  for(const width of [320,360,390,768,1440]) {
   const page=await browser.newPage({viewport:{width,height:1000}});const requests=[];
   page.on('pageerror',error=>{throw error;});
   await page.route('https://ranking-fixture.test/**',route=>{
    const url=new URL(route.request().url());requests.push(url.pathname+url.search);
    if(url.pathname.endsWith('/ranking')) { const page=Number(url.searchParams.get('page'));return route.fulfill({json:{competicaoId:8,estadoPontuacao:'NAO_INICIADA',items:page===1?[entry(1,true),entry(2),entry(3,true)]:[entry(51)],total:51,page,limit:50}}); }
    return route.fulfill({json:{id:8,nome:'Competição pública de teste',temporada:2026,rodada:31,tipoAcesso:'FREE',valorInscricao:'0.00',status:'PUBLICADA'}});
   });
   await page.goto('http://127.0.0.1:3197');await page.getByRole('tab',{name:'Ranking',exact:true}).waitFor();
   assert.equal(requests.filter(url=>url.includes('/ranking?')).length,0,'lazy ranking');
   await page.getByRole('tab',{name:'Ranking',exact:true}).click();await page.getByText('51 times inscritos',{exact:true}).waitFor();
   assert.equal(await page.getByRole('listitem').count(),3);assert.equal(await page.getByText('Seu time',{exact:true}).count(),2);
   assert.equal(await page.getByRole('heading',{name:'Ranking',exact:true}).evaluate(node=>getComputedStyle(node).textTransform),'uppercase');
   assert.equal(await page.getByText('A competição ainda não começou. Confira os times que já estão na disputa!',{exact:true}).count(),0);
   assert.equal(await page.getByRole('list').evaluate(node=>getComputedStyle(node).listStyleType),'none');
   assert.equal(await page.getByLabel('Pontuação não disponível').count(),3);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`ranking overflow ${width}`);
   const rows=await page.getByRole('listitem').evaluateAll(rows=>rows.map(row=>({score:row.lastElementChild.getBoundingClientRect().right,bg:getComputedStyle(row).backgroundColor,color:getComputedStyle(row).color,crest:row.querySelector('svg').getBoundingClientRect().width})));
   assert.ok(rows.every(row=>Math.abs(row.score-rows[0].score)<1),'score alignment');assert.notEqual(rows[0].bg,rows[1].bg);assert.ok(rows.every(row=>row.crest>=30&&row.crest<=36));
   const appearance=await page.getByRole('listitem').first().evaluate(row=>{
    const position=row.firstElementChild;const badge=row.querySelector('div strong span:last-child');
    return {border:getComputedStyle(row).borderColor,background:getComputedStyle(row).backgroundColor,position:getComputedStyle(position).backgroundColor,badge:getComputedStyle(badge).backgroundColor,badgeBesideName:badge.parentElement.tagName==='STRONG'};
   });
   assert.deepEqual(appearance,{border:'rgb(198, 166, 87)',background:'rgb(255, 250, 240)',position:'rgb(223, 188, 96)',badge:'rgb(242, 227, 186)',badgeBesideName:true},'traditional league gold styling');
   await page.screenshot({path:path.join(output,`${width}-ranking.png`),fullPage:true});
   await page.getByRole('button',{name:'Próxima',exact:true}).click();await page.getByText('Página 2 de 2',{exact:true}).waitFor();
   assert.equal(requests.filter(url=>url.includes('/ranking?')).length,2);assert.ok(requests.some(url=>url.endsWith('page=2&limit=50')));
   await Promise.all([page.waitForResponse(response=>response.url().endsWith('/ranking?page=2&limit=50')),page.getByRole('button',{name:'Atualizar',exact:true}).click()]);
   await page.getByText('Página 2 de 2',{exact:true}).waitFor();
   assert.equal(requests.filter(url=>url.endsWith('page=2&limit=50')).length,2,'refresh current page');
   await page.goto('http://127.0.0.1:3197?anonymous');await page.getByRole('tab',{name:'Ranking',exact:true}).click();await page.getByText('51 times inscritos',{exact:true}).waitFor();
   assert.equal(await page.getByText('Seu time',{exact:true}).count(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`anonymous overflow ${width}`);
   await page.screenshot({path:path.join(output,`${width}-anonymous.png`),fullPage:true});
   await page.close();console.log(`OK ${width}px: lazy loading, 50/page, own-team highlights, anonymous view, score alignment, crest size, no overflow`);
  }
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
