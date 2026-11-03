"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuscarPrecosUseCase = void 0;
const banco_1 = require("../infra/db/banco");
/**
 * Caso de Uso: Buscar Preços e Produtos Monitorados com Filtros.
 */
class BuscarPrecosUseCase {
    banco;
    constructor() {
        this.banco = banco_1.BancoDadosTs.getInstance();
    }
    async execute(query) {
        return this.banco.getProdutos(query.termo, query.regiaoId, query.categoria);
    }
}
exports.BuscarPrecosUseCase = BuscarPrecosUseCase;
