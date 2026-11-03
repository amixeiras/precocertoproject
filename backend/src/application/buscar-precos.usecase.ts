import { BancoDadosTs } from '../infra/db/banco';
import { ProdutoMonitorado } from '../domain/entities';

export interface BuscarPrecosQuery {
  termo?: string;
  regiaoId?: string;
  categoria?: string;
}

/**
 * Caso de Uso: Buscar Preços e Produtos Monitorados com Filtros.
 */
export class BuscarPrecosUseCase {
  private readonly banco: BancoDadosTs;

  constructor() {
    this.banco = BancoDadosTs.getInstance();
  }

  public async execute(query: BuscarPrecosQuery): Promise<ProdutoMonitorado[]> {
    return this.banco.getProdutos(query.termo, query.regiaoId, query.categoria);
  }
}

