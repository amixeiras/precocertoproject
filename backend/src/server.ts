import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { BancoDadosTs } from './infra/db/banco';
import { SupermercadoScraperService } from './infra/scrapers/scraper';
import { ScraperService } from './services/scraper.service';
import { AgendadorColeta } from './application/agendador.cron';
import { BuscarPrecosUseCase } from './application/buscar-precos.usecase';

const app = express();
const PORT = process.env['PORT'] || 3001;

app.use(cors());
app.use(express.json());

// Instâncias
const banco = BancoDadosTs.getInstance();
const scraperService = new SupermercadoScraperService();
const agendador = new AgendadorColeta([scraperService]);
const buscarPrecosUseCase = new BuscarPrecosUseCase();

// Health Check
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const estatisticas = await banco.getEstatisticas();
    const cache = banco.getCacheStats();
    const tipoBanco = banco.isPostgresMode()
      ? 'PostgreSQL 16 (Docker/Cloud)'
      : 'SQLite Nativo (better-sqlite3)';
    res.json({
      status: 'online',
      servico: 'PriceTrack Preço Certo API',
      banco: tipoBanco,
      isPostgres: banco.isPostgresMode(),
      playwrightPronto: true,
      cache,
      estatisticas,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: 'error', erro: String(error) });
  }
});

// GET /api/cache/stats (Estatísticas do Cache em Memória)
app.get('/api/cache/stats', (_req: Request, res: Response) => {
  res.json({
    sucesso: true,
    cache: banco.getCacheStats(),
  });
});

// POST /api/cache/clear (Limpa o Cache em Memória manualmente)
app.post('/api/cache/clear', (_req: Request, res: Response) => {
  banco.invalidarCache();
  res.json({
    sucesso: true,
    mensagem: 'Cache em memória invalidado com sucesso.',
  });
});

// GET /api/regioes (Retorna as regiões cadastradas)
app.get('/api/regioes', async (_req: Request, res: Response) => {
  try {
    const regioes = await banco.getRegioes();
    res.json({
      total: regioes.length,
      dados: regioes,
    });
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao buscar regiões.', detalhe: String(error) });
  }
});

// GET /api/categorias (Retorna categorias cadastradas)
app.get('/api/categorias', async (_req: Request, res: Response) => {
  try {
    const categorias = await banco.getCategorias();
    res.json({
      total: categorias.length,
      dados: categorias,
    });
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao buscar categorias.', detalhe: String(error) });
  }
});

// GET /api/categorias/parametros (Lista parametrizações de categorias)
app.get('/api/categorias/parametros', async (req: Request, res: Response) => {
  try {
    const categoriaId = req.query['categoriaId'] as string | undefined;
    const parametros = await banco.getParametrizacoesCategoria(categoriaId);
    res.json({
      sucesso: true,
      total: parametros.length,
      dados: parametros,
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar parametrizações de categoria.', detalhe: String(error) });
  }
});

// POST /api/categorias/parametros (Salva ou atualiza parametrização de categoria)
app.post('/api/categorias/parametros', async (req: Request, res: Response) => {
  try {
    const { categoryId, description, id } = req.body;
    if (!categoryId || !description) {
      res.status(400).json({ sucesso: false, erro: 'Campos categoryId e description são obrigatórios.' });
      return;
    }
    const resultado = await banco.salvarParametrizacaoCategoria({ id, categoryId, description });
    res.json({
      sucesso: true,
      ...resultado,
      mensagem: 'Parametrização de categoria salva com sucesso.',
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: 'Falha ao salvar parametrização de categoria.', detalhe: String(error) });
  }
});

// DELETE /api/categorias/parametros/:id (Exclui parametrização de categoria)
app.delete('/api/categorias/parametros/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resultado = await banco.excluirParametrizacaoCategoria(id as string);
    if (resultado.success) {
      res.json({ sucesso: true, mensagem: 'Parametrização excluída com sucesso.' });
    } else {
      res.status(404).json({ sucesso: false, erro: 'Parametrização não encontrada.' });
    }
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: 'Falha ao excluir parametrização.', detalhe: String(error) });
  }
});

// GET /api/mercados (Lista estabelecimentos com suas top 5 ofertas)
app.get('/api/mercados', async (req: Request, res: Response) => {
  try {
    const regiaoId = req.query['regiaoId'] as string | undefined;
    const termo = req.query['termo'] as string | undefined;
    const mercados = await banco.getMercados(regiaoId, termo);
    res.json({
      total: mercados.length,
      dados: mercados,
    });
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao buscar mercados.', detalhe: String(error) });
  }
});

// POST /api/auth/login (Autenticação do Administrador)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ sucesso: false, erro: 'Usuário e senha são obrigatórios.' });
      return;
    }
    const usuario = await banco.autenticarUsuario(username, password);
    if (!usuario) {
      res.status(401).json({ sucesso: false, erro: 'Usuário ou senha inválidos.' });
      return;
    }
    res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso.',
      token: `token-admin-${Date.now()}`,
      usuario,
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: 'Falha interna ao autenticar.', detalhe: String(error) });
  }
});

// PUT /api/mercados/:id (Edita a descrição/nome do estabelecimento)
app.put('/api/mercados/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, descricao } = req.body;
    const novoNome = (nome || descricao) as string;
    if (!novoNome || !novoNome.trim()) {
      res.status(400).json({ sucesso: false, erro: 'A nova descrição do estabelecimento é obrigatória.' });
      return;
    }
    const atualizado = await banco.atualizarDescricaoMercado(id as string, novoNome);
    if (!atualizado) {
      res.status(404).json({ sucesso: false, erro: 'Estabelecimento não encontrado.' });
      return;
    }
    res.json({
      sucesso: true,
      mensagem: 'Descrição do estabelecimento atualizada com sucesso.',
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: 'Erro ao atualizar estabelecimento.', detalhe: String(error) });
  }
});

// DELETE /api/mercados/:id (Exclui ofertas e o estabelecimento, mantendo intactos os produtos cadastrados)
app.delete('/api/mercados/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resultado = await banco.excluirMercado(id as string);
    if (!resultado.sucesso) {
      res.status(404).json({ sucesso: false, erro: 'Estabelecimento não encontrado para exclusão.' });
      return;
    }
    res.json({
      sucesso: true,
      mensagem: 'Estabelecimento e ofertas excluídos com sucesso. Catálogo de produtos preservado.',
      ofertasExcluidas: resultado.ofertasExcluidas,
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: 'Erro ao excluir estabelecimento.', detalhe: String(error) });
  }
});

// GET /api/urls-configuradas (Retorna os mercados que possuem link de encarte/promoção)
app.get('/api/urls-configuradas', async (_req: Request, res: Response) => {
  try {
    const mercadosComUrl = await banco.getMercadosComUrl();
    res.json({
      total: mercadosComUrl.length,
      dados: mercadosComUrl.map((m) => ({
        id: m.id,
        nomeMercado: m.name,
        mercadoId: m.id,
        regiao: m.region_name,
        url: m.flyer_url,
      })),
    });
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao buscar mercados com URL.', detalhe: String(error) });
  }
});

// GET /api/precos (Consulta produtos e preços monitorados com filtro)
app.get('/api/precos', async (req: Request, res: Response) => {
  try {
    const termo = req.query['termo'] as string | undefined;
    const regiaoId = req.query['regiaoId'] as string | undefined;
    const categoria = req.query['categoria'] as string | undefined;
    const produtos = await buscarPrecosUseCase.execute({ termo, regiaoId, categoria });
    res.json({
      total: produtos.length,
      dados: produtos,
    });
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao buscar preços monitorados.', detalhe: String(error) });
  }
});

// POST /api/coleta/url (Raspa diretamente uma URL fornecida pelo usuário via Playwright)
app.post('/api/coleta/url', async (req: Request, res: Response) => {
  try {
    const { url, mercadoId, nomeMercado, regiao } = req.body;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      res.status(400).json({ erro: 'URL inválida. Forneça uma URL iniciando com http:// ou https://' });
      return;
    }

    const regiaoSolicitada = regiao || 'auto';
    console.log(`🚀 [Endpoint /api/coleta/url] Raspando URL com Playwright: ${url} (Região: ${regiaoSolicitada})`);
    const ofertasExtraidas = await scraperService.rasparUrlEspecifica(
      url,
      mercadoId || 'custom-market',
      nomeMercado || 'Supermercado Online',
      regiaoSolicitada
    );

    if (ofertasExtraidas.length > 0) {
      await banco.salvarOfertas(ofertasExtraidas);
    }

    const regiaoResolvida = ofertasExtraidas[0]?.regiao || (regiaoSolicitada !== 'auto' ? regiaoSolicitada : 'Centro');

    res.json({
      mensagem: `${ofertasExtraidas.length} produtos/ofertas extraídos com sucesso da URL e salvos. Região: "${regiaoResolvida}".`,
      url,
      regiao: regiaoResolvida,
      totalExtraido: ofertasExtraidas.length,
      dados: ofertasExtraidas,
    });
  } catch (error) {
    console.error('Erro na rota /api/coleta/url:', error);
    res.status(500).json({ erro: 'Falha ao raspar a URL fornecida.', detalhe: String(error) });
  }
});

// POST /api/coleta/manual (Dispara raspagem imediata de todos os mercados com flyer_url salvos)
app.post('/api/coleta/manual', async (_req: Request, res: Response) => {
  try {
    const resultado = await agendador.executarColetaManual();
    res.json({
      mensagem: 'Coleta geral executada via Playwright com sucesso e persistida no banco!',
      resultado,
    });
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao executar coleta manual.', detalhe: String(error) });
  }
});

// POST /api/limpar-dados (Limpa mercados, produtos e ofertas para testes limpos)
app.post('/api/limpar-dados', async (_req: Request, res: Response) => {
  try {
    await banco.limparTodosOsDados();
    res.json({ mensagem: 'Todos os mercados, produtos e ofertas foram apagados com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao limpar dados.', detalhe: String(error) });
  }
});

// ========================================================
// ENDPOINTS DO PASSO 2 (Conforme Guia Passo a Passo do DOCX)
// ========================================================

// 1. Rota de Teste para o Modal (não grava na base de dados)
app.post('/api/scraper/test', async (req: Request, res: Response) => {
  try {
    const previewOffers = await ScraperService.testScrape(req.body);
    return res.json({ success: true, offers: previewOffers });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Rota para Confirmar e Persistir no Banco de Dados
app.post('/api/scraper/save', async (req: Request, res: Response) => {
  try {
    let { marketId, categoryId, offers, catalogUrl, patternId } = req.body;
    if ((!marketId || marketId === '__novo__') && catalogUrl) {
      const lowerUrl = catalogUrl.toLowerCase();
      if (lowerUrl.includes('davo')) marketId = 'davo-alto-ipiranga';
      else if (lowerUrl.includes('shibata')) marketId = 'shibata-mogilar';
      else if (lowerUrl.includes('semar')) marketId = 'semar-centro';
      else if (lowerUrl.includes('alabarce')) marketId = 'alabarce-vila-oliveira';
      else if (lowerUrl.includes('assai')) marketId = 'assai-braz-cubas';
      else {
        try {
          const host = new URL(catalogUrl).hostname.replace('www.', '').split('.')[0];
          marketId = `mkt-${host}`;
        } catch {
          marketId = 'mkt-personalizado';
        }
      }
    }

    if (!marketId || !offers || !Array.isArray(offers)) {
      res.status(400).json({ success: false, error: 'Parâmetros inválidos. marketId e offers são obrigatórios.' });
      return;
    }

    await banco.salvarOfertasRegraScraper(marketId, categoryId || undefined, offers, catalogUrl, patternId);
    return res.json({ success: true, message: 'Ofertas guardadas com sucesso no banco de dados!' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Rota para Listar Padrões de Scraping Gravados no Banco
app.get('/api/scraper/patterns', async (_req: Request, res: Response) => {
  try {
    const patterns = await banco.getScraperPatterns();
    return res.json({ sucesso: true, success: true, dados: patterns, patterns });
  } catch (error: any) {
    return res.status(500).json({ sucesso: false, success: false, erro: error.message, error: error.message });
  }
});

// 4. Rota para Salvar / Atualizar Padrão de Scraping e Vincular ao Estabelecimento
app.post('/api/scraper/patterns', async (req: Request, res: Response) => {
  try {
    const { name, cardContainer, productName, currentPrice } = req.body;
    if (!name || !cardContainer || !productName || !currentPrice) {
      res.status(400).json({ sucesso: false, success: false, erro: 'Campos obrigatórios do padrão ausentes (name, cardContainer, productName, currentPrice).' });
      return;
    }
    const result = await banco.salvarOuAtualizarPadraoScraper(req.body);
    return res.json({ sucesso: true, ...result, message: 'Padrão salvo com sucesso!' });
  } catch (error: any) {
    return res.status(500).json({ sucesso: false, success: false, erro: error.message, error: error.message });
  }
});

// 5. Rota para Excluir Padrão de Scraping
app.delete('/api/scraper/patterns/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ sucesso: false, success: false, erro: 'ID do padrão não informado.' });
      return;
    }
    const result = await banco.excluirPadraoScraper(id as string);
    if (!result.sucesso) {
      res.status(404).json({ sucesso: false, success: false, erro: result.erro || 'Padrão não encontrado.' });
      return;
    }
    return res.json({ sucesso: true, success: true, message: 'Padrão excluído com sucesso!' });
  } catch (error: any) {
    return res.status(500).json({ sucesso: false, success: false, erro: error.message });
  }
});

// Inicialização
async function bootstrap() {
  await banco.inicializar();

  // Inicia agendamento automático diário (06:00 e 18:00)
  agendador.iniciarAgendamento();

  const bancoNome = banco.isPostgresMode()
    ? 'PostgreSQL 16 (Docker/Cloud)'
    : 'SQLite Nativo (better-sqlite3)';

  app.listen(PORT, () => {
    console.log(`🚀 [PriceTrack API] Servidor rodando em http://localhost:${PORT}`);
    console.log(`🗄️ [Database] Banco ativo: ${bancoNome}`);
    console.log(`📌 POST /api/scraper/test (Passo 2 do Guia)`);
    console.log(`📌 POST /api/scraper/save (Passo 2 do Guia)`);
  });

  // Listener secundário na porta 3000 caso requisições façam chamada direta para :3000
  if (Number(PORT) !== 3000) {
    try {
      const server3000 = app.listen(3000, () => {
        console.log(`🚀 [PriceTrack API] Alias ativo na porta http://localhost:3000`);
      });
      server3000.on('error', () => {});
    } catch {}
  }
}

bootstrap().catch((err) => {
  console.error('Erro fatal ao iniciar servidor:', err);
});
