type Acao = 'detalhes' | 'editar' | 'reativar' | 'desativar' | 'iniciar' | 'pausar' | 'concluir' | 'cancelar' | 'despesa' | 'excluir' | 'financeiro';

const caminhos: Record<Acao, string> = {
  detalhes: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  editar: 'm14 5 5 5M4 20l4-1L20 7a2 2 0 0 0-4-4L4 15l-1 6Z',
  reativar: 'M20 7v5h-5M20 12a8 8 0 1 0-2 6M9 12l2 2 4-4',
  desativar: 'M12 2v10M6 5a9 9 0 1 0 12 0',
  iniciar: 'm8 4 12 8-12 8Z',
  pausar: 'M8 5v14M16 5v14',
  concluir: 'm4 12 5 5L20 6',
  cancelar: 'm6 6 12 12M6 18 18 6',
  despesa: 'M5 3h14v18l-3-2-4 2-4-2-3 2ZM8 8h8M12 11v6M9 14h6',
  excluir: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
  financeiro: 'M4 4v16h17M8 16v-4M13 16V8M18 16V5',
};

export function ActionIcon({ acao }: { acao: Acao }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={caminhos[acao]} /></svg>;
}
