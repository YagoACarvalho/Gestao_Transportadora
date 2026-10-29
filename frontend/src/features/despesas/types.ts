export interface DadosDespesa {
  caminhaoId?: string | null;
  considerarNoFinanceiro?: boolean;
  descricao: string; categoria: string; valor: number; dataDespesa: string; viagemId: string | null;
}
export interface Despesa {
  caminhaoId?: string | null;
  caminhao?: { placa: string; modelo: string; ativo: boolean } | null;
  origem?: 'Manual' | 'RemuneracaoMotorista';
  considerarNoFinanceiro?: boolean;
  id: string; descricao: string | null; categoria: string | null; valor: number | null;
  dataDespesa: string | null; viagemId: string | null; dataCadastro: string;
  viagem: { origem: string | null; destino: string | null; status: string | null } | null;
}
export function parseValor(texto: string): number {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(texto.trim())) throw new Error('Informe valor maior que zero, com até duas casas decimais.');
  const valor = Number(texto.trim().replace(',', '.'));
  if (valor <= 0 || valor > 9999999999.99) throw new Error('O valor deve ser maior que zero e no máximo 9999999999,99.');
  return valor;
}
export const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function filtrarDespesas(items: Despesa[], busca: string, inicio: string, fim: string, viagemId: string) {
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  return items.filter(item => (!inicio || !!item.dataDespesa && item.dataDespesa >= inicio) &&
    (!fim || !!item.dataDespesa && item.dataDespesa <= fim) &&
    (!viagemId || (viagemId === 'sem-vinculo' ? !item.viagemId : item.viagemId === viagemId)) &&
    (!termo || [item.descricao, item.categoria, item.viagem?.origem, item.viagem?.destino, item.caminhao?.placa, item.caminhao?.modelo].some(v => v?.toLocaleLowerCase('pt-BR').includes(termo))));
}
