"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const banco_1 = require("./infra/db/banco");
const scraper_1 = require("./infra/scrapers/scraper");
const scraper_service_1 = require("./services/scraper.service");
const agendador_cron_1 = require("./application/agendador.cron");
const buscar_precos_usecase_1 = require("./application/buscar-precos.usecase");
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Instâncias
const banco = banco_1.BancoDadosTs.getInstance();
const scraperService = new scraper_1.SupermercadoScraperService();
const agendador = new agendador_cron_1.AgendadorColeta([scraperService]);
const buscarPrecosUseCase = new buscar_precos_usecase_1.BuscarPrecosUseCase();
// Health Check
app.get('/api/health', (_req, res) => {
    const estatisticas = banco.getEstatisticas();
    const cache = banco.getCacheStats();
    res.json({
        status: 'online',
        servico: 'PriceTrack Preço Certo API',
        banco: 'SQLite Nativo (better-sqlite3)',
        playwrightPronto: true,
        cache,
        estatisticas,
        timestamp: new Date().toISOString(),
    });
});
// GET /api/cache/stats (Estatísticas do Cache em Memória)
app.get('/api/cache/stats', (_req, res) => {
    res.json({
        sucesso: true,
        cache: banco.getCacheStats(),
    });
});
// POST /api/cache/clear (Limpa o Cache em Memória manualmente)
app.post('/api/cache/clear', (_req, res) => {
    banco.invalidarCache();
    res.json({
        sucesso: true,
        mensagem: 'Cache em memória invalidado com sucesso.',
    });
});
// GET /api/regioes (Retorna as regiões cadastradas no SQLite)
app.get('/api/regioes', (_req, res) => {
    try {
        const regioes = banco.getRegioes();
        res.json({
            total: regioes.length,
            dados: regioes,
        });
    }
    catch (error) {
        res.status(500).json({ erro: 'Falha ao buscar regiões.', detalhe: String(error) });
    }
});
// GET /api/categorias (Retorna categorias cadastradas no SQLite)
app.get('/api/categorias', (_req, res) => {
    try {
        const categorias = banco.getCategorias();
        res.json({
            total: categorias.length,
            dados: categorias,
        });
    }
    catch (error) {
        res.status(500).json({ erro: 'Falha ao buscar categorias.', detalhe: String(error) });
    }
});
// GET /api/categorias/parametros (Lista parametrizações de categorias)
app.get('/api/categorias/parametros', (req, res) => {
    try {
        const categoriaId = req.query['categoriaId'];
        const parametros = banco.getParametrizacoesCategoria(categoriaId);
        res.json({
            sucesso: true,
            total: parametros.length,
            dados: parametros,
        });
    }
    catch (error) {
        res.status(500).json({ sucesso: false, erro: 'Falha ao buscar parametrizações de categoria.', detalhe: String(error) });
    }
});
// POST /api/categorias/parametros (Salva ou atualiza parametrização de categoria)
app.post('/api/categorias/parametros', (req, res) => {
    try {
        const { categoryId, description, id } = req.body;
        if (!categoryId || !description) {
            res.status(400).json({ sucesso: false, erro: 'Campos categoryId e description são obrigatórios.' });
            return;
        }
        const resultado = banco.salvarParametrizacaoCategoria({ id, categoryId, description });
        res.json({
            sucesso: true,
            ...resultado,
            mensagem: 'Parametrização de categoria salva com sucesso.',
        });
    }
    catch (error) {
        res.status(500).json({ sucesso: false, erro: 'Falha ao salvar parametrização de categoria.', detalhe: String(error) });
    }
});
// DELETE /api/categorias/parametros/:id (Exclui parametrização de categoria)
app.delete('/api/categorias/parametros/:id', (req, res) => {
    try {
        const { id } = req.params;
        const resultado = banco.excluirParametrizacaoCategoria(id);
        if (resultado.success) {
            res.json({ sucesso: true, mensagem: 'Parametrização excluída com sucesso.' });
        }
        else {
            res.status(404).json({ sucesso: false, erro: 'Parametrização não encontrada.' });
        }
    }
    catch (error) {
        res.status(500).json({ sucesso: false, erro: 'Falha ao excluir parametrização.', detalhe: String(error) });
    }
});
// GET /api/mercados (Lista estabelecimentos do SQLite com suas top 5 ofertas)
app.get('/api/mercados', (req, res) => {
    try {
        const regiaoId = req.query['regiaoId'];
        const termo = req.query['termo'];
        const mercados = banco.getMercados(regiaoId, termo);
        res.json({
            total: mercados.length,
            dados: mercados,
        });
    }
    catch (error) {
        res.status(500).json({ erro: 'Falha ao buscar mercados.', detalhe: String(error) });
    }
});
// POST /api/auth/login (Autenticação do Administrador no SQLite)
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ sucesso: false, erro: 'Usuário e senha são obrigatórios.' });
            return;
        }
        const usuario = banco.autenticarUsuario(username, password);
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
    }
    catch (error) {
        res.status(500).json({ sucesso: false, erro: 'Falha interna ao autenticar.', detalhe: String(error) });
    }
});
// PUT /api/mercados/:id (Edita a descrição/nome do estabelecimento no SQLite)
app.put('/api/mercados/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao } = req.body;
        const novoNome = (nome || descricao);
        if (!novoNome || !novoNome.trim()) {
            res.status(400).json({ sucesso: false, erro: 'A nova descrição do estabelecimento é obrigatória.' });
            return;
        }
        const atualizado = banco.atualizarDescricaoMercado(id, novoNome);
        if (!atualizado) {
            res.status(404).json({ sucesso: false, erro: 'Estabelecimento não encontrado.' });
            return;
        }
        res.json({
            sucesso: true,
            mensagem: 'Descrição do estabelecimento atualizada com sucesso.',
        });
    }
    catch (error) {
        res.status(500).json({ sucesso: false, erro: 'Erro ao atualizar estabelecimento.', detalhe: String(error) });
    }
});
// DELETE /api/mercados/:id (Exclui ofertas e o estabelecimento, mantendo intactos os produtos cadastrados)
app.delete('/api/mercados/:id', (req, res) => {
    try {
        const { id } = req.params;
        const resultado = banco.excluirMercado(id);
        if (!resultado.sucesso) {
            res.status(404).json({ sucesso: false, erro: 'Estabelecimento não encontrado para exclusão.' });
            return;
        }
        res.json({
            sucesso: true,
            mensagem: 'Estabelecimento e ofertas excluídos com sucesso. Catálogo de produtos preservado.',
            ofertasExcluidas: resultado.ofertasExcluidas,
        });
    }
    catch (error) {
        res.status(500).json({ sucesso: false, erro: 'Erro ao excluir estabelecimento.', detalhe: String(error) });
    }
});
// GET /api/urls-configuradas (Retorna os mercados do SQLite que possuem link de encarte/promoção)
app.get('/api/urls-configuradas', (_req, res) => {
    try {
        const mercadosComUrl = banco.getMercadosComUrl();
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
    }
    catch (error) {
        res.status(500).json({ erro: 'Falha ao buscar mercados com URL.', detalhe: String(error) });
    }
});
// GET /api/precos (Consulta produtos e preços monitorados no SQLite com filtro)
app.get('/api/precos', async (req, res) => {
    try {
        const termo = req.query['termo'];
        const regiaoId = req.query['regiaoId'];
        const categoria = req.query['categoria'];
        const produtos = await buscarPrecosUseCase.execute({ termo, regiaoId, categoria });
        res.json({
            total: produtos.length,
            dados: produtos,
        });
    }
    catch (error) {
        res.status(500).json({ erro: 'Falha ao buscar preços monitorados.', detalhe: String(error) });
    }
});
// POST /api/coleta/url (Raspa diretamente uma URL fornecida pelo usuário via Playwright e salva no SQLite)
app.post('/api/coleta/url', async (req, res) => {
    try {
        const { url, mercadoId, nomeMercado, regiao } = req.body;
        if (!url || typeof url !== 'string' || !url.startsWith('http')) {
            res.status(400).json({ erro: 'URL inválida. Forneça uma URL iniciando com http:// ou https://' });
            return;
        }
        const regiaoSolicitada = regiao || 'auto';
        console.log(`🚀 [Endpoint /api/coleta/url] Raspando URL com Playwright: ${url} (Região: ${regiaoSolicitada})`);
        const ofertasExtraidas = await scraperService.rasparUrlEspecifica(url, mercadoId || 'custom-market', nomeMercado || 'Supermercado Online', regiaoSolicitada);
        if (ofertasExtraidas.length > 0) {
            await banco.salvarOfertas(ofertasExtraidas);
        }
        const regiaoResolvida = ofertasExtraidas[0]?.regiao || (regiaoSolicitada !== 'auto' ? regiaoSolicitada : 'Centro');
        res.json({
            mensagem: `${ofertasExtraidas.length} produtos/ofertas extraídos com sucesso da URL e salvos no SQLite. Região: "${regiaoResolvida}".`,
            url,
            regiao: regiaoResolvida,
            totalExtraido: ofertasExtraidas.length,
            dados: ofertasExtraidas,
        });
    }
    catch (error) {
        console.error('Erro na rota /api/coleta/url:', error);
        res.status(500).json({ erro: 'Falha ao raspar a URL fornecida.', detalhe: String(error) });
    }
});
// POST /api/coleta/manual (Dispara raspagem imediata de todos os mercados com flyer_url salvos no SQLite)
app.post('/api/coleta/manual', async (_req, res) => {
    try {
        const resultado = await agendador.executarColetaManual();
        res.json({
            mensagem: 'Coleta geral executada via Playwright com sucesso e persistida no SQLite!',
            resultado,
        });
    }
    catch (error) {
        res.status(500).json({ erro: 'Falha ao executar coleta manual.', detalhe: String(error) });
    }
});
// POST /api/limpar-dados (Limpa mercados, produtos e ofertas para testes limpos)
app.post('/api/limpar-dados', (_req, res) => {
    try {
        banco.limparTodosOsDados();
        res.json({ mensagem: 'Todos os mercados, produtos e ofertas foram apagados com sucesso!' });
    }
    catch (error) {
        res.status(500).json({ erro: 'Falha ao limpar dados.', detalhe: String(error) });
    }
});
// ========================================================
// ENDPOINTS DO PASSO 2 (Conforme Guia Passo a Passo do DOCX)
// ========================================================
// 1. Rota de Teste para o Modal (não grava na base de dados)
app.post('/api/scraper/test', async (req, res) => {
    try {
        const previewOffers = await scraper_service_1.ScraperService.testScrape(req.body);
        return res.json({ success: true, offers: previewOffers });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});
// 2. Rota para Confirmar e Persistir no SQLite
app.post('/api/scraper/save', (req, res) => {
    try {
        let { marketId, categoryId, offers, catalogUrl, patternId } = req.body;
        if ((!marketId || marketId === '__novo__') && catalogUrl) {
            const lowerUrl = catalogUrl.toLowerCase();
            if (lowerUrl.includes('davo'))
                marketId = 'davo-alto-ipiranga';
            else if (lowerUrl.includes('shibata'))
                marketId = 'shibata-mogilar';
            else if (lowerUrl.includes('semar'))
                marketId = 'semar-centro';
            else if (lowerUrl.includes('alabarce'))
                marketId = 'alabarce-vila-oliveira';
            else if (lowerUrl.includes('assai'))
                marketId = 'assai-braz-cubas';
            else {
                try {
                    const host = new URL(catalogUrl).hostname.replace('www.', '').split('.')[0];
                    marketId = `mkt-${host}`;
                }
                catch {
                    marketId = 'mkt-personalizado';
                }
            }
        }
        if (!marketId || !offers || !Array.isArray(offers)) {
            res.status(400).json({ success: false, error: 'Parâmetros inválidos. marketId e offers são obrigatórios.' });
            return;
        }
        banco.salvarOfertasRegraScraper(marketId, categoryId || undefined, offers, catalogUrl, patternId);
        return res.json({ success: true, message: 'Ofertas guardadas com sucesso no SQLite!' });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});
// 3. Rota para Listar Padrões de Scraping Gravados no Banco
app.get('/api/scraper/patterns', (_req, res) => {
    try {
        const patterns = banco.getScraperPatterns();
        return res.json({ sucesso: true, success: true, dados: patterns, patterns });
    }
    catch (error) {
        return res.status(500).json({ sucesso: false, success: false, erro: error.message, error: error.message });
    }
});
// 4. Rota para Salvar / Atualizar Padrão de Scraping e Vincular ao Estabelecimento
app.post('/api/scraper/patterns', (req, res) => {
    try {
        const { name, cardContainer, productName, currentPrice } = req.body;
        if (!name || !cardContainer || !productName || !currentPrice) {
            res.status(400).json({ sucesso: false, success: false, erro: 'Campos obrigatórios do padrão ausentes (name, cardContainer, productName, currentPrice).' });
            return;
        }
        const result = banco.salvarOuAtualizarPadraoScraper(req.body);
        return res.json({ sucesso: true, ...result, message: 'Padrão salvo com sucesso!' });
    }
    catch (error) {
        return res.status(500).json({ sucesso: false, success: false, erro: error.message, error: error.message });
    }
});
// 5. Rota para Excluir Padrão de Scraping Gravado no SQLite
app.delete('/api/scraper/patterns/:id', (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ sucesso: false, success: false, erro: 'ID do padrão não informado.' });
            return;
        }
        const result = banco.excluirPadraoScraper(id);
        if (!result.sucesso) {
            res.status(404).json({ sucesso: false, success: false, erro: result.erro || 'Padrão não encontrado.' });
            return;
        }
        return res.json({ sucesso: true, success: true, message: 'Padrão excluído com sucesso!' });
    }
    catch (error) {
        return res.status(500).json({ sucesso: false, success: false, erro: error.message });
    }
});
// Inicialização
async function bootstrap() {
    await banco.inicializar();
    // Inicia agendamento automático diário (06:00 e 18:00)
    agendador.iniciarAgendamento();
    app.listen(PORT, () => {
        console.log(`🚀 [PriceTrack API] Servidor rodando em http://localhost:${PORT}`);
        console.log(`🗄️ [SQLite Database] Banco SQLite pronto com suporte a Regiões, Mercados e Ofertas.`);
        console.log(`📌 POST /api/scraper/test (Passo 2 do Guia)`);
        console.log(`📌 POST /api/scraper/save (Passo 2 do Guia)`);
    });
    // Listener secundário na porta 3000 caso requisições façam chamada direta para :3000
    if (Number(PORT) !== 3000) {
        try {
            const server3000 = app.listen(3000, () => {
                console.log(`🚀 [PriceTrack API] Alias ativo na porta http://localhost:3000`);
            });
            server3000.on('error', () => { });
        }
        catch { }
    }
}
bootstrap().catch((err) => {
    console.error('Erro fatal ao iniciar servidor:', err);
});
