// Browser regression against the production export; API fixtures are isolated to this test.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve('out');
const output = path.resolve('.next/dashboard-mago-validation');
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
const team = (id, nome) => ({ id, externalId: id, cartolaClubeId: null, nome, nomeCurto: nome, sigla: nome.slice(0, 3), escudoUrl: null });
const market = { rodada_atual: 27, status_mercado: 1, bola_rolando: false, temporada: 2026 };
const match = { id: 1, externalId: 1, temporada: 2026, rodada: 27, dataHoraUtc: '2026-09-13T20:30:00Z', status: 'TIMED', vencedor: null, mandante: team(1, 'Flamengo'), visitante: team(2, 'Corinthians'), placar: { mandante: null, visitante: null }, placarIntervalo: { mandante: null, visitante: null } };

(async () => {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(3188, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [360, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname === '127.0.0.1') return route.continue();
        let data = {};
        if (url.pathname === '/cartola/dashboard') data = { rodada: 27, mercadoAberto: true, bolaRolando: false, mercado: market, partidas: [], clubes: {} };
        else if (url.pathname.includes('/atletas/pontuados')) data = { rodada: 26, atletas: {} };
        else if (url.pathname.includes('/cartola/partidas')) data = { partidas: [] };
        else if (url.pathname.includes('/rodada-atual')) data = { competicao: { codigo: 'BSA', nome: 'Brasileirão' }, temporada: 2026, rodada: 27, total: 1, jogos: [match] };
        else if (url.pathname.includes('/ranking')) data = { rodada: 26, total: 0, ranking: [] };
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
      });
      await page.goto('http://127.0.0.1:3188/');
      const card = page.getByRole('region', { name: 'Mago do Point Fantasy' });
      await card.waitFor();
      await page.getByRole('link', { name: 'Ver detalhes de Flamengo contra Corinthians' }).waitFor();
      assert.equal(await page.locator('nav a[href="/mago"]').count(), 0);
      assert.equal(await card.getByRole('listitem').count(), 6);
      assert.equal(await card.locator('[aria-label^="1 de 4"], [aria-label^="2 de 4"], [aria-label^="3 de 4"], [aria-label^="4 de 4"]').count(), 4);
      assert((await card.innerText()).includes('42,66%'));
      assert((await card.innerText()).includes('1,82 xG'));
      assert((await card.innerText()).includes('17,03% SG'));
      const carousel = card.getByRole('region', { name: 'Insights do Mago' });
      const dots = card.getByRole('button', { name: /^Ir para/ });
      assert.equal(await dots.count(), 4);
      await dots.nth(1).click();
      await page.waitForFunction(() => document.querySelector('[aria-label="Insights do Mago"]')?.scrollLeft > 0);
      await page.waitForFunction(() => document.querySelectorAll('[aria-label^="Ir para"]')[1]?.getAttribute('aria-current') === 'true');
      await carousel.focus();
      const beforeKeyboard = await carousel.evaluate(el => el.scrollLeft);
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(before => document.querySelector('[aria-label="Insights do Mago"]')?.scrollLeft > before, beforeKeyboard);
      await dots.first().click();
      await page.waitForFunction(() => document.querySelector('[aria-label="Insights do Mago"]')?.scrollLeft < 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await card.evaluate(el => el.scrollWidth > el.clientWidth), false);
      await card.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await card.screenshot({ path: path.join(output, `card-${width}.png`) });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(output, `dashboard-${width}.png`), fullPage: true });
      await card.getByRole('link', { name: 'Ver análise completa' }).click();
      await page.waitForURL(url => /^\/mago\/?$/.test(url.pathname));
      await page.getByRole('heading', { name: 'Mago do Point Fantasy', exact: true }).waitFor();
      assert.equal(await page.getByRole('region', { name: 'Placares do Mago' }).getByRole('article').count(), 9);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, dashboard: 'passed', card: 'passed', navigation: 'passed', mago: 'passed', horizontalOverflow: false }));
      await page.close();
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
