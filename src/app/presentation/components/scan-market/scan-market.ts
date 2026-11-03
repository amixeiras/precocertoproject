import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface ScrapedOffer {
  name: string;
  currentPrice: number;
  originalPrice?: number;
  discountPercentage: number;
  unit: string;
  imageUrl?: string;
  category?: string;
  categoryName?: string;
}

export interface ScraperPattern {
  id: string;
  name: string;
  cardContainer: string;
  productName: string;
  currentPrice: string;
  originalPrice?: string;
  discountTag?: string;
  unit?: string;
  imageSelector?: string;
  catalogUrl?: string;
  marketId?: string;
  marketName?: string;
  scraperPatternsId?: string;
  patternId?: string;
}

export interface MarketOption {
  id: string;
  nome: string;
  regiao?: string;
}

/**
 * Interface Angular com Gerenciador de Padrões Reutilizáveis,
 * Seletores Playwright, Seletor de Imagem e Popup com Categorização Automática de Todos os Produtos.
 */
@Component({
  selector: 'app-scan-market',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Container Principal do Formulário -->
    <div class="max-w-4xl mx-auto p-6 bg-white rounded-3xl border border-slate-200 shadow-sm mt-4">
      <div class="border-b border-slate-100 pb-4 mb-6 flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-2xl">🤖</span>
            <h2 class="text-2xl font-black text-slate-800 tracking-tight">Escanear Estabelecimento & Ofertas</h2>
          </div>
          <p class="text-sm text-slate-500 mt-1">
            Selecione ou crie um padrão de seletores CSS gravados no SQLite para extrair produtos, imagens e categorias via Playwright.
          </p>
        </div>
        @if (canClose()) {
          <button 
            type="button" 
            (click)="onCloseForm()"
            class="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer p-1 leading-none transition"
            title="Fechar"
          >
            &times;
          </button>
        }
      </div>

      <form [formGroup]="scanForm" class="space-y-5">
        <!-- SELEÇÃO DE PADRÃO GRAVADO (COMBO) -->
        <div class="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex-1">
            <label class="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">
              📋 Padrão de Extração Gravado no Banco (Reutilizável)
            </label>
            <select 
              [value]="selectedPatternId()" 
              (change)="onPatternChange($event)"
              class="w-full bg-white border border-indigo-200 text-slate-800 rounded-xl p-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
            >
              @for (pat of patterns(); track pat.id) {
                <option [value]="pat.id">{{ pat.name }}</option>
              }
              <option value="__novo__">➕ Criar / Personalizar Novo Padrão...</option>
            </select>
          </div>

          <div class="flex items-end gap-2 flex-wrap sm:flex-nowrap">
            @if (selectedPatternId() !== '__novo__') {
              <button 
                type="button" 
                (click)="excluirPadraoAtual()"
                [disabled]="deletingPattern() || savingPattern()"
                class="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                title="Excluir este padrão do banco de dados"
              >
                @if (deletingPattern()) {
                  <span class="w-3.5 h-3.5 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin"></span>
                  <span>Excluindo...</span>
                } @else {
                  <span>🗑️ Excluir Padrão</span>
                }
              </button>
            }
            <button 
              type="button" 
              (click)="salvarPadraoAtual()"
              [disabled]="savingPattern() || deletingPattern()"
              class="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              @if (savingPattern()) {
                <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Gravando...</span>
              } @else {
                <span>💾 Salvar Padrão no Banco</span>
              }
            </button>
          </div>
        </div>

        <!-- Estabelecimento (somente visível para padrões existentes cadastrados) -->
        @if (selectedPatternId() !== '__novo__') {
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Supermercado / Estabelecimento</label>
            <select 
              formControlName="marketId" 
              class="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-indigo-600 bg-slate-50/50 cursor-pointer"
            >
              @for (m of markets(); track m.id) {
                <option [value]="m.id">{{ m.nome }} ({{ m.id }})</option>
              }
            </select>
          </div>
        }

        <!-- URL do Encarte (aparece SOMENTE quando for Novo Padrão) -->
        @if (selectedPatternId() === '__novo__') {
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">URL da Página de Ofertas / Catálogo</label>
            <input 
              formControlName="catalogUrl" 
              type="url" 
              placeholder="https://www.exemplo.com.br/ofertas" 
              class="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-indigo-600 bg-slate-50/50" 
            />
          </div>
        }

        <!-- Bloco de Padrões de Seletores CSS -->
        <div class="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-slate-600 uppercase tracking-wider block">
              🎯 Configuração de Seletores CSS (Playwright)
            </span>
            <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
              Captura Automática com Imagens & Categorias
            </span>
          </div>

          <!-- Container -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tag / Container do Card do Produto</label>
            <input 
              formControlName="cardContainer" 
              type="text" 
              placeholder="Ex: vip-produto-preco ou .product-item" 
              class="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-indigo-600 font-mono text-xs" 
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Nome -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Seletor: Nome do Produto</label>
              <input 
                formControlName="productName" 
                type="text" 
                placeholder="Ex: a[title], a[aria-label]" 
                class="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-indigo-600 font-mono text-xs" 
              />
            </div>

            <!-- Preço Atual -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Seletor: Preço Promocional (Atual)</label>
              <input 
                formControlName="currentPrice" 
                type="text" 
                placeholder="Ex: [data-cy='preco'] ou .price-now" 
                class="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-indigo-600 font-mono text-xs" 
              />
            </div>

            <!-- Preço Anterior -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Seletor: Preço Anterior / De (Riscado)</label>
              <input 
                formControlName="originalPrice" 
                type="text" 
                placeholder="Ex: [data-cy='preco-antigo']" 
                class="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-indigo-600 font-mono text-xs" 
              />
            </div>

            <!-- Tag de Desconto -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Seletor: Tag de Desconto (% OFF)</label>
              <input 
                formControlName="discountTag" 
                type="text" 
                placeholder="Ex: [data-cy='tag-oferta']" 
                class="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-indigo-600 font-mono text-xs" 
              />
            </div>

            <!-- Unidade de Medida -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Seletor: Unidade de Medida</label>
              <input 
                formControlName="unit" 
                type="text" 
                placeholder="Ex: [data-cy='unidade']" 
                class="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-indigo-600 font-mono text-xs" 
              />
            </div>

            <!-- Seletor de Imagem -->
            <div>
              <label class="block text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1">
                <span>🖼️ Seletor: Imagem do Produto</span>
                <span class="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-normal">Persiste URL</span>
              </label>
              <input 
                formControlName="imageSelector" 
                type="text" 
                placeholder="Ex: img, .vip-produto-imagem img, [data-cy='imagem']" 
                class="w-full border border-indigo-200 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-indigo-600 font-mono text-xs" 
              />
            </div>
          </div>
        </div>

        <!-- Botões de Ação do Formulário -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          @if (canClose()) {
            <button 
              type="button" 
              (click)="onCloseForm()" 
              class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-sm rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
          }
          <button 
            type="button" 
            (click)="testScraper()" 
            [disabled]="loading() || isInvalidForm()"
            class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-md shadow-slate-900/10"
          >
            @if (loading()) {
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Executando Playwright...</span>
            } @else {
              <span>🔍 Testar Padrão & Ver Ofertas</span>
            }
          </button>
        </div>
      </form>

      <!-- MODAL POPUP: Ofertas Identificadas com Imagens e Categorias -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="text-lg font-black text-slate-800 flex items-center gap-2">
                  <span>🎉 Teste Concluído</span>
                  <span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {{ previewOffers().length }} itens extraídos & categorizados
                  </span>
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  Confirme se os nomes, preços, categorias automáticas e imagens correspondem ao catálogo do supermercado.
                </p>
              </div>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">✕</button>
            </div>

            <!-- Lista de Ofertas com Miniaturas de Imagem e Categoria Individual -->
            <div class="py-4 space-y-3 overflow-y-auto flex-1">
              @for (item of previewOffers(); track $index) {
                <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <!-- Miniatura da Imagem Extraída -->
                    <div class="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                      @if (item.imageUrl) {
                        <img [src]="item.imageUrl" [alt]="item.name" class="w-full h-full object-contain p-1" />
                      } @else {
                        <span class="text-2xl text-slate-300">📦</span>
                      }
                    </div>

                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">#{{ $index + 1 }}</span>
                        @if (item.categoryName || item.category) {
                          <span class="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                            🏷️ {{ item.categoryName || item.category }}
                          </span>
                        }
                        <h4 class="text-sm font-bold text-slate-800 break-words leading-tight" [title]="item.name">
                          {{ item.name }}
                        </h4>
                      </div>
                      <p class="text-xs text-slate-400 mt-1">Unidade: {{ item.unit || 'un' }}</p>
                    </div>
                  </div>

                  <div class="text-right shrink-0">
                    <span class="text-base font-black text-emerald-600 block">R$ {{ item.currentPrice.toFixed(2) }}</span>
                    @if (item.originalPrice) {
                      <span class="text-xs text-slate-400 line-through block">R$ {{ item.originalPrice.toFixed(2) }}</span>
                      <span class="text-[10px] text-red-600 font-bold">-{{ item.discountPercentage }}%</span>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Ações do Modal -->
            <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button (click)="closeModal()" class="px-4 py-2.5 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-xl cursor-pointer">
                Revisar Seletores
              </button>
              <button 
                (click)="saveToDatabase()" 
                class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                <span>✅ Confirmar e Gravar no SQLite</span>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ScanMarketComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  public readonly canClose = input<boolean>(false);
  public readonly saved = output<void>();
  public readonly close = output<void>();

  loading = signal(false);
  savingPattern = signal(false);
  deletingPattern = signal(false);
  showModal = signal(false);
  previewOffers = signal<ScrapedOffer[]>([]);
  patterns = signal<ScraperPattern[]>([]);
  selectedPatternId = signal<string>('pat-vipcommerce');
  markets = signal<MarketOption[]>([]);

  scanForm = this.fb.group({
    patternName: ['VIP Commerce (D\'avó Supermercados)'],
    marketId: ['davo-alto-ipiranga'],
    catalogUrl: ['https://www.davo.com.br/ofertas'],
    cardContainer: ['vip-produto-preco', Validators.required],
    productName: ['a[title], a[aria-label]', Validators.required],
    currentPrice: ['[data-cy="preco"]', Validators.required],
    originalPrice: ['[data-cy="preco-antigo"]'],
    discountTag: ['[data-cy="tag-oferta"]'],
    unit: ['[data-cy="unidade"]'],
    imageSelector: ['img, .vip-produto-imagem img, [data-cy="imagem"]']
  });

  ngOnInit(): void {
    this.carregarPadroes();
    this.carregarMercados();
  }

  isInvalidForm(): boolean {
    const val = this.scanForm.value;
    if (this.selectedPatternId() === '__novo__') {
      if (!val.catalogUrl || !val.catalogUrl.trim()) return true;
    } else {
      const patUrl = this.patterns().find((p) => p.id === this.selectedPatternId())?.catalogUrl;
      if (!val.catalogUrl && !patUrl) return true;
    }
    return !val.cardContainer || !val.productName || !val.currentPrice;
  }

  carregarPadroes(): void {
    this.http.get<{ sucesso: boolean; dados: ScraperPattern[] }>('http://localhost:3001/api/scraper/patterns')
      .subscribe({
        next: (res) => {
          if (res.sucesso && res.dados) {
            this.patterns.set(res.dados);
            const currentSelected = this.selectedPatternId();
            const foundCurrent = res.dados.find((p) => p.id === currentSelected);

            if (foundCurrent) {
              this.selecionarPadrao(foundCurrent);
            } else if (res.dados.length > 0) {
              const initial = res.dados.find((p) => p.id === 'pat-vipcommerce' || p.id === 'pat-vip-commerce') || res.dados[0]!;
              this.selecionarPadrao(initial);
            } else {
              this.selectedPatternId.set('__novo__');
              this.scanForm.patchValue({
                patternName: 'Novo Padrão Personalizado',
                marketId: '',
                catalogUrl: '',
                cardContainer: '',
                productName: '',
                currentPrice: '',
                originalPrice: '',
                discountTag: '',
                unit: '',
                imageSelector: 'img'
              });
            }
          }
        },
        error: (err) => console.warn('Não foi possível carregar padrões do SQLite:', err)
      });
  }

  carregarMercados(): void {
    this.http.get<{ total: number; dados: any[] }>('http://localhost:3001/api/mercados')
      .subscribe({
        next: (res) => {
          if (res.dados && Array.isArray(res.dados)) {
            const list: MarketOption[] = res.dados.map((m) => ({
              id: m.id,
              nome: m.nome,
              regiao: m.regiao
            }));
            this.markets.set(list);
            const currentMarketId = this.scanForm.value.marketId;
            if (currentMarketId && !list.some((m) => m.id === currentMarketId)) {
              if (list.length > 0) {
                this.scanForm.patchValue({ marketId: list[0]!.id });
              }
            }
          }
        },
        error: (err) => console.warn('Erro ao carregar lista de estabelecimentos:', err)
      });
  }

  onPatternChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '__novo__') {
      this.selectedPatternId.set('__novo__');
      this.scanForm.patchValue({
        patternName: 'Novo Padrão Personalizado',
        marketId: '',
        catalogUrl: '',
        cardContainer: '',
        productName: '',
        currentPrice: '',
        originalPrice: '',
        discountTag: '',
        unit: '',
        imageSelector: 'img'
      });
      return;
    }

    const found = this.patterns().find((p) => p.id === val);
    if (found) {
      this.selecionarPadrao(found);
    }
  }

  selecionarPadrao(pat: ScraperPattern): void {
    this.selectedPatternId.set(pat.id);
    this.scanForm.patchValue({
      patternName: pat.name,
      cardContainer: pat.cardContainer,
      productName: pat.productName,
      currentPrice: pat.currentPrice,
      originalPrice: pat.originalPrice || '',
      discountTag: pat.discountTag || '',
      unit: pat.unit || '',
      imageSelector: pat.imageSelector || 'img, [data-cy="imagem"]',
      catalogUrl: pat.catalogUrl || 'https://www.davo.com.br/ofertas',
      marketId: pat.marketId || this.scanForm.value.marketId || 'davo-alto-ipiranga'
    });
  }

  salvarPadraoAtual(): void {
    const formVal = this.scanForm.value;
    const patId = this.selectedPatternId() === '__novo__' ? undefined : this.selectedPatternId();
    const nomePadrao = prompt('Nome para este Padrão de Scraping:', formVal.patternName || 'Padrão Personalizado');
    if (!nomePadrao) return;

    this.savingPattern.set(true);
    let marketId = formVal.marketId;
    if ((!marketId || this.selectedPatternId() === '__novo__') && formVal.catalogUrl) {
      const lower = formVal.catalogUrl.toLowerCase();
      if (lower.includes('davo')) marketId = 'davo-alto-ipiranga';
      else if (lower.includes('shibata')) marketId = 'shibata-mogilar';
      else if (lower.includes('semar')) marketId = 'semar-centro';
      else if (lower.includes('alabarce')) marketId = 'alabarce-vila-oliveira';
      else if (lower.includes('assai')) marketId = 'assai-braz-cubas';
    }

    const payload = {
      id: patId,
      name: nomePadrao,
      cardContainer: formVal.cardContainer,
      productName: formVal.productName,
      currentPrice: formVal.currentPrice,
      originalPrice: formVal.originalPrice,
      discountTag: formVal.discountTag,
      unit: formVal.unit,
      imageSelector: formVal.imageSelector,
      marketId: marketId || undefined,
      catalogUrl: formVal.catalogUrl || undefined
    };

    this.http.post<{ sucesso: boolean; id: string }>('http://localhost:3001/api/scraper/patterns', payload)
      .subscribe({
        next: (res) => {
          this.savingPattern.set(false);
          alert('✅ Padrão de extração salvo com sucesso no banco de dados SQLite!');
          this.selectedPatternId.set(res.id);
          this.carregarPadroes();
        },
        error: (err) => {
          this.savingPattern.set(false);
          alert('❌ Erro ao salvar padrão: ' + (err.error?.erro || err.message));
        }
      });
  }

  excluirPadraoAtual(): void {
    const patId = this.selectedPatternId();
    if (!patId || patId === '__novo__') return;

    const pattern = this.patterns().find((p) => p.id === patId);
    const patternName = pattern ? pattern.name : patId;

    const confirmado = confirm(`Tem certeza que deseja excluir o padrão "${patternName}" do banco de dados SQLite?`);
    if (!confirmado) return;

    this.deletingPattern.set(true);
    this.http.delete<{ sucesso: boolean; message: string }>(`http://localhost:3001/api/scraper/patterns/${patId}`)
      .subscribe({
        next: () => {
          this.deletingPattern.set(false);
          alert('✅ Padrão de extração excluído com sucesso do banco de dados SQLite!');
          this.carregarPadroes();
        },
        error: (err) => {
          this.deletingPattern.set(false);
          alert('❌ Erro ao excluir padrão: ' + (err.error?.erro || err.message));
        }
      });
  }

  testScraper(): void {
    this.loading.set(true);
    const formVal = this.scanForm.value;
    const patCatalogUrl = this.patterns().find((p) => p.id === this.selectedPatternId())?.catalogUrl;
    const finalUrl = this.selectedPatternId() === '__novo__' ? formVal.catalogUrl : (formVal.catalogUrl || patCatalogUrl);

    const payload = {
      ...formVal,
      catalogUrl: finalUrl
    };

    this.http.post<{ success: boolean; offers: ScrapedOffer[] }>(
      'http://localhost:3001/api/scraper/test', 
      payload
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.previewOffers.set(res.offers || []);
        this.showModal.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        alert('Erro ao executar o teste com o Playwright: ' + (err.error?.error || err.message));
      }
    });
  }

  saveToDatabase(): void {
    const formVal = this.scanForm.value;
    let marketId = formVal.marketId;
    const patCatalogUrl = this.patterns().find((p) => p.id === this.selectedPatternId())?.catalogUrl;
    const finalUrl = this.selectedPatternId() === '__novo__' ? formVal.catalogUrl : (formVal.catalogUrl || patCatalogUrl);

    if ((!marketId || this.selectedPatternId() === '__novo__') && finalUrl) {
      const lower = finalUrl.toLowerCase();
      if (lower.includes('davo')) marketId = 'davo-alto-ipiranga';
      else if (lower.includes('shibata')) marketId = 'shibata-mogilar';
      else if (lower.includes('semar')) marketId = 'semar-centro';
      else if (lower.includes('alabarce')) marketId = 'alabarce-vila-oliveira';
      else if (lower.includes('assai')) marketId = 'assai-braz-cubas';
    }

    const payload = {
      marketId: marketId || (this.markets().length > 0 ? this.markets()[0]!.id : 'davo-alto-ipiranga'),
      catalogUrl: finalUrl,
      patternId: this.selectedPatternId() !== '__novo__' ? this.selectedPatternId() : undefined,
      offers: this.previewOffers()
    };

    this.http.post('http://localhost:3001/api/scraper/save', payload).subscribe({
      next: () => {
        alert(`✅ ${this.previewOffers().length} ofertas categorizadas e gravadas com sucesso no banco precocerto.db!`);
        this.closeModal();
        this.saved.emit();
      },
      error: (err) => alert('Erro ao gravar no SQLite: ' + (err.error?.error || err.message))
    });
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onCloseForm(): void {
    this.close.emit();
  }
}
