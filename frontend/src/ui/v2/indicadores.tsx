

import { Botao, Dica, Grade, Link as LinkAleph, type Cor } from "./base";
import { ChevronRight } from "lucide-react";

import type { CSSProperties, ReactNode } from "react";
import estilos from "./indicadores.module.css";

export const estiloTom = (tom: Cor = "cinza", intensidade?: number) => ({
  "--indicador-tom": `var(--aleph-${tom})`,
  "--indicador-tom-fundo": `var(--aleph-${tom}-fundo)`,
  ...(intensidade !== undefined && { "--indicador-intensidade": `${intensidade}%` }),
}) as CSSProperties;

/** Moldura cinza com rótulo em caixa alta e o conteúdo num painel branco. */
export function MolduraIndicador({ rotulo, icone, acoes, className, id, children }: {
  rotulo: string;
  icone?: ReactNode;
  acoes?: ReactNode;
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={className ? `${estilos.moldura} ${className}` : estilos.moldura} aria-label={rotulo} data-rh-componentes-v2 data-aleph-base data-rh-indicador>
      <header className={estilos.topoMoldura}>
        {icone && <span className={estilos.iconeRotulo} aria-hidden="true">{icone}</span>}
        <h3 className={estilos.rotulo} title={rotulo}>{rotulo}</h3>
        {acoes && <div className={estilos.acoesMoldura}>{acoes}</div>}
      </header>
      <div className={estilos.painel}>{children}</div>
    </section>
  );
}

export function GradeIndicadores({ children, colunas = 3, className, rotulo }: {
  children: ReactNode;
  colunas?: 2 | 3 | 4;
  className?: string;
  rotulo?: string;
}) {
  return <Grade data-rh-componentes-v2 data-aleph-base data-rh-grade-indicadores aria-label={rotulo} className={className ? `${estilos.grade} ${className}` : estilos.grade} larguraMinima={`max(280px, calc((100% - ${colunas - 1} * var(--aleph-espaco-3)) / ${colunas}))`} espaco={3} alinharItens="esticar">{children}</Grade>;
}

export function ValorIndicador({ valor, comparacao }: { valor: ReactNode; comparacao?: ReactNode }) {
  return (
    <div className={estilos.cabecaValor}>
      <p className={estilos.valor}>{valor}</p>
      {comparacao && <p className={estilos.comparacao}>{comparacao}</p>}
    </div>
  );
}

export function Realce({ tom, children }: { tom: Cor; children: ReactNode }) {
  return <span className={estilos.realce} style={estiloTom(tom)}>{children}</span>;
}

export function DivisorIndicador() {
  return <hr className={estilos.divisor} />;
}

export function RodapeIndicador({ icone, nota, acao }: { icone?: ReactNode; nota?: ReactNode; acao?: ReactNode }) {
  return (
    <footer className={estilos.rodape}>
      {nota && <p className={estilos.nota}>{icone && <span aria-hidden="true">{icone}</span>}{nota}</p>}
      {acao && <div className={estilos.acaoRodape}>{acao}</div>}
    </footer>
  );
}

export type SegmentoIndicador = { chave: string; rotulo: string; valor: number; tom: Cor; intensidade?: number; texto: string; dica?: ReactNode };

/** Uma barra só, dividida pela parte de cada segmento; o que falta para o total fica em cinza. */
export function BarraSegmentada({ rotulo, segmentos, restante = 0, rotuloRestante }: {
  rotulo: string;
  segmentos: readonly SegmentoIndicador[];
  restante?: number;
  rotuloRestante?: string;
}) {
  const visiveis = segmentos.filter((segmento) => segmento.valor > 0);
  return (
    <div className={estilos.barra} role="group" aria-label={rotulo}>
      {visiveis.map((segmento) => (
        <Dica key={segmento.chave} conteudo={segmento.dica ?? `${segmento.rotulo}: ${segmento.texto}`}>
          <span className={estilos.segmento} style={{ ...estiloTom(segmento.tom, segmento.intensidade), flexGrow: segmento.valor }} role="img" aria-label={`${segmento.rotulo}: ${segmento.texto}`} />
        </Dica>
      ))}
      {(restante > 0 || visiveis.length === 0) && (
        <span className={estilos.segmento} data-restante style={{ flexGrow: restante || 1 }} role="img" aria-label={rotuloRestante ?? "Sem registro"} />
      )}
    </div>
  );
}

export function LegendaSegmentos({ itens, fim }: { itens: readonly Pick<SegmentoIndicador, "chave" | "rotulo" | "tom" | "intensidade" | "texto">[]; fim?: ReactNode }) {
  return (
    <div className={estilos.legenda}>
      <ul className={estilos.itensLegenda}>
        {itens.map((item) => (
          <li key={item.chave} style={estiloTom(item.tom, item.intensidade)}>
            <span className={estilos.ponto} aria-hidden="true" />
            <span className={estilos.rotuloLegenda}>{item.rotulo}</span>
            <strong className={estilos.textoLegenda}>{item.texto}</strong>
          </li>
        ))}
      </ul>
      {fim && <span className={estilos.fimLegenda}>{fim}</span>}
    </div>
  );
}

/** Linhas de legenda com ponto, um detalhe opcional no meio e o valor alinhado à direita. */
export function ListaSegmentos({ rotulo, itens }: {
  rotulo: string;
  itens: readonly { chave: string; rotulo: string; tom: Cor; intensidade?: number; meio?: ReactNode; texto: ReactNode }[];
}) {
  return (
    <dl className={estilos.listaSegmentos} aria-label={rotulo}>
      {itens.map((item) => (
        <div key={item.chave} className={estilos.linhaSegmento} style={estiloTom(item.tom, item.intensidade)}>
          <dt><span className={estilos.ponto} aria-hidden="true" />{item.rotulo}</dt>
          <dd className={estilos.meio}>{item.meio}</dd>
          <dd className={estilos.valorLinha}>{item.texto}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Progresso em traços verticais: cada traço é uma fração igual do total. */
export function BarraTracos({ rotulo, valor, total, tom, tracos = 36 }: { rotulo: string; valor: number; total: number; tom: Cor; tracos?: number }) {
  const cheios = total > 0 ? Math.round(Math.min(1, Math.max(0, valor / total)) * tracos) : 0;
  return (
    <div className={estilos.tracos} role="img" aria-label={rotulo} style={estiloTom(tom)}>
      {Array.from({ length: tracos }, (_, indice) => <span key={indice} data-cheio={indice < cheios || undefined} />)}
    </div>
  );
}

const INTENSIDADES = ["100%", "48%", "24%", "14%"];

/** Colunas com largura proporcional ao valor, do maior para o menor, em tons da mesma cor. */
export function ColunasProporcionais({ rotulo, tom, colunas }: {
  rotulo: string;
  tom: Cor;
  colunas: readonly { chave: string; rotulo: string; texto: string; valor: number }[];
}) {
  const ordenadas = [...colunas].filter((coluna) => coluna.valor > 0).sort((a, b) => b.valor - a.valor);
  return (
    <ul className={estilos.colunas} aria-label={rotulo} style={estiloTom(tom)}>
      {ordenadas.map((coluna, indice) => (
        <li key={coluna.chave} className={estilos.coluna} style={{ flexGrow: coluna.valor, "--coluna-intensidade": INTENSIDADES[Math.min(indice, INTENSIDADES.length - 1)] } as CSSProperties}>
          <span className={estilos.rotuloColuna} title={coluna.rotulo}>{coluna.rotulo}</span>
          <span className={estilos.textoColuna}>{coluna.texto}</span>
          <span className={estilos.barraColuna} aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}

/** Números lado a lado, separados por um fio vertical. */
export function FaixaNumeros({ rotulo, itens }: { rotulo: string; itens: readonly { rotulo: string; valor: ReactNode; tom?: Cor }[] }) {
  return (
    <dl className={estilos.numeros} aria-label={rotulo}>
      {itens.map((item) => (
        <div key={item.rotulo} className={estilos.numero}>
          <dt>{item.rotulo}</dt>
          <dd data-tom={item.tom ? "" : undefined} style={item.tom ? estiloTom(item.tom) : undefined}>{item.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Link discreto do canto da moldura, com a seta. */
export function LinkMoldura({ href, children }: { href: string; children: ReactNode }) {
  return (
    <LinkAleph comoFilho tom="padrao" variante="sutil">
      <a href={href} className={estilos.linkMoldura}>
        {children}
        <ChevronRight size={14} aria-hidden="true" />
      </a>
    </LinkAleph>
  );
}

export function AcaoMoldura({ children, aoClicar, rotulo, desabilitado }: {
  children: ReactNode;
  aoClicar: () => void;
  rotulo?: string;
  desabilitado?: boolean;
}) {
  return <Botao variante="fantasma" tamanho="pequeno" className={estilos.acaoMoldura} iconeDireita={<ChevronRight size={14} />} onClick={aoClicar} aria-label={rotulo} disabled={desabilitado}>{children}</Botao>;
}

/** Dado curto em pílula cinza, com ícone; `tom` pinta a pílula. */
export function PilulaDado({ icone, tom, children }: { icone?: ReactNode; tom?: Cor; children: ReactNode }) {
  return (
    <span className={estilos.pilula} data-tom={tom ? "" : undefined} style={tom ? estiloTom(tom) : undefined}>
      {icone && <span className={estilos.iconePilula} aria-hidden="true">{icone}</span>}
      {children}
    </span>
  );
}
