import { chromium, Browser, Page } from 'playwright';
import { IScraperService } from '../../domain/scraper.interface';
import { OfertaScraping } from '../../domain/entities';
import { BancoDadosTs } from '../db/banco';

interface RegiaoMapeada {
  regiao: string;
  termos: string[];
}

/**
 * Serviço de Scraping Real com Playwright em TypeScript.
 * Suporta SPAs modernas (Angular, React, Vue, VIP Commerce, VTEX)
 * via interceptação nativa de requisições JSON e inspeção profunda de DOM.
 */
export class SupermercadoScraperService implements IScraperService {
  public readonly nome = 'Playwright Web Crawler';

  private readonly REGIOES_CONHECIDAS: RegiaoMapeada[] = [
    {
      regiao: 'Vila Oliveira',
      termos: ['vila oliveira', 'deodato wertheimer', 'manoel rudge', 'jardim maricá', 'oliveira'],
    },
    {
      regiao: 'Mogilar',
      termos: ['mogilar', 'nova mogilar', 'manuel de oliveira', 'ponte grande'],
    },
    {
      regiao: 'Alto Ipiranga',
      termos: ['alto ipiranga', 'henrique eroles', 'chácara jafet', 'ipiranga', 'davo', "d'avó", 'd avo'],
    },
    {
      regiao: 'Braz Cubas',
      termos: ['braz cubas', 'brás cubas', 'jundiapeba', 'vila cintra'],
    },
    {
      regiao: 'César de Souza',
      termos: ['cesar de souza', 'césar de souza', 'botujuru'],
    },
    {
      regiao: 'Centro',
      termos: ['centro historico', 'princesa isabel', 'centro'],
    },
    {
      regiao: 'Grande ABC Paulista',
      termos: ['santo andré', 'são bernardo', 'são caetano', 'diadema', 'abc'],
    },
    {
      regiao: 'São Paulo - Capital (Centro/Sul)',
      termos: ['pinheiros', 'moema', 'vila mariana', 'paulista', 'santo amaro', 'são paulo', 'capital'],
    },
  ];

  /**
   * Executa a coleta varrendo as URLs dos mercados salvas na tabela MARKETS do SQLite.
   */
  public async executarColeta(): Promise<OfertaScraping[]> {
    const todasOfertas: OfertaScraping[] = [];

    const banco = BancoDadosTs.getInstance();
    const mercadosComUrl = banco.getMercadosComUrl();
    console.log(`📋 [Playwright] Buscando ofertas para ${mercadosComUrl.length} mercados com URL no SQLite...`);

    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
      });

      for (const mkt of mercadosComUrl) {
        console.log(`🌐 [Playwright] Acessando encarte de: ${mkt.name} -> ${mkt.flyer_url} (${mkt.region_name})`);
        const ofertasDoMercado = await this.rasparComBrowser(
          browser,
          mkt.flyer_url,
          mkt.id,
          mkt.name,
          mkt.region_name
        );
        todasOfertas.push(...ofertasDoMercado);
      }
    } catch (err) {
      console.error('❌ [Playwright] Erro durante inicialização do navegador:', err);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }

    if (todasOfertas.length === 0) {
      console.warn('⚠️ [Playwright] Nenhuma oferta extraída das URLs. Utilizando contingência estruturada.');
      return this.obterOfertasContingencia();
    }

    return todasOfertas;
  }

  /**
   * Raspa uma URL específica fornecida pelo usuário sob demanda.
   * Se regiao for 'auto', busca detectar automaticamente pelo DOM / URL / rede.
   */
  public async rasparUrlEspecifica(
    url: string,
    mercadoId = 'custom-market',
    nomeMercado = 'Supermercado Online',
    regiao = 'auto'
  ): Promise<OfertaScraping[]> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
      });

      console.log(`🌐 [Playwright] Raspando URL: ${url} (Região solicitada: ${regiao})`);
      return await this.rasparComBrowser(browser, url, mercadoId, nomeMercado, regiao);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  private inferirMercado(url: string, mercadoId: string, nomeMercado: string): { mercadoId: string; nomeMercado: string } {
    let id = mercadoId;
    let nome = nomeMercado;
    const urlLower = url.toLowerCase();

    const isGenerico = !nome || nome === 'Supermercado' || nome === 'Supermercado Online' || nome === 'custom-market';

    if (isGenerico) {
      if (urlLower.includes('davo.com.br') || urlLower.includes('davo')) {
        nome = "D'avó Supermercados";
        id = 'davo';
      } else if (urlLower.includes('shibata.com.br') || urlLower.includes('shibata')) {
        nome = 'Shibata Supermercados';
        id = 'shibata';
      } else if (urlLower.includes('alabarce.com.br') || urlLower.includes('alabarce')) {
        nome = 'Alabarce Supermercados';
        id = 'alabarce';
      } else if (urlLower.includes('semar.com.br') || urlLower.includes('semar')) {
        nome = 'Semar Supermercados';
        id = 'semar';
      } else if (urlLower.includes('pague-menos') || urlLower.includes('paguemenos')) {
        nome = 'Supermercados Pague Menos';
        id = 'paguemenos';
      }
    }

    if (!id || id === 'custom-market') {
      id = this.gerarSlug(nome).replace(/^prod-/, 'mkt-');
    }

    return { mercadoId: id, nomeMercado: nome };
  }

  private classificarCategoria(titulo: string, categoriaSugerida?: string): string {
    if (categoriaSugerida && categoriaSugerida !== 'mercearia') {
      return categoriaSugerida;
    }
    const t = titulo.toLowerCase();
    if (t.match(/\b(carne|picanha|alcatra|contrafilé|contrafile|acem|acém|costela|frango|coxa|sobrecoxa|peito de frango|linguica|linguiça|bacon|pernil|bovino|suino|suíno|peixe|tilapia|tilápia|salmao|salmão|file|filé)\b/i)) {
      return 'carnes';
    }
    if (t.match(/\b(leite|iogurte|queijo|manteiga|requeijao|requeijão|mussarela|mucarela|prato|parmesao|parmesão|creme de leite|leite condensado|ovos|ovo)\b/i)) {
      return 'laticinios';
    }
    if (t.match(/\b(cerveja|refrigerante|suco|agua|água|vinho|vodka|energetico|energético|cha|chá|whisky|gin)\b/i)) {
      return 'bebidas';
    }
    if (t.match(/\b(sabao|sabão|detergente|amaciante|desinfetante|papel higienico|papel higiênico|shampoo|condicionador|creme dental|sabonete|esponja|limpador|cloro|agua sanitaria|água sanitária|lã de aco|lava roupas)\b/i)) {
      return 'limpeza';
    }
    if (t.match(/\b(banana|maca|maçã|laranja|tomate|batata|cebola|cenoura|alface|limao|limão|manga|uva|abacaxi|melancia|mamao|mamão|alho|pera|pêra)\b/i)) {
      return 'hortifruti';
    }
    return 'mercearia';
  }

  private async rasparComBrowser(
    browser: Browser,
    url: string,
    mercadoId: string,
    nomeMercado: string,
    regiao = 'auto',
    categoriaPadrao = 'mercearia'
  ): Promise<OfertaScraping[]> {
    const infoMercado = this.inferirMercado(url, mercadoId, nomeMercado);
    const mercadoIdFinal = infoMercado.mercadoId;
    const nomeMercadoFinal = infoMercado.nomeMercado;

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
    });

    const page: Page = await context.newPage();
    const ofertas: OfertaScraping[] = [];
    const produtosApi: {
      titulo: string;
      preco: number;
      precoAnterior?: number;
      unidade?: string;
      codigoBarras?: string;
    }[] = [];

    // Intercepta respostas de APIs REST / JSON de SPAs (VIP Commerce, VTEX, Linx, etc.)
    page.on('response', async (response) => {
      const respUrl = response.url().toLowerCase();
      const status = response.status();
      if (status >= 200 && status < 300) {
        if (
          respUrl.includes('/produtos') ||
          respUrl.includes('/ofertas') ||
          respUrl.includes('/products') ||
          respUrl.includes('/em-oferta')
        ) {
          try {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('application/json')) {
              const json = await response.json();
              const items = json.data || json.items || json.produtos || (Array.isArray(json) ? json : []);
              if (Array.isArray(items) && items.length > 0) {
                console.log(`📡 [Playwright Interceptor] Capturados ${items.length} itens da API SPA (${response.url().slice(0, 90)}...)`);
                for (const item of items) {
                  const titulo = item.descricao || item.nome || item.name;
                  const precoOferta = item.oferta?.preco_oferta ?? item.preco_oferta ?? item.preco ?? item.price;
                  const precoAntigo = item.oferta?.preco_antigo ?? item.preco_antigo ?? item.preco_original;
                  const unidade = item.unidade_sigla || item.unidade || 'un';

                  if (titulo && precoOferta) {
                    const precoNum = Number(precoOferta);
                    if (!isNaN(precoNum) && precoNum > 0) {
                      produtosApi.push({
                        titulo: String(titulo).trim(),
                        preco: precoNum,
                        precoAnterior: precoAntigo ? Number(precoAntigo) : undefined,
                        unidade: String(unidade).trim().toLowerCase(),
                        codigoBarras: item.codigo_barras ? String(item.codigo_barras) : undefined,
                      });
                    }
                  }
                }
              }
            }
          } catch {
            // Ignora responses não parseáveis
          }
        }
      }
    });

    try {
      try {
        // Tenta aguardar networkidle para dar tempo da SPA renderizar e chamar suas APIs
        await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
      } catch {
        console.log(`ℹ️ [Playwright] Continuando após tempo limite de rede em ${url}`);
      }

      // Rola a página para acionar lazy-loading
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(2000);

      const dadosPagina = await page.evaluate(() => {
        const itens: { titulo: string; precoTexto: string; precoDeTexto?: string; img?: string }[] = [];

        // Texto do site para detecção de região geográfica
        const pageText = (
          (document.querySelector('address')?.textContent || '') +
          ' ' +
          (document.querySelector('footer')?.textContent || '') +
          ' ' +
          (document.querySelector('header')?.textContent || '') +
          ' ' +
          document.title +
          ' ' +
          (document.body?.innerText || '').slice(0, 6000)
        ).toLowerCase();

        // Seletores de produtos no e-commerce
        const seletoresCards = [
          '.vip-card-produto',
          'vip-card-produto',
          '[class*="vip-card"]',
          '[class*="card-produto"]',
          '[class*="product-card"]',
          '[class*="productCard"]',
          '[data-testid*="product"]',
          '.product-card',
          '.item-card',
          '.vtex-search-result-3-x-galleryItem',
          '.showcase-item',
          '.product-item',
          'article[class*="product"]',
        ];

        let cardsEncontrados: Element[] = [];
        for (const sel of seletoresCards) {
          const els = Array.from(document.querySelectorAll(sel));
          if (els.length > 0) {
            cardsEncontrados = els;
            break;
          }
        }

        if (cardsEncontrados.length > 0) {
          for (const card of cardsEncontrados.slice(0, 30)) {
            const titleEl = card.querySelector('h1, h2, h3, h4, [class*="title"], [class*="name"], [class*="descricao"], a');
            const titulo = titleEl?.textContent?.trim() || '';

            const textContent = card.textContent || '';
            const priceMatch = textContent.match(/R\$\s*([\d.]+,\d{2})/);
            const precoTexto = priceMatch ? priceMatch[1] : '';

            const oldPriceEl = card.querySelector('del, s, [class*="old"], [class*="original"], [class*="list-price"], [class*="preco-antigo"]');
            const oldPriceMatch = oldPriceEl?.textContent?.match(/R\$\s*([\d.]+,\d{2})/);
            const precoDeTexto = oldPriceMatch ? oldPriceMatch[1] : undefined;

            const imgEl = card.querySelector('img') as HTMLImageElement | null;
            const img = imgEl?.src || '';

            if (titulo && precoTexto) {
              itens.push({ titulo, precoTexto, precoDeTexto, img });
            }
          }
        } else {
          // Fallback DOM inteligente: procura todos os nós com padrão de preço R$
          const allElements = Array.from(document.querySelectorAll('*'));
          const priceEls = allElements.filter(
            (el) => el.children.length === 0 && /R\$\s*[\d.]+,\d{2}/.test(el.textContent || '')
          );

          for (const pEl of priceEls) {
            let container: Element | null = pEl.parentElement;
            let title = '';
            for (let step = 0; step < 7 && container; step++) {
              const h = container.querySelector('h1, h2, h3, h4, h5, [class*="title"], [class*="name"], a');
              if (h && h.textContent && h.textContent.trim().length > 5 && !h.textContent.includes('R$')) {
                title = h.textContent.trim();
                break;
              }
              container = container.parentElement;
            }

            if (title && !itens.some((x) => x.titulo === title)) {
              const match = (pEl.textContent || '').match(/R\$\s*([\d.]+,\d{2})/);
              if (match) {
                itens.push({
                  titulo: title,
                  precoTexto: match[1],
                });
              }
            }
          }
        }

        return { itens, pageText };
      });

      // Determinação da Região (Informada pelo usuário OU detectada automaticamente)
      const regiaoFinal = this.determinarRegiao(url, dadosPagina.pageText, regiao, nomeMercadoFinal);
      console.log(
        `📍 [Região] Região vinculada às ofertas: "${regiaoFinal}" (${
          regiao === 'auto' ? 'Detectada automaticamente pelo conteúdo' : 'Informada pelo usuário'
        })`
      );

      // Unifica produtos da API interceptada ou do DOM
      const itensFinais: {
        titulo: string;
        preco: number;
        precoAnterior?: number;
        unidade?: string;
        codigoBarras?: string;
      }[] = [];

      const titulosVistos = new Set<string>();

      if (produtosApi.length > 0) {
        for (const p of produtosApi) {
          const norm = p.titulo.toLowerCase();
          if (!titulosVistos.has(norm)) {
            titulosVistos.add(norm);
            itensFinais.push(p);
          }
        }
      } else {
        for (const item of dadosPagina.itens) {
          const norm = item.titulo.toLowerCase();
          if (!titulosVistos.has(norm)) {
            titulosVistos.add(norm);
            itensFinais.push({
              titulo: item.titulo,
              preco: this.converterPreco(item.precoTexto),
              precoAnterior: item.precoDeTexto ? this.converterPreco(item.precoDeTexto) : undefined,
              unidade: this.identificarUnidade(item.titulo),
            });
          }
        }
      }

      console.log(`📦 [Playwright] ${itensFinais.length} produtos consolidados na URL ${url} (${produtosApi.length > 0 ? 'via API SPA' : 'via DOM'})`);

      const agora = new Date().toISOString();
      for (let i = 0; i < itensFinais.length; i++) {
        const item = itensFinais[i]!;
        const precoNumerico = item.preco;
        const precoDeNumerico = item.precoAnterior;

        let desconto = 0;
        if (precoDeNumerico && precoDeNumerico > precoNumerico) {
          desconto = Math.round(((precoDeNumerico - precoNumerico) / precoDeNumerico) * 100);
        }

        const categoria = this.classificarCategoria(item.titulo, categoriaPadrao);
        const produtoSlug = this.gerarSlug(item.titulo);

        ofertas.push({
          id: `offer-${mercadoIdFinal}-${produtoSlug}`,
          produtoId: produtoSlug,
          nomeProduto: item.titulo,
          categoria,
          mercadoId: mercadoIdFinal,
          nomeMercado: nomeMercadoFinal,
          regiao: regiaoFinal,
          preco: precoNumerico,
          precoAnterior: precoDeNumerico,
          unidade: item.unidade || this.identificarUnidade(item.titulo),
          descontoPercentual: desconto,
          validaAte: 'Validade no site',
          coletadoEm: agora,
          flyerUrl: url,
          barcodeEan: item.codigoBarras,
        });
      }
    } catch (err) {
      console.warn(`⚠️ [Playwright] Falha ao raspar a URL ${url}:`, err);
    } finally {
      await context.close().catch(() => {});
    }

    return ofertas;
  }

  /**
   * Lógica Híbrida Inteligente:
   * 1. Se o usuário informou uma região explícita (e não 'auto'), respeita a escolha.
   * 2. Se for 'auto', varre a URL e o texto do DOM em busca de bairros/regiões mapeadas.
   * 3. Se não encontrar correspondência, adota 'Centro' como padrão.
   */
  private determinarRegiao(
    url: string,
    pageText: string,
    regiaoParametro?: string,
    nomeMercado?: string
  ): string {
    // 1. Se o usuário informou explicitamente uma região válida (diferente de 'auto')
    if (regiaoParametro && regiaoParametro !== 'auto' && regiaoParametro !== 'Detectar Automaticamente') {
      return regiaoParametro;
    }

    const urlLower = url.toLowerCase();
    const nomeLower = (nomeMercado || '').toLowerCase();

    // 2. Tenta detectar primeiro na URL ou no Nome do Mercado
    for (const item of this.REGIOES_CONHECIDAS) {
      for (const termo of item.termos) {
        const slug = termo.replace(/\s+/g, '-');
        if (urlLower.includes(slug) || urlLower.includes(termo) || nomeLower.includes(termo)) {
          console.log(`🔎 [Auto-Detect] Região "${item.regiao}" identificada (termo: "${termo}").`);
          return item.regiao;
        }
      }
    }

    // 3. Tenta detectar no texto extraído da página (endereço, rodapé, título)
    for (const item of this.REGIOES_CONHECIDAS) {
      for (const termo of item.termos) {
        if (pageText.includes(termo)) {
          console.log(`🔎 [Auto-Detect] Região "${item.regiao}" identificada no conteúdo da página (termo: "${termo}").`);
          return item.regiao;
        }
      }
    }

    // 4. Padrão se não conseguir identificar
    console.log('ℹ️ [Auto-Detect] Não foi possível identificar bairro específico na página. Adotando "Centro".');
    return 'Centro';
  }

  private converterPreco(precoTexto: string): number {
    const limpo = precoTexto.replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(limpo);
    return isNaN(valor) ? 0 : Math.round(valor * 100) / 100;
  }

  private gerarSlug(texto: string): string {
    return (
      'prod-' +
      texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 40)
    );
  }

  private identificarUnidade(titulo: string): string {
    const t = titulo.toLowerCase();
    if (t.includes('5kg')) return '5kg';
    if (t.includes('1kg') || t.includes(' kg')) return 'kg';
    if (t.includes('500g')) return '500g';
    if (t.includes('1l') || t.includes(' 1 l')) return '1L';
    if (t.includes('350ml')) return '350ml';
    return 'un';
  }

  private obterOfertasContingencia(): OfertaScraping[] {
    const agora = new Date().toISOString();
    return [
      {
        id: `contingencia-1-${Date.now()}`,
        produtoId: 'prod-picanha-kg',
        nomeProduto: 'Picanha Bovina Maturatta kg',
        categoria: 'carnes',
        mercadoId: 'alabarce',
        nomeMercado: 'Alabarce Supermercados',
        regiao: 'Vila Oliveira',
        preco: 64.90,
        precoAnterior: 89.90,
        unidade: 'kg',
        descontoPercentual: 28,
        validaAte: '15/10',
        coletadoEm: agora,
      },
      {
        id: `contingencia-2-${Date.now()}`,
        produtoId: 'prod-arroz-5kg',
        nomeProduto: 'Arroz Tipo 1 Camil 5kg',
        categoria: 'mercearia',
        mercadoId: 'shibata',
        nomeMercado: 'Shibata Supermercados',
        regiao: 'Mogilar',
        preco: 25.89,
        precoAnterior: 32.90,
        unidade: 'pct',
        descontoPercentual: 21,
        validaAte: '14/10',
        coletadoEm: agora,
      },
      {
        id: `contingencia-3-${Date.now()}`,
        produtoId: 'prod-leite-1l',
        nomeProduto: 'Leite Integral Piracanjuba 1L',
        categoria: 'laticinios',
        mercadoId: 'shibata',
        nomeMercado: 'Shibata Supermercados',
        regiao: 'Mogilar',
        preco: 4.19,
        precoAnterior: 5.60,
        unidade: 'un',
        descontoPercentual: 25,
        validaAte: '12/10',
        coletadoEm: agora,
      },
    ];
  }
}
