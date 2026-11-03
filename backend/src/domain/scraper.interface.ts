import { OfertaScraping } from './entities';

export interface IScraperService {
  nome: string;
  executarColeta(): Promise<OfertaScraping[]>;
}

