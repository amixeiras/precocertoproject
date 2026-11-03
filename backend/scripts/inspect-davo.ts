import { chromium } from 'playwright';

async function inspectDavo() {
  console.log('🚀 Iniciando Playwright para inspecionar https://www.davo.com.br/ofertas...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  // Captura chamadas de API
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('oferta') || url.includes('produto') || url.includes('vitrine')) {
      console.log(`📡 API Response [${response.status()}]: ${url.slice(0, 120)}`);
    }
  });

  try {
    console.log('⏳ Navegando...');
    await page.goto('https://www.davo.com.br/ofertas', { waitUntil: 'networkidle', timeout: 35000 });
    console.log('✅ networkidle alcançado.');

    // Espera mais alguns segundos para renderização Angular/SPA
    await page.waitForTimeout(5000);

    const title = await page.title();
    const urlFinal = page.url();
    console.log(`📌 Título da página: "${title}"`);
    console.log(`📌 URL final: "${urlFinal}"`);

    // Inspeciona o que foi renderizado dentro de vip-root
    const domInfo = await page.evaluate(() => {
      const vipRoot = document.querySelector('vip-root');
      const innerHtmlLength = vipRoot ? vipRoot.innerHTML.length : 0;
      
      // Procura por modais ou diálogos
      const modals = Array.from(document.querySelectorAll('.modal, [role="dialog"], [class*="modal"], [class*="dialog"], [class*="popup"], [class*="cep"]'))
        .map(el => el.textContent?.trim().slice(0, 100));

      // Procura qualquer menção de R$
      const textWithPrices = Array.from(document.querySelectorAll('*'))
        .filter(el => el.children.length === 0 && (el.textContent || '').includes('R$'))
        .map(el => ({ tag: el.tagName, class: el.className, text: el.textContent?.trim() }))
        .slice(0, 10);

      // Procura por classes e tags de produtos
      const allElements = Array.from(document.querySelectorAll('*'))
        .map(el => el.tagName.toLowerCase())
        .filter((v, i, a) => a.indexOf(v) === i);

      return {
        hasVipRoot: !!vipRoot,
        innerHtmlLength,
        modaisEncontrados: modals,
        textWithPrices,
        tagsUnicas: allElements.slice(0, 30),
        bodySnippet: document.body.innerText.slice(0, 800)
      };
    });

    console.log('🔍 Informações do DOM:', JSON.stringify(domInfo, null, 2));

  } catch (err) {
    console.error('❌ Erro durante inspeção:', err);
  } finally {
    await browser.close();
  }
}

inspectDavo();

