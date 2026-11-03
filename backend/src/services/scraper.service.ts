import { chromium, Browser } from 'playwright';

export interface ScraperRuleDTO {
  catalogUrl: string;
  cardContainer: string;
  productName: string;
  currentPrice: string;
  originalPrice?: string;
  discountTag?: string;
  unit?: string;
  imageSelector?: string;
}

export interface ScrapedOfferPreview {
  name: string;
  currentPrice: number;
  originalPrice?: number;
  discountPercentage: number;
  unit: string;
  imageUrl?: string;
  category: string;
  categoryName: string;
}

/**
 * Serviço do Playwright (Passo 1 do Guia Passo a Passo).
 * Executa o Chromium headless, navega até à página,
 * aguarda pelo carregamento dos componentes Angular/SPA e extrai todos os nós do DOM com imagem e categoria.
 */
export class ScraperService {
  public static classificarCategoria(titulo: string): { slug: string; name: string } {
    const t = titulo.toLowerCase();

    if (t.match(/\b(carne|picanha|alcatra|contrafilé|contrafile|acem|acém|costela|frango|coxa|sobrecoxa|peito de frango|linguica|linguiça|bacon|pernil|bovino|suino|suíno|peixe|tilapia|tilápia|salmao|salmão|file|filé|patinho|cupim|maminha|hamburguer|hambúrguer|bife|costelinha|salsicha|paleta|coxao|coxão|mignon)\b/i)) {
      return { slug: 'carnes', name: 'Carnes & Aves' };
    }

    if (t.match(/\b(banana|maca|maçã|laranja|tomate|batata|cebola|cenoura|alface|limao|limão|manga|uva|abacaxi|melancia|mamao|mamão|alho|pera|pêra|fruta|legume|verdura|couve|repolho|brocolis|brócolis|pepino|chuchu|mandioca|maracuja|maracujá|morango|abacate|beterraba|pimentao|pimentão|abobora|abóbora)\b/i)) {
      return { slug: 'hortifruti', name: 'Hortifrúti' };
    }

    if (t.match(/\b(leite|iogurte|queijo|manteiga|requeijao|requeijão|mussarela|muçarela|prato|parmesao|parmesão|creme de leite|leite condensado|ovos|ovo|ricota|cottage|danone|parmesan|gouda|cheddar|provolone|coalho|nata|margarina)\b/i)) {
      return { slug: 'laticinios', name: 'Laticínios & Ovos' };
    }

    if (t.match(/\b(cerveja|refrigerante|suco|agua|água|vinho|vodka|energetico|energético|cha|chá|whisky|gin|coca|pepsi|guarana|guaraná|fanta|sprite|heineken|amstel|skol|brahma|antarctica|budweiser|corona|espumante|nectar|néctar|isotônico|gatorade)\b/i)) {
      return { slug: 'bebidas', name: 'Bebidas' };
    }

    if (t.match(/\b(sabao|sabão|detergente|amaciante|desinfetante|papel higienico|papel higiênico|shampoo|condicionador|creme dental|sabonete|esponja|limpador|cloro|agua sanitaria|água sanitária|lã de aco|lava roupas|vanish|omo|ypê|ype|veja|downy|comfort|brilhante|ipê|ipe|lustra|multiuso|desodorante|fralda|absorvente)\b/i)) {
      return { slug: 'limpeza', name: 'Limpeza & Higiene' };
    }

    return { slug: 'mercearia', name: 'Mercearia' };
  }

  public static async testScrape(rule: ScraperRuleDTO): Promise<ScrapedOfferPreview[]> {
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
      });

      const page = await context.newPage();

      // Interceptação de API SPA para capturar todos os itens
      const apiItems: ScrapedOfferPreview[] = [];
      page.on('response', async (response) => {
        const respUrl = response.url().toLowerCase();
        const status = response.status();
        if (
          status >= 200 &&
          status < 300 &&
          (respUrl.includes('/produtos') || respUrl.includes('/em-oferta') || respUrl.includes('/ofertas'))
        ) {
          try {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('application/json')) {
              const json = await response.json();
              const items = json.data || json.items || json.produtos || (Array.isArray(json) ? json : []);
              if (Array.isArray(items) && items.length > 0) {
                for (const it of items) {
                  const name = it.descricao || it.nome || it.name;
                  const cur = Number(it.oferta?.preco_oferta ?? it.preco_oferta ?? it.preco ?? it.price);
                  const orig = Number(it.oferta?.preco_antigo ?? it.preco_antigo ?? it.preco_original);
                  const un = it.unidade_sigla || it.unidade || 'un';
                  const img =
                    it.imagem ||
                    it.imagem_url ||
                    it.foto ||
                    it.url_imagem ||
                    (it.imagens && it.imagens[0]?.url) ||
                    (it.imagens && it.imagens[0]?.imagem) ||
                    '';

                  if (name && cur > 0) {
                    let disc = 0;
                    if (orig > cur) {
                      disc = Math.round((1 - cur / orig) * 100);
                    }
                    const cat = ScraperService.classificarCategoria(String(name));
                    apiItems.push({
                      name: String(name).trim(),
                      currentPrice: cur,
                      originalPrice: orig > 0 ? orig : undefined,
                      discountPercentage: disc,
                      unit: String(un).toLowerCase().trim(),
                      imageUrl: img ? String(img) : undefined,
                      category: cat.slug,
                      categoryName: cat.name,
                    });
                  }
                }
              }
            }
          } catch {}
        }
      });

      // Navega e aguarda que o DOM inicial carregue
      await page.goto(rule.catalogUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });

      // Aguarda até que o container dos produtos esteja presente no DOM do SPA
      const selectorPrincipal = rule.cardContainer?.trim() || 'vip-produto-preco';
      await page
        .waitForSelector(selectorPrincipal, { timeout: 15000 })
        .catch(async () => {
          // Fallback tolerante para SPAs complexas
          await page.waitForTimeout(3000);
        });

      // Rola para disparar renderização e lazy-loading
      await page.evaluate(() => window.scrollBy(0, 600)).catch(() => {});
      await page.waitForTimeout(1500);

      // Extrai os dados em tempo real no contexto da página (lê todos os produtos disponíveis)
      const rawData = await page.evaluate((sel) => {
        let elements = Array.from(document.querySelectorAll(sel.cardContainer));

        // Fallback inteligente se container não tiver ponto ou for classe VIP
        if (elements.length === 0 && !sel.cardContainer.startsWith('.') && !sel.cardContainer.startsWith('[')) {
          elements = Array.from(
            document.querySelectorAll('.' + sel.cardContainer + ', [' + sel.cardContainer + ']')
          );
        }
        if (elements.length === 0) {
          elements = Array.from(
            document.querySelectorAll(
              '.vip-card-produto, vip-card-produto, vip-produto-preco, [class*="vip-card"], [class*="card-produto"], .product-card, .item-card'
            )
          );
        }

        // Limita a um teto seguro de 150 itens para estabilidade de memória
        if (elements.length > 150) elements = elements.slice(0, 150);

        return elements.map((card) => {
          // Nome do Produto
          const nameEl = card.querySelector(sel.productName) || card.closest('a') || card;
          const name =
            nameEl?.getAttribute('title') ||
            nameEl?.getAttribute('aria-label') ||
            card.querySelector('h1, h2, h3, h4, [class*="nome"], [class*="title"]')?.textContent?.trim() ||
            nameEl?.textContent?.trim() ||
            '';

          // Preço Atual
          const currentPriceEl =
            card.querySelector(sel.currentPrice) ||
            card.querySelector('[class*="preco"], [class*="price"], strong, b');
          const currentPriceText = currentPriceEl ? currentPriceEl.textContent || '' : '';

          // Preço Original
          let origPriceText = '';
          if (sel.originalPrice) {
            const el =
              card.querySelector(sel.originalPrice) ||
              card.querySelector('del, s, [class*="preco-antigo"], [class*="old"], [class*="original"]');
            if (el) origPriceText = el.textContent || '';
          }

          // Desconto
          let discText = '';
          if (sel.discountTag) {
            const el =
              card.querySelector(sel.discountTag) ||
              card.querySelector('[class*="tag-oferta"], [class*="desconto"], [class*="discount"]');
            if (el) discText = el.textContent || '';
          }

          // Unidade
          let unitText = 'un';
          if (sel.unit) {
            const el = card.querySelector(sel.unit) || card.querySelector('[class*="unidade"], [class*="unit"]');
            if (el) unitText = el.textContent?.replace('/', '').trim() || 'un';
          }

          // Imagem do Produto
          let imgUrl = '';
          if (sel.imageSelector) {
            const imgEl = card.querySelector(sel.imageSelector) as HTMLImageElement | null;
            imgUrl =
              imgEl?.src ||
              imgEl?.getAttribute('data-src') ||
              imgEl?.getAttribute('src') ||
              '';
          }
          if (!imgUrl) {
            const fallbackImg = card.querySelector('img') as HTMLImageElement | null;
            imgUrl =
              fallbackImg?.src ||
              fallbackImg?.getAttribute('data-src') ||
              fallbackImg?.getAttribute('src') ||
              '';
          }

          return { name, currentPriceText, origPriceText, discText, unit: unitText, imgUrl };
        });
      }, rule);

      // Tratamento e sanitização dos valores monetários, URLs de imagem e categorização de cada item
      let resultado: ScrapedOfferPreview[] = rawData
        .map((item) => {
          const curPrice = ScraperService.parseMoney(item.currentPriceText);
          const origPrice = item.origPriceText ? ScraperService.parseMoney(item.origPriceText) : undefined;

          let discount = 0;
          const discMatch = item.discText?.match(/(\d+)%/);
          if (discMatch) {
            discount = parseInt(discMatch[1], 10);
          } else if (origPrice && origPrice > curPrice) {
            discount = Math.round((1 - curPrice / origPrice) * 100);
          }

          let finalImg = item.imgUrl || '';
          if (finalImg && !finalImg.startsWith('http') && !finalImg.startsWith('data:')) {
            try {
              const base = new URL(rule.catalogUrl);
              finalImg = new URL(finalImg, base.origin).href;
            } catch {}
          }

          const cat = ScraperService.classificarCategoria(item.name);

          return {
            name: item.name.trim(),
            currentPrice: curPrice,
            originalPrice: origPrice,
            discountPercentage: discount,
            unit: item.unit.toLowerCase(),
            imageUrl: finalImg || undefined,
            category: cat.slug,
            categoryName: cat.name,
          };
        })
        .filter((o) => o.name && o.currentPrice > 0);

      // Se o DOM não trouxe mas a API interceptou, usa todos os itens da API
      if (resultado.length === 0 && apiItems.length > 0) {
        resultado = apiItems;
      }

      return resultado;
    } finally {
      if (browser) await browser.close();
    }
  }

  private static parseMoney(val: string): number {
    if (!val) return 0;
    const clean = val.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }
}
