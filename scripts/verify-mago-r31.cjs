const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve('out');
const output = path.resolve('.next/mago-r31-validation');
const server = http.createServer((req,res) => {
  let file = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', ({'.html':'text/html','.js':'application/javascript','.css':'text/css'})[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(3191,'127.0.0.1',resolve));
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    fs.mkdirSync(output, { recursive: true });
    for (const width of [360,768,1440]) {
      const page=await browser.newPage({viewport:{width,height:1000}});
      await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
      await page.goto('http://127.0.0.1:3191/mago/',{waitUntil:'networkidle'});
      assert.match(await page.locator('h1').innerText(),/Rodada 31/);
      assert.equal(await page.getByRole('region',{name:'Placar Imaginário do Mago',exact:true}).getByRole('article').count(),9);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'overflow '+width);
      await page.screenshot({path:path.join(output,width+'.png'),fullPage:true});
      console.log('R31 renderizada sem overflow em '+width+'px');
      await page.close();
    }
  } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
