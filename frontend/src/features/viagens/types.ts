export const situacoes = ['Planejada', 'Em andamento', 'Pausada', 'Concluída', 'Cancelada'] as const;
export type SituacaoViagem = typeof situacoes[number];
export interface DadosViagem {
  origem: string; destino: string; dataViagem: string;
  motoristaId: string; caminhaoId: string; valorFrete: number | null;
}
export interface AtualizarViagem extends DadosViagem { status: SituacaoViagem }
export interface Viagem {
  gerarRemuneracaoAutomatica?: boolean;
  id: string; origem: string | null; destino: string | null; dataViagem: string | null;
  motoristaId: string | null; motoristaNome: string | null; motoristaAtivo: boolean | null;
  caminhaoId: string | null; caminhaoPlaca: string | null; caminhaoAtivo: boolean | null;
  valorFrete: number | null; status: string | null; dataCadastro: string;
}
export function calcularRemuneracao(frete: number | null): number {
  // Centavos inteiros: reproduz os 15% com meio centavo arredondado para cima.
  return Math.floor((Math.round((frete ?? 0) * 100) * 15 + 50) / 100) / 100;
}
export function proximasSituacoes(status: string | null): SituacaoViagem[] {
  return status === 'Planejada' ? ['Em andamento', 'Cancelada'] : status === 'Em andamento' ? ['Pausada', 'Concluída', 'Cancelada'] : status === 'Pausada' ? ['Em andamento', 'Cancelada'] : status === 'Concluída' || status === 'Cancelada' ? ['Planejada'] : [];
}
export const semSituacao = (status: string | null) => !status?.trim();
export function dadosCompletos(viagem: Viagem): viagem is Viagem & DadosViagem {
  return !!(viagem.origem && viagem.destino && viagem.dataViagem && viagem.motoristaId && viagem.caminhaoId);
}
export function dadosDaViagem(viagem: Viagem & DadosViagem): DadosViagem {
  return { origem: viagem.origem, destino: viagem.destino, dataViagem: viagem.dataViagem, motoristaId: viagem.motoristaId, caminhaoId: viagem.caminhaoId, valorFrete: viagem.valorFrete };
}
export function parseFrete(texto: string): number | null {
  if (!texto.trim()) return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(texto.trim())) throw new Error('Informe frete não negativo, com até duas casas decimais.');
  const valor = Number(texto.trim().replace(',', '.'));
  if (valor > 9999999999.99) throw new Error('O frete deve ser no máximo 9999999999,99.');
  return valor;
}
export function filtrarViagens(items: Viagem[], busca: string, status: string, inicio: string, fim: string) {
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  return items.filter(item => (!status || item.status === status) &&
    (!inicio || !!item.dataViagem && item.dataViagem >= inicio) && (!fim || !!item.dataViagem && item.dataViagem <= fim) &&
    (!termo || [item.origem, item.destino, item.motoristaNome, item.caminhaoPlaca].some(value => value?.toLocaleLowerCase('pt-BR').includes(termo))));
}
export function formatarData(value: string | null) {
  if (!value) return 'Não informada';
  const [ano, mes, dia] = value.split('-'); return `${dia}/${mes}/${ano}`;
}
