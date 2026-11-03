import { SupermercadoScraperService } from './infra/scrapers/scraper';
import { BancoDadosTs } from './infra/db/banco';

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.log('Uso: npm run scrape -- "<URL_DO_SUPERMERCADO>" [NOME_DO_MERCADO] [REGIAO]');
    console.log('Exemplo: npm run scrape -- "https://www.shibata.com.br/ofertas" "Shibata" "Mogilar"');
    process.exit(1);
  }

  const nomeMercado = process.argv[3] || 'Supermercado Teste';
  const regiao = process.argv[4] || 'Centro';

  console.log(`🚀 Iniciando raspagem via Playwright para: ${url} (Região: ${regiao})...`);
  const scraper = new SupermercadoScraperService();
  const banco = BancoDadosTs.getInstance();
  await banco.inicializar();

  const ofertas = await scraper.rasparUrlEspecifica(url, 'custom-cli', nomeMercado, regiao);

  console.log(`\n✅ Raspagem concluída! ${ofertas.length} ofertas encontradas para a Região ${regiao}.`);
  if (ofertas.length > 0) {
    await banco.salvarOfertas(ofertas);
    console.log('💾 Ofertas salvas com sucesso no banco SQLite!');
    console.log('\nExemplo de itens coletados:');
    ofertas.slice(0, 5).forEach((o, i) => {
      console.log(`  ${i + 1}. [${o.regiao}] ${o.nomeProduto} - R$ ${o.preco} (${o.descontoPercentual}% desc)`);
    });
  }
}

main().catch((err) => {
  console.error('Erro na execução da raspagem:', err);
  process.exit(1);
});
