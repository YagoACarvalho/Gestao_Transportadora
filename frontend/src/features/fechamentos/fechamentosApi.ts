import { request } from '../../api/http';

export interface FiltrosFechamento {
  dataInicial: string | null; dataFinal: string | null; motoristaId: string | null; caminhaoId: string | null;
  situacoes: string[]; categoria: string | null; incluirDespesasGerais: boolean;
}
export interface TotaisFechamento {
  totalFretes: number; totalDespesasViagens: number; totalDespesasGerais: number; totalDespesas: number;
  totalRemuneracaoMotoristas: number; resultado: number; quantidadeViagens: number; quantidadeDespesas: number;
}
export interface ViagemFechamento {
  id: string; dataViagem: string | null; origem: string | null; destino: string | null;
  motoristaId: string | null; motoristaNome: string | null; caminhaoId: string | null; caminhaoPlaca: string | null;
  situacao: string | null; valorFrete: number | null; incluidaNaReceita: boolean;
}
export interface DespesaFechamento {
  id: string; dataDespesa: string | null; descricao: string | null; categoria: string | null; valor: number | null;
  origem: string; viagemId: string | null; motoristaId: string | null; motoristaNome: string | null;
  caminhaoId: string | null; caminhaoPlaca: string | null; situacaoViagem: string | null;
}
export interface PreviaFechamento {
  filtros: FiltrosFechamento; motoristaNome: string | null; caminhaoPlaca: string | null; totais: TotaisFechamento;
  viagens: ViagemFechamento[]; despesas: DespesaFechamento[]; avisos: string[]; versaoPrevia: string;
}
export interface ResumoAcerto {
  id: string; titulo: string; dataInicial: string; dataFinal: string; dataCriacao: string; usuarioId: string; totais: TotaisFechamento;
}
export interface AcertoFechamento extends Omit<ResumoAcerto, 'totais'> { versaoFormato: number; conteudo: PreviaFechamento }
export interface PaginaFechamentos { itens: ResumoAcerto[]; pagina: number; tamanhoPagina: number; quantidadeTotal: number }
export interface SalvarAcerto { titulo: string; filtros: FiltrosFechamento; versaoPrevia: string; chaveRequisicao: string }
const post = (body: unknown, signal?: AbortSignal): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
export const fechamentosApi = {
  previa: (filtros: FiltrosFechamento, signal?: AbortSignal) => request<PreviaFechamento>('/api/fechamentos/previa', post(filtros, signal)),
  salvar: (body: SalvarAcerto, signal?: AbortSignal) => request<AcertoFechamento>('/api/fechamentos', post(body, signal)),
  listar: (pagina: number, signal?: AbortSignal) => request<PaginaFechamentos>(`/api/fechamentos?pagina=${pagina}&tamanhoPagina=20`, { signal }),
  detalhes: (id: string, signal?: AbortSignal) => request<AcertoFechamento>(`/api/fechamentos/${encodeURIComponent(id)}`, { signal }),
};
