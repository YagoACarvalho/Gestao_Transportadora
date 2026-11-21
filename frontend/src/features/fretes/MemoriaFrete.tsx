import type { EntradaFrete, ResultadoFrete } from './types';
import { moeda } from './types';
import styles from './Fretes.module.css';

const numero = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
export function MemoriaFrete({ entrada, resultado: r }: { entrada: EntradaFrete; resultado: ResultadoFrete }) {
  const ccd = r.coeficientes.ccd.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return <section aria-label="Memória do cálculo" className={styles.memory}>
    <h3>Memória do cálculo</h3>
    <p>Ida: {numero(r.distanciaKm)} km × {ccd} R$/km + {moeda(r.coeficientes.cc)} = <strong>{moeda(r.pisoIda)}</strong>.</p>
    <p>Distância de ida {entrada.distanciaContratadaKm !== null ? 'contratada informada' : 'estimada pela rota'}. A quantidade total de eixos seleciona os coeficientes; não multiplica novamente o resultado.</p>
    {r.distanciaRetornoKm > 0 ? <>
      <p>Retorno vazio: 0,92 × {ccd} R$/km × {numero(r.distanciaRetornoKm)} km = <strong>{moeda(r.retornoVazio)}</strong>.</p>
      <p>Distância de retorno {entrada.distanciaRetornoContratadaKm !== null ? 'contratada informada' : 'estimada da entrega até a coleta; confira o contrato'}.</p>
    </> : <p>{entrada.retornoComNovaCarga === true ? 'Volta com nova carga: calcule a nova operação separadamente. Não há acréscimo de retorno vazio nesta simulação.' : 'Não foi acrescido retorno vazio obrigatório nesta operação.'}</p>}
    <p>Piso ANTT: {moeda(r.pisoIda)} + {moeda(r.retornoVazio)} = <strong>{moeda(r.pisoTotal)}</strong>.</p>
    <p>Total {r.pedagio === null ? 'parcial' : 'da operação'}: {moeda(r.pisoTotal)} + pedágio {r.pedagio === null ? 'pendente' : moeda(r.pedagio)} + adicionais {moeda(r.adicionais)} = <strong>{moeda(r.totalOperacao)}</strong>.</p>
    <p>O piso não inclui lucro, pedágio e adicionais negociados. As parcelas são arredondadas a centavos. O preço sugerido usa os custos próprios e o acréscimo comercial, respeitando o piso com adicionais.</p>
  </section>;
}
