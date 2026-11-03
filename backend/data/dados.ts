/**
 * ARQUIVO GERADO AUTOMATICAMENTE PELO BANCO DE DADOS .TS
 * Data de persistência: 2026-10-11T09:00:31.473Z
 */
export const bancoDados = {
  "ultimaAtualizacao": "2026-10-11T09:00:31.473Z",
  "totalColetas": 3,
  "mercados": [
    {
      "id": "alabarce",
      "nome": "Alabarce Supermercados",
      "rede": "Alabarce",
      "regiao": "Vila Oliveira",
      "endereco": "R. Dr. Deodato Wertheimer, 222 - Vila Oliveira",
      "avaliacao": 4.8
    },
    {
      "id": "shibata",
      "nome": "Shibata Supermercados",
      "rede": "Shibata",
      "regiao": "Mogilar",
      "endereco": "R. Manuel de Oliveira, 400 - Mogilar",
      "avaliacao": 4.6
    },
    {
      "id": "davo",
      "nome": "D'avó Hipermercados",
      "rede": "D'avó",
      "regiao": "Alto Ipiranga",
      "endereco": "Av. Henrique Eroles, 1250 - Alto Ipiranga",
      "avaliacao": 4.5
    },
    {
      "id": "assai",
      "nome": "Assaí Atacadista",
      "rede": "Assaí",
      "regiao": "Braz Cubas",
      "endereco": "Rod. Henrique Eroles, 3500 - Braz Cubas",
      "avaliacao": 4.4
    }
  ],
  "produtos": [
    {
      "id": "prod-picanha-kg",
      "nome": "Picanha Bovina Maturatta kg",
      "categoria": "carnes",
      "unidade": "kg",
      "melhorPreco": 64.9,
      "mercadoMaisBarato": "Alabarce Supermercados",
      "ofertas": [
        {
          "id": "contingencia-1-1791709231473",
          "produtoId": "prod-picanha-kg",
          "nomeProduto": "Picanha Bovina Maturatta kg",
          "categoria": "carnes",
          "mercadoId": "alabarce",
          "nomeMercado": "Alabarce Supermercados",
          "regiao": "Vila Oliveira",
          "preco": 64.9,
          "precoAnterior": 89.9,
          "unidade": "kg",
          "descontoPercentual": 28,
          "validaAte": "15/10",
          "coletadoEm": "2026-10-11T09:00:31.473Z"
        }
      ]
    },
    {
      "id": "prod-arroz-5kg",
      "nome": "Arroz Tipo 1 Camil 5kg",
      "categoria": "mercearia",
      "unidade": "pct",
      "melhorPreco": 25.89,
      "mercadoMaisBarato": "Shibata Supermercados",
      "ofertas": [
        {
          "id": "contingencia-2-1791709231473",
          "produtoId": "prod-arroz-5kg",
          "nomeProduto": "Arroz Tipo 1 Camil 5kg",
          "categoria": "mercearia",
          "mercadoId": "shibata",
          "nomeMercado": "Shibata Supermercados",
          "regiao": "Mogilar",
          "preco": 25.89,
          "precoAnterior": 32.9,
          "unidade": "pct",
          "descontoPercentual": 21,
          "validaAte": "14/10",
          "coletadoEm": "2026-10-11T09:00:31.473Z"
        }
      ]
    },
    {
      "id": "prod-leite-1l",
      "nome": "Leite Integral Piracanjuba 1L",
      "categoria": "laticinios",
      "unidade": "un",
      "melhorPreco": 4.19,
      "mercadoMaisBarato": "Shibata Supermercados",
      "ofertas": [
        {
          "id": "contingencia-3-1791709231473",
          "produtoId": "prod-leite-1l",
          "nomeProduto": "Leite Integral Piracanjuba 1L",
          "categoria": "laticinios",
          "mercadoId": "shibata",
          "nomeMercado": "Shibata Supermercados",
          "regiao": "Mogilar",
          "preco": 4.19,
          "precoAnterior": 5.6,
          "unidade": "un",
          "descontoPercentual": 25,
          "validaAte": "12/10",
          "coletadoEm": "2026-10-11T09:00:31.473Z"
        }
      ]
    }
  ],
  "historicoOfertas": [
    {
      "id": "sc-ala-1-1791703236663",
      "produtoId": "prod-picanha-kg",
      "nomeProduto": "Picanha Bovina Maturatta kg",
      "categoria": "carnes",
      "mercadoId": "alabarce",
      "nomeMercado": "Alabarce Supermercados",
      "preco": 64.9,
      "precoAnterior": 89.9,
      "unidade": "kg",
      "descontoPercentual": 28,
      "validaAte": "15/10",
      "coletadoEm": "2026-10-11T07:20:36.663Z"
    },
    {
      "id": "sc-shb-1-1791703236663",
      "produtoId": "prod-arroz-5kg",
      "nomeProduto": "Arroz Tipo 1 Camil 5kg",
      "categoria": "mercearia",
      "mercadoId": "shibata",
      "nomeMercado": "Shibata Supermercados",
      "preco": 25.89,
      "precoAnterior": 32.9,
      "unidade": "pct",
      "descontoPercentual": 21,
      "validaAte": "14/10",
      "coletadoEm": "2026-10-11T07:20:36.663Z"
    },
    {
      "id": "sc-dav-1-1791703236663",
      "produtoId": "prod-cafe-500g",
      "nomeProduto": "Café Tradicional Pilão 500g",
      "categoria": "mercearia",
      "mercadoId": "davo",
      "nomeMercado": "D'avó Hipermercados",
      "preco": 16.9,
      "precoAnterior": 22.9,
      "unidade": "un",
      "descontoPercentual": 26,
      "validaAte": "14/10",
      "coletadoEm": "2026-10-11T07:20:36.663Z"
    },
    {
      "id": "sc-ass-1-1791703236663",
      "produtoId": "prod-arroz-5kg",
      "nomeProduto": "Arroz Tipo 1 Camil 5kg",
      "categoria": "mercearia",
      "mercadoId": "assai",
      "nomeMercado": "Assaí Atacadista",
      "preco": 24.9,
      "precoAnterior": 31.9,
      "unidade": "pct",
      "descontoPercentual": 22,
      "validaAte": "16/10",
      "coletadoEm": "2026-10-11T07:20:36.663Z"
    },
    {
      "id": "sc-shb-2-1791703236663",
      "produtoId": "prod-leite-1l",
      "nomeProduto": "Leite Integral Piracanjuba 1L",
      "categoria": "laticinios",
      "mercadoId": "shibata",
      "nomeMercado": "Shibata Supermercados",
      "preco": 4.19,
      "precoAnterior": 5.6,
      "unidade": "un",
      "descontoPercentual": 25,
      "validaAte": "12/10",
      "coletadoEm": "2026-10-11T07:20:36.663Z"
    },
    {
      "id": "sc-ala-2-1791703236663",
      "produtoId": "prod-azeite-500ml",
      "nomeProduto": "Azeite de Oliva Extra Virgem Gallo 500ml",
      "categoria": "mercearia",
      "mercadoId": "alabarce",
      "nomeMercado": "Alabarce Supermercados",
      "preco": 36.8,
      "precoAnterior": 46.9,
      "unidade": "un",
      "descontoPercentual": 21,
      "validaAte": "16/10",
      "coletadoEm": "2026-10-11T07:20:36.663Z"
    },
    {
      "id": "sc-dav-2-1791703236663",
      "produtoId": "prod-frango-1kg",
      "nomeProduto": "Filé de Peito de Frango Sadia 1kg",
      "categoria": "carnes",
      "mercadoId": "davo",
      "nomeMercado": "D'avó Hipermercados",
      "preco": 17.9,
      "precoAnterior": 24.9,
      "unidade": "pct",
      "descontoPercentual": 28,
      "validaAte": "15/10",
      "coletadoEm": "2026-10-11T07:20:36.663Z"
    },
    {
      "id": "contingencia-1-1791709231473",
      "produtoId": "prod-picanha-kg",
      "nomeProduto": "Picanha Bovina Maturatta kg",
      "categoria": "carnes",
      "mercadoId": "alabarce",
      "nomeMercado": "Alabarce Supermercados",
      "regiao": "Vila Oliveira",
      "preco": 64.9,
      "precoAnterior": 89.9,
      "unidade": "kg",
      "descontoPercentual": 28,
      "validaAte": "15/10",
      "coletadoEm": "2026-10-11T09:00:31.473Z"
    },
    {
      "id": "contingencia-2-1791709231473",
      "produtoId": "prod-arroz-5kg",
      "nomeProduto": "Arroz Tipo 1 Camil 5kg",
      "categoria": "mercearia",
      "mercadoId": "shibata",
      "nomeMercado": "Shibata Supermercados",
      "regiao": "Mogilar",
      "preco": 25.89,
      "precoAnterior": 32.9,
      "unidade": "pct",
      "descontoPercentual": 21,
      "validaAte": "14/10",
      "coletadoEm": "2026-10-11T09:00:31.473Z"
    },
    {
      "id": "contingencia-3-1791709231473",
      "produtoId": "prod-leite-1l",
      "nomeProduto": "Leite Integral Piracanjuba 1L",
      "categoria": "laticinios",
      "mercadoId": "shibata",
      "nomeMercado": "Shibata Supermercados",
      "regiao": "Mogilar",
      "preco": 4.19,
      "precoAnterior": 5.6,
      "unidade": "un",
      "descontoPercentual": 25,
      "validaAte": "12/10",
      "coletadoEm": "2026-10-11T09:00:31.473Z"
    }
  ]
};
