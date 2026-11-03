# 🛒 Preço Certo (`projectprecocerto`)

> Plataforma inteligente para busca, comparação e monitoramento automatizado de preços de supermercados por região geográfica.

O projeto é estruturado em arquitetura integrada (**Frontend Angular 22** e **Backend Node.js TypeScript**), seguindo rigorosamente os padrões de **Domain-Driven Design (DDD)**, **Clean Architecture** e os princípios **SOLID** e **Clean Code**.

---

## 🏛️ Estrutura Geral do Projeto

```text
/
├── backend/                          # Backend Node.js + TypeScript (Scraping, Cron & Banco .ts)
│   ├── src/
│   │   ├── domain/                   # Entidades e contratos (IScraperService, Produto, Oferta)
│   │   │   ├── entities.ts
│   │   │   └── scraper.interface.ts
│   │   ├── application/              # Casos de uso e agendador cron
│   │   │   ├── agendador.cron.ts     # Rotina node-cron (06:00 e 18:00) e disparo manual
│   │   │   └── buscar-precos.usecase.ts
│   │   ├── infra/
│   │   │   ├── db/
│   │   │   │   └── banco.ts          # Banco em memória nativo persistido em arquivo .ts via fs/promises
│   │   │   └── scrapers/
│   │   │       └── scraper.ts        # Scraper automatizado preparado com Playwright / Mock
│   │   └── server.ts                 # API Express (GET /api/precos, POST /api/coleta/manual)
│   ├── data/
│   │   └── dados.ts                  # Arquivo TypeScript de persistência nativa gerado automaticamente
│   ├── package.json
│   └── tsconfig.json
│
└── src/app/                          # Frontend Angular 22 (DDD + Signals + Tailwind CSS v4)
    ├── core/                         # Núcleo compartilhado (Base Entity, ValueObject, Result monad)
    ├── domain/                       # Regras de Negócio Puras
    │   ├── market/                   # Entidade Market, MarketOffer, MarketAddress
    │   ├── product/                  # Entidade Product, PriceOffer, Value Object Price
    │   └── region/                   # Entidade Region, Value Object Coordinates (Haversine)
    ├── application/                  # Casos de Uso (SRP)
    │   ├── market/
    │   │   └── use-cases/
    │   │       ├── get-establishments.usecase.ts # Filtros, categorias e ordenação de estabelecimentos
    │   │       └── quick-compare.usecase.ts      # Comparador rápido em tempo real
    │   ├── product/
    │   └── region/
    ├── infrastructure/               # Mappers, Repositórios In-Memory/HTTP, Adapters GPS e DI Tokens
    └── presentation/                 # Camada de Apresentação
        ├── state/                    # RegionStateService (Signals)
        ├── components/
        │   ├── establishment-card/   # Card do estabelecimento com top 5 ofertas e rotas
        │   ├── quick-comparator/     # Box de comparador rápido de produtos
        │   ├── store-flyer-modal/    # Modal de encarte completo do supermercado
        │   ├── product-card/         # Card de produto com menor preço da região
        │   └── navbar/ / footer/
        └── pages/
            └── home/                 # Página inicial com 2 abas integradas:
                                      # 1) Estabelecimentos & Melhores Ofertas (Novo modelo visual)
                                      # 2) Produtos & Ofertas (Visão de produtos original intacta)
```

---

## 📱 Organização das Abas na Página Inicial

Conforme solicitado, a interface foi dividida em duas abas dedicadas:

1. **Aba "Estabelecimentos & Melhores Ofertas"**:
   - Layout fiel ao wireframe/modelo visual em anexo.
   - **Hero Promocional** com chips de categorias (`Todas as Ofertas`, `Carnes & Aves`, `Hortifrúti`, `Mercearia`, `Bebidas`, `Laticínios`, `Limpeza & Casa`).
   - **Box Comparador Rápido de Preço**: permite digitar ou clicar em sugestões (*Café 500g, Arroz 5kg, Picanha kg*) e comparar em tempo real os preços em todos os estabelecimentos com destaque para o mais barato.
   - **Cards de Estabelecimentos** (`<app-establishment-card>`): alimentados com dados completos da loja (logo, nota, avaliações, distância, endereço, horário) e suas **Top 5 Melhores Ofertas** com tags promocionais e percentual de desconto.
   - **Ações**: Botão de rota no Google Maps e botão para abrir o **Modal de Encarte Completo** (`<app-store-flyer-modal>`).

2. **Aba "Produtos & Ofertas"**:
   - Mantém 100% da funcionalidade e visual anterior sem alteração:
   - Busca em tempo real por produtos de mercearia.
   - Filtros de categorias e ordenação por Menor Preço, Maior Economia e Nome.
   - Grid de cards de produtos (`<app-product-card>`) com cálculo de economia máxima.

---

## ⚙️ Backend (Node.js + TypeScript + Banco .ts)

O backend atende integralmente aos requisitos do documento:
1. **Banco de Dados Nativo .ts (`backend/src/infra/db/banco.ts`)**:
   - Armazenamento em memória com persistência em arquivo nativo `backend/data/dados.ts` utilizando `fs/promises` sem necessidade de SQLite, PostgreSQL ou MongoDB.
2. **Serviço de Scraping (`backend/src/infra/scrapers/scraper.ts`)**:
   - Implementa o contrato `IScraperService` preparado para Playwright com simulações completas de encartes e e-commerces.
3. **Agendamento Cron (`backend/src/application/agendador.cron.ts`)**:
   - Configurado via `node-cron` para rodar automaticamente **2x ao dia (06:00 e 18:00)**, com método para disparo imediato.
4. **Endpoints REST da API (`backend/src/server.ts`)**:
   - `GET /api/precos?termo=...` : Consulta produtos e preços monitorados com filtro por termo.
   - `GET /api/mercados` : Lista estabelecimentos cadastrados.
   - `POST /api/coleta/manual` : Dispara a rotina imediata de coleta/scraping.
   - `GET /api/health` : Verifica o status da API.

---

## 🚀 Como Executar

### 1. Frontend (Angular 22)
```bash
# Na raiz do projeto:
npm start
```
Acesse no navegador: **`http://localhost:4200`**

### 2. Backend (Node.js API)
```bash
# Na raiz do projeto:
npm run start:backend
# ou em modo desenvolvimento:
npm run dev:backend
```
Servidor ativo em: **`http://localhost:3001`**

### 3. Testes Unitários (Vitest)
```bash
npm test
```
