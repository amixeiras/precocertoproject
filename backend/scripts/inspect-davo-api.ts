import { chromium } from 'playwright';

async function inspectDavoApiAndDom() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  let apiProducts: any[] = [];

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/loja/produtos/em-oferta') && response.status() === 200) {
      try {
        const json = await response.json();
        console.log('🎯 [VIP API interceptada!] Chaves do JSON:', Object.keys(json));
        if (json.data && Array.isArray(json.data)) {
          apiProducts = json.data;
          console.log(`🎯 [VIP API] ${json.data.length} produtos retornados diretamente da API!`);
          console.log('Exemplo 1º produto:', JSON.stringify(json.data[0], null, 2));
        } else if (Array.isArray(json)) {
          apiProducts = json;
          console.log(`🎯 [VIP API] ${json.length} produtos retornados!`);
        }
      } catch (e) {
        console.error('Erro ao parsear JSON da resposta:', e);
      }
    }
  });

  await page.goto('https://www.davo.com.br/ofertas', { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(4000);

  // Inspeciona elementos no DOM que contêm preços
  const domProducts = await page.evaluate(() => {
    // Procura todos os elementos com texto de preço
    const all = Array.from(document.querySelectorAll('*'));
    const priceElements = all.filter((el) => {
      const txt = el.textContent || '';
      return el.children.length === 0 && /R\$\s*[\d.]+,\d{2}/.test(txt);
    });

    return priceElements.slice(0, 10).map((el) => {
      // Sobe até encontrar um container que tenha título ou imagem
      let parent = el.parentElement;
      let title = '';
      let tagHierarchy: string[] = [];

      for (let i = 0; i < 6 && parent; i++) {
        tagHierarchy.push(parent.tagName.toLowerCase() + (parent.className ? '.' + parent.className.split(' ')[0] : ''));
        const titleEl = parent.querySelector('h1, h2, h3, h4, h5, p, a');
        if (titleEl && titleEl.textContent && titleEl.textContent.length > 5 && !titleEl.textContent.includes('R$')) {
          title = titleEl.textContent.trim();
          break;
        }
        parent = parent.parentElement;
      }

      return {
        priceText: el.textContent?.trim(),
        foundTitle: title,
        hierarchy: tagHierarchy,
      };
    });
  });

  console.log('DOM Products:', JSON.stringify(domProducts, null, 2));

  await browser.close();
}

inspectDavoApiAndDom();

