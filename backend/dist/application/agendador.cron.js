"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgendadorColeta = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const banco_1 = require("../infra/db/banco");
/**
 * Agendador de Coleta Automática (Cron Job).
 * Configurado para rodar 2x ao dia (às 06:00 e às 18:00),
 * além de permitir disparo manual sob demanda.
 */
class AgendadorColeta {
    banco;
    scrapers;
    constructor(scrapers) {
        this.banco = banco_1.BancoDadosTs.getInstance();
        this.scrapers = scrapers;
    }
    iniciarAgendamento() {
        // Cron expressando 06:00 e 18:00 todos os dias: '0 6,18 * * *'
        node_cron_1.default.schedule('0 6,18 * * *', async () => {
            console.log('⏰ [Cron] Disparando coleta agendada de preços (06:00 / 18:00)...');
            await this.executarColetaGeral();
        });
        console.log('✅ [Cron] Agendamento de coleta ativado para as 06:00 e 18:00 diariamente.');
    }
    async executarColetaManual() {
        console.log('🚀 [Manual] Disparando coleta imediata de ofertas...');
        return this.executarColetaGeral();
    }
    async executarColetaGeral() {
        const todasOfertas = [];
        for (const scraper of this.scrapers) {
            try {
                console.log(`🔍 Executando scraper: ${scraper.nome}...`);
                const ofertas = await scraper.executarColeta();
                todasOfertas.push(...ofertas);
            }
            catch (err) {
                console.error(`Erro ao executar scraper ${scraper.nome}:`, err);
            }
        }
        await this.banco.salvarOfertas(todasOfertas);
        console.log(`💾 ${todasOfertas.length} ofertas salvas no banco SQLite com sucesso.`);
        return {
            totalColetado: todasOfertas.length,
            timestamp: new Date().toISOString(),
        };
    }
}
exports.AgendadorColeta = AgendadorColeta;
