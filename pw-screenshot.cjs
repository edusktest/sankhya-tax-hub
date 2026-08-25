const { chromium } = require('playwright');
const path = require('path');
const out = 'C:/Users/EDUARD~1/AppData/Local/Temp/claude/c--Users-eduardol-sankhya-Documents-VS-Code-sankhyaPRJ-sankhya-tax-hub/87faefcf-d06e-43a5-8bc6-2bf6f8a50eec/scratchpad';
const base = 'http://192.168.15.8:8080';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  // Setar EIP mode via localStorage antes de qualquer rota
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('sankhya-layout-mode', 'eip'));

  async function shot(url, filename, fullPage) {
    if (fullPage === undefined) fullPage = true;
    await page.goto(base + url, { waitUntil: 'networkidle', timeout: 12000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(out, filename), fullPage: fullPage });
    console.log(filename + ' ok');
  }

  await shot('/apuracao-dere', '01-dere-painel.png', false);
  await shot('/apuracao-dere/d1001', '02-d1001-lista.png', true);
  await shot('/apuracao-dere/historico', '03-historico.png', true);

  await browser.close();
})();
