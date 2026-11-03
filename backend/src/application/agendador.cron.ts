import cron from 'node-cron';
import { IScraperService } from '../domain/scraper.interface';
import { BancoDadosTs } from '../infra/db/banco';

/**
 * Agendador de Coleta Automática (Cron Job).
 * Configurado para rodar 2x ao dia (às 06:00 e às 18:00),
 * além de permitir disparo manual sob demanda.
 */
export class AgendadorColeta {
  private readonly banco: BancoDadosTs;
  private readonly scrapers: IScraperService[];

  constructor(scrapers: IScraperService[]) {
    this.banco = BancoDadosTs.getInstance();
    this.scrapers = scrapers;
  }

  public iniciarAgendamento(): void {
    // Cron expressando 06:00 e 18:00 todos os dias: '0 6,18 * * *'
    cron.schedule('0 6,18 * * *', async () => {
      console.log('⏰ [Cron] Disparando coleta agendada de preços (06:00 / 18:00)...');
      await this.executarColetaGeral();
    });

    console.log('✅ [Cron] Agendamento de coleta ativado para as 06:00 e 18:00 diariamente.');
  }

  public async executarColetaManual(): Promise<{ totalColetado: number; timestamp: string }> {
    console.log('🚀 [Manual] Disparando coleta imediata de ofertas...');
    return this.executarColetaGeral();
  }

  private async executarColetaGeral(): Promise<{ totalColetado: number; timestamp: string }> {
    const todasOfertas = [];

    for (const scraper of this.scrapers) {
      try {
        console.log(`🔍 Executando scraper: ${scraper.nome}...`);
        const ofertas = await scraper.executarColeta();
        todasOfertas.push(...ofertas);
      } catch (err) {
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

