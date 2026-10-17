// Runs only against local export and synthetic API fixtures; never sends registrations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { server: staticServer } = require('superstatic');
const hosting = require('../firebase.json').hosting;
const origin = 'http://127.0.0.1:3195';
const output = path.resolve('.next/fantasy-showcase-validation');
const baseCompetition = { catalogoId: 9, temporada: 2026, rodada: 31, tipoAcesso: 'FREE', valorInscricao: '0.00', status: 'PUBLICADA', inicioInscricao: '2020-01-01T00:00:00Z', fimInscricao: '2098-01-01T20:00:00Z', fechamentoDefinitivoEm: null, limiteEscalacoesUsuario: 3, criadoEm: '', atualizadoEm: '' };
const competitions = [
  { ...baseCompetition, id: 8, nome: 'Disputa gratuita da rodada' },
  { ...baseCompetition, id: 19, nome: 'Copa de estratégia com nome longo para validar a leitura em telas pequenas', tipoAcesso: 'PAGO', valorInscricao: '15.00' },
  { ...baseCompetition, id: 23, nome: 'Competição encerrada', fimInscricao: '2021-01-01T00:00:00Z' },
];

(async () => {
  const server = staticServer({ port: 3195, hostname: '127.0.0.1', config: hosting }).listen();
  await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
  let browser;
  try {
    for (const source of ['/point-fantasy/escalacoes', '/point-fantasy/escalacoes/', '/point-fantasy/']) {
      const response = await fetch(`${origin}${source}?competicao=19&origem=antigo`, { redirect: 'manual' });
      assert.equal(response.status, 301, source);
      assert.equal(response.headers.get('location'), '/point-fantasy?competicao=19&origem=antigo');
    }
    const target = await fetch(`${origin}/point-fantasy`, { redirect: 'manual' });
    assert.equal(target.status, 200, 'canonical destination must serve without a redirect loop');
    for (const source of ['/point-fantasy/escalacoes/12', '/point-fantasy/atletas/']) {
      const response = await fetch(origin + source, { redirect: 'manual' });
      assert.notEqual(response.headers.get('location'), '/point-fantasy', 'do not capture editor/catalog subroutes');
    }
    console.log('Hosting local: 301 exato, query preservada, canonical 200, subrotas preservadas.');
    fs.mkdirSync(output, { recursive: true });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    for (const width of [320, 360, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      let items = competitions;
      const requests = [];
      await page.route('**/*', route => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.hostname === '127.0.0.1') return route.continue();
        requests.push([request.method(), url.pathname]);
        if (url.pathname === '/point-fantasy/competicoes') return route.fulfill({ json: { items, page: 1, limit: 100, total: items.length } });
        return route.fulfill({ json: {} });
      });
      await page.goto(origin + '/point-fantasy', { waitUntil: 'networkidle' });
      await page.getByRole('article', { name: competitions[0].nome, exact: true }).waitFor();
      assert.equal(await page.title(), 'POINT FFC Fantasy');
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://pointffc.com.br/point-fantasy');
      assert.equal(await page.getByRole('tab').count(), 1);
      assert.equal(await page.getByRole('button', { name: 'Participar', exact: true }).count(), 2);
      assert.equal(await page.getByRole('button', { name: 'Encerrada', exact: true }).isDisabled(), true);
      const rail = page.getByRole('region', { name: 'Carrossel de competições' });
      await page.screenshot({ path: path.join(output, `${width}.png`), fullPage: true });
      if (width < 768) {
        const tops = await page.locator('nav').last().locator('a').evaluateAll(links => links.map(link => link.getBoundingClientRect().top));
        assert.ok(tops.every(top => Math.abs(top - tops[0]) < 2), 'mobile menu must stay in one row');
      }
      await rail.focus(); await page.keyboard.press('End');
      await page.getByText('3 / 3', { exact: true }).waitFor();
      await page.waitForFunction(() => { const rail = document.querySelector('[aria-label="Carrossel de competições"]'); return rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2; });
      await page.screenshot({ path: path.join(output, `${width}-last.png`), fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'page overflow ' + width);
      await rail.focus(); await page.keyboard.press('Home');
      await page.getByRole('article', { name: competitions[0].nome, exact: true }).getByRole('button', { name: 'Participar' }).click();
      assert.equal(new URL(page.url()).searchParams.get('competicao'), '8');
      await page.getByRole('link', { name: 'Entrar na minha conta' }).waitFor();
      await page.getByRole('button', { name: 'Voltar às competições' }).click();
      await page.getByRole('article', { name: competitions[0].nome, exact: true }).waitFor();
      items = [competitions[0]];
      await page.getByRole('button', { name: 'Atualizar' }).click();
      await page.getByRole('article', { name: competitions[0].nome, exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Próxima competição' }).count(), 0);
      assert.equal(requests.some(([method]) => !['GET','OPTIONS'].includes(method)), false, 'no mutation at entry');
      console.log(`Vitrine ${width}px: layout, carrossel, teclado, FREE/PAGA, prazo, autenticação e retorno aprovados.`);
      await page.close();
    }
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
