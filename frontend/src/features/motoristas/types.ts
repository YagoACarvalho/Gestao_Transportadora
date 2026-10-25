// Data civil ISO (YYYY-MM-DD), mantida como texto no formulario.
export interface CriarMotorista {
  nome: string; cpf: string | null; numeroCnh: string | null;
  categoriaCnh: string | null; dataValidadeCnh: string | null; telefone: string | null;
}
export interface AtualizarMotorista extends CriarMotorista { ativo: boolean }
export interface Motorista extends AtualizarMotorista { id: string; dataCadastro: string }
export type FiltroSituacao = 'ativos' | 'inativos' | 'todos';
export function filtrarMotoristas(items: Motorista[], busca: string, situacao: FiltroSituacao) {
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  return items.filter(item => (situacao === 'todos' || item.ativo === (situacao === 'ativos')) &&
    [item.nome, item.cpf, item.numeroCnh].some(value => value?.toLocaleLowerCase('pt-BR').includes(termo)));
}
export function formatarDataCivil(value: string | null) {
  if (!value) return 'Não informada';
  const [ano, mes, dia] = value.split('-');
  return `${dia}/${mes}/${ano}`;
}
