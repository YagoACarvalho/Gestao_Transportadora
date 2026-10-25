export interface CriarCaminhao { placa: string; modelo: string }
export interface AtualizarCaminhao extends CriarCaminhao { ativo: boolean }
export interface Caminhao extends AtualizarCaminhao { id: string; dataCadastro: string }
export type FiltroSituacao = 'ativos' | 'inativos' | 'todos';

export function filtrarCaminhoes(items: Caminhao[], busca: string, situacao: FiltroSituacao) {
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  return items.filter(item => (situacao === 'todos' || item.ativo === (situacao === 'ativos')) &&
    [item.placa, item.modelo].some(value => value.toLocaleLowerCase('pt-BR').includes(termo)));
}
