// Isolated browser verification: synthetic API data, real Fantasy components and CSS.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const { chromium } = require('playwright');
const output = path.resolve('.next-dev/phase4c-validation');
async function main() {
  fs.mkdirSync(output, { recursive:true });
  await esbuild.build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {LineupEditor} from './src/components/point-fantasy/lineups/LineupEditor';
    import styles from './src/components/point-fantasy/lineups/LineupBuilder.module.css';
    createRoot(document.getElementById('root')).render(<div className={styles.builder}><LineupEditor integrated competitionId={8} onBack={()=>{}}/></div>);
  `},bundle:true,outfile:path.join(output,'bundle.js'),define:{'process.env':'{}','process.env.NODE_ENV':'"development"'},plugins:[{name:'synthetic-read-only-api',setup(build) {
    build.onResolve({filter:/^@\/contexts\/AuthContext$/},()=>({path:'auth',namespace:'fixture'}));
    build.onResolve({filter:/^@\/services\/pointFantasy(?:Lineup|Ranking)Service$/},args=>({path:args.path,namespace:'fixture'}));
    build.onLoad({filter:/.*/,namespace:'fixture'},args=>({resolveDir:process.cwd(),contents:args.path==='auth' ? `export const useAuth=()=>({isAuthenticated:true,isLoading:false,user:{idUsuario:10,status:'ATIVO'},accessToken:'fixture'});` : args.path.includes('Ranking') ? `
      export const getFantasyCompetitionRanking=async()=>({competicaoId:8,estadoPontuacao:'PARCIAL',total:3,page:1,limit:50,items:[3,1,2].map((id,i)=>({escalacaoId:id,nomePublico:'Time '+id,identidade:null,formacao:'4-3-3',meuTime:id===3,posicao:i<2?1:3,pontuacao:i<2?'0':'-12.75'}))});
    ` : `
      import {completeTestSelection,testLineup,testMyLineups} from './src/components/point-fantasy/lineups/lineupTestFixtures';
      const {context,selection}=completeTestSelection('4-3-3');
      context.competition.fechamentoDefinitivoEm='2020-01-01T00:00:00Z';
      const subs=[{titularSaiuId:1,reservaEntrouId:12,regra:'MAGO',pontuacaoOficial:'-3.25',pontuacaoContabilizada:'-6.5',multiplicador:2,herdouCapitao:true},{titularSaiuId:2,reservaEntrouId:13,regra:'COMUM',pontuacaoOficial:'4',pontuacaoContabilizada:'4',multiplicador:1,herdouCapitao:false}];
      const result={pontuacao:'-12.75',estadoPontuacao:'PARCIAL',revisao:'1',atualizadoEm:'2026-11-02T12:00:00Z',posicao:3,capitaoOriginalAtletaId:1,capitaoEfetivoAtletaId:12,reservaMagoAtletaId:12,reservasUtilizados:[12,13],titularesSubstituidos:[1,2],contribuicoes:[],substituicoes:subs,atletas:context.athletes.map((a,i)=>({catalogoAtletaId:a.id,papelOriginal:selection.reservas.includes(a.id)?'RESERVA':a.posicaoId===6?'TECNICO':'TITULAR',pontuacaoOficial:i===3?null:a.id===12?'-3.25':'0',pontuacaoContabilizada:a.id===12?'-6.5':'0',multiplicador:a.id===12?2:1,titularEfetivo:![1,2].includes(a.id),capitaoOriginal:a.id===1,capitaoEfetivo:a.id===12,reservaMagoDesignado:a.id===12,reservaUtilizado:[12,13].includes(a.id),utilizadoComoMago:a.id===12,entrouEmCampo:i===3?null:![1,2].includes(a.id),origemParticipacao:'REGISTRO_OFICIAL'}))};
      const team=testLineup(selection,{status:'INSCRITA',resultado:result,nomePublico:'Time de validação',atletas:context.athletes.map(atleta=>({atleta,catalogoAtletaId:atleta.id,papel:selection.reservas.includes(atleta.id)?'RESERVA':atleta.posicaoId===6?'TECNICO':'TITULAR'}))});
      export const loadLineupContext=async()=>context;
      export const listMyFantasyLineups=async()=>testMyLineups([team]);
      export const getFantasyLineup=async()=>team;
      export const listFantasyCompetitions=async()=>[context.competition];
      export const createFantasyLineup=async()=>{throw Error('Unexpected write')};
      export const updateFantasyLineup=createFantasyLineup,duplicateFantasyLineup=createFantasyLineup,deleteFantasyLineup=createFantasyLineup,confirmFreeFantasyLineups=createFantasyLineup;
      export const lineupError=e=>e.message;
    `}));
  }}]});
  const server=http.createServer((req,res)=>{
    const file=req.url==='/bundle.js'?'bundle.js':req.url==='/bundle.css'?'bundle.css':null;
    res.setHeader('Content-Type',file?.endsWith('.js')?'text/javascript':file?'text/css':'text/html; charset=utf-8');
    res.end(file?fs.readFileSync(path.join(output,file)):'<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial;background:#f6f7f2}#root{max-width:1120px;margin:auto;padding:12px}</style><div id="root"></div><script src="/bundle.js"></script>');
  });
  await new Promise(resolve=>server.listen(3198,'127.0.0.1',resolve));
  let browser;
  const report=[];
  try {
    browser=await chromium.launch({channel:'msedge',headless:true});
    for (const width of [320,360,390,768,1440]) {
      const page=await browser.newPage({viewport:{width,height:1000}});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://127.0.0.1:3198');
      await page.getByRole('button',{name:'Visualizar',exact:true}).click();
      await page.getByRole('heading',{name:'Pontuação oficial: -12,75',exact:true}).waitFor();
      assert.equal(await page.getByText('C · 2x',{exact:true}).count(),1);
      assert.equal(await page.getByText('M · Utilizado como Mago',{exact:true}).count(),1);
      assert.equal(await page.getByText('Substituído por Jogador 12',{exact:true}).count(),1);
      assert.equal(await page.getByText('Substituído por Jogador 13',{exact:true}).count(),1);
      assert.equal(await page.getByText('-6,5 pts contabilizados',{exact:true}).count(),1);
      assert.ok(await page.getByTestId('coach-slot').innerText());
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`pitch overflow ${width}`);
      const overlaps=await page.getByRole('region',{name:'Campinho 4-3-3'}).evaluate(pitch=>{
        const slots=[...pitch.querySelectorAll('[data-position]')];
        return slots.flatMap((a,i)=>slots.slice(i+1).filter(b=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return Math.min(x.right,y.right)>Math.max(x.left,y.left)+1&&Math.min(x.bottom,y.bottom)>Math.max(x.top,y.top)+1;}).map(b=>[a.textContent,b.textContent]));
      });
      assert.deepEqual(overlaps,[],`athlete overlap ${width}`);
      const escapedScores=await page.locator('[class*="resultScore"]').evaluateAll(scores=>scores.filter(score=>{
        const slot=score.parentElement.getBoundingClientRect();
        return [...score.children].some(child=>{const r=child.getBoundingClientRect();return r.left<slot.left-1||r.right>slot.right+1;});
      }).map(score=>score.textContent));
      assert.deepEqual(escapedScores,[],`score outside athlete card ${width}`);
      await page.screenshot({path:path.join(output,`${width}-pitch.png`),fullPage:true});
      await page.getByRole('button',{name:'← Meus times',exact:true}).click();
      await page.getByRole('tab',{name:'Ranking',exact:true}).click();
      await page.getByText('3 times inscritos',{exact:true}).waitFor();
      assert.deepEqual(await page.getByRole('listitem').locator('strong span[title]').allTextContents(),['Time 3','Time 1','Time 2']);
      assert.equal(await page.getByLabel('Posição 1',{exact:true}).count(),2);
      assert.equal(await page.getByLabel('Pontuação -12,75',{exact:true}).count(),1);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`ranking overflow ${width}`);
      assert.deepEqual(errors,[]);
      await page.screenshot({path:path.join(output,`${width}-ranking.png`),fullPage:true});
      report.push({width,overflow:false,overlaps:0,errors});
      await page.close();console.log(`OK ${width}px: negative points, captain, Mago, substitutions, tied ranking, no overflow or overlaps`);
    }
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  } finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
