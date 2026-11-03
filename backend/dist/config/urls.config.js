"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLS_CONFIGURADAS = void 0;
/**
 * Lista de URLs de Supermercados configuradas para raspagem automatizada.
 * Cada URL está associada a uma Região geográfica específica.
 */
exports.URLS_CONFIGURADAS = [
    {
        id: 'alvo-shibata',
        nomeMercado: 'Shibata Supermercados',
        mercadoId: 'shibata',
        regiao: 'Mogilar',
        url: 'https://www.shibata.com.br/ofertas',
        categoriaPadrao: 'mercearia',
    },
    {
        id: 'alvo-alabarce',
        nomeMercado: 'Alabarce Supermercados',
        mercadoId: 'alabarce',
        regiao: 'Vila Oliveira',
        url: 'https://www.alabarce.com.br/promocoes',
        categoriaPadrao: 'carnes',
    },
    {
        id: 'alvo-davo',
        nomeMercado: "D'avó Hipermercados",
        mercadoId: 'davo',
        regiao: 'Alto Ipiranga',
        url: 'https://www.davo.com.br/ofertas',
        categoriaPadrao: 'mercearia',
    },
    {
        id: 'alvo-assai',
        nomeMercado: 'Assaí Atacadista',
        mercadoId: 'assai',
        regiao: 'Braz Cubas',
        url: 'https://www.assai.com.br/ofertas',
        categoriaPadrao: 'mercearia',
    },
];
