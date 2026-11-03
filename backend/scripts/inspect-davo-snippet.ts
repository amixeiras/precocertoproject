import { chromium } from 'playwright';

async function inspectDavoProductSnippet() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  let apiProducts: any[] = [];

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('em-oferta?page=1') && response.status() === 200) {
      try {
        const json = await response.json();
        console.log('🎉 [API Response Interceptada!]');
        console.log('Status:', response.status());
        console.log('Keys:', Object.keys(json));
        // Se json tiver items ou produtos ou data
        const items = json.items || json.produtos || json.data || json.content || json;
        console.log('Is Array?', Array.isArray(items), 'Count:', items?.length);
        if (Array.isArray(items) && items.length > 0) {
          apiProducts = items;
          console.log('Primeiro item:', JSON.stringify(items[0], null, 2));
        }
      } catch (e) {
        console.log('Erro ao ler JSON:', e);
      }
    }
  });

  await page.goto('https://www.davo.com.br/ofertas', { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(3000);

  // Procura no DOM os componentes reais
  const extractionResult = await page.evaluate(() => {
    // Busca todos os textos da página
    const results: { titulo: string; preco: string; precoDe?: string; seletorUsado: string }[] = [];

    // VIP Commerce geralmente usa componentes personalizados:
    // vip-card-product, vip-product-card, vip-showcase-item, vip-item-produto, etc.
    const customElements = Array.from(document.querySelectorAll('*'))
      .filter((el) => el.tagName.toLowerCase().startsWith('vip-') && (el.textContent || '').includes('R$'));

    const tagNames = customElements.map((el) => el.tagName.toLowerCase()).filter((v, i, a) => a.indexOf(v) === i);

    // Vamos encontrar o container de produto mais específico
    // Procurando elementos que contenham imagem e preço
    const allDivs = Array.from(document.querySelectorAll('div, article, section, vip-card-product, vip-product, vip-card'));
    
    // Tenta achar elementos filhos que tenham link de produto ou título
    const productContainers: Element[] = [];
    for (const el of allDivs) {
      const text = el.textContent || '';
      const hasPrice = text.includes('R$');
      const hasImg = !!el.querySelector('img');
      const isSmall = text.length < 350 && text.length > 20;
      if (hasPrice && hasImg && isSmall) {
        // Verifica se é o nó mais folha possível
        const childMatches = Array.from(el.querySelectorAll('div, article')).filter(c => c.textContent?.includes('R$') && c.querySelector('img') && c.textContent.length < 350);
        if (childMatches.length === 0) {
          productContainers.push(el);
        }
      }
    }

    return {
      vipTagsComPreco: tagNames,
      totalContainersDetectados: productContainers.length,
      amostra: productContainers.slice(0, 5).map(c => ({
        tag: c.tagName.toLowerCase(),
        className: c.className,
        html: c.outerHTML.slice(0, 300),
        text: c.textContent?.trim().replace(/\s+/g, ' ').slice(0, 150)
      }))
    };
  });

  console.log('📊 Resultado da Extração:', JSON.stringify(extractionResult, null, 2));

  await browser.close();
}

inspectDavoProductSnippet();

