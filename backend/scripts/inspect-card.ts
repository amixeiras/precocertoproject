import { chromium } from 'playwright';

async function inspectProductCard() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('https://www.davo.com.br/ofertas', { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(3000);

  const cardDetails = await page.evaluate(() => {
    // Procura elementos que contêm o preço R$ 2,79 ou R$ 89,90
    const priceSpan = Array.from(document.querySelectorAll('span, p, div')).find(
      (el) => el.textContent?.trim() === 'R$ 2,79' || el.textContent?.trim() === 'R$ 2,79'
    );

    if (!priceSpan) return { found: false };

    // Sobe na árvore DOM para encontrar o container do card do produto
    let current: Element | null = priceSpan;
    const path: { tag: string; class: string; htmlSnippet: string }[] = [];

    while (current && current !== document.body) {
      path.push({
        tag: current.tagName.toLowerCase(),
        class: current.className,
        htmlSnippet: current.outerHTML.slice(0, 150),
      });
      current = current.parentElement;
    }

    // Procura componentes com tag vip- ou card
    const vipCards = Array.from(document.querySelectorAll('*'))
      .filter((el) => el.tagName.toLowerCase().includes('card') || el.tagName.toLowerCase().includes('product') || el.tagName.toLowerCase().includes('item') || el.className.includes('card'))
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        class: el.className,
        textSample: el.textContent?.trim().slice(0, 100),
      }))
      .slice(0, 15);

    return {
      found: true,
      priceSpanTag: priceSpan.tagName,
      priceSpanClass: priceSpan.className,
      ancestors: path.slice(0, 8),
      vipCards,
    };
  });

  console.log('📦 Detalhes do Card de Produto:', JSON.stringify(cardDetails, null, 2));

  await browser.close();
}

inspectProductCard();

