import { isValidElement, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import type { Cor } from '../../tema'
import { juntarClasses } from '../../utilitarios'
import { TrilhaNavegacao, type ItemTrilha } from '../TrilhaNavegacao'
import estilos from './CabecalhoPagina.module.css'

export type VarianteCabecalhoPagina = 'padrao' | 'compacto' | 'destaque'

export type ItemMetaCabecalho = {
  rotulo: ReactNode
  icone?: ReactNode
  tom?: Cor
}

export type PropsCabecalhoPagina = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  titulo: ReactNode
  sobretitulo?: ReactNode
  descricao?: ReactNode
  trilha?: readonly ItemTrilha[] | ReactNode
  icone?: ReactNode
  avatar?: ReactNode
  tom?: Cor
  /** selos ao lado do título (status, plano) */
  selos?: ReactNode
  /** linha de metadados: datas, responsável, valores */
  meta?: readonly (ItemMetaCabecalho | ReactNode)[]
  acoes?: ReactNode
  /** ListaAbas (dentro de <Abas>) colada na base do cabeçalho */
  abas?: ReactNode
  variante?: VarianteCabecalhoPagina
  divisor?: boolean
  nivelTitulo?: 1 | 2 | 3
  refTitulo?: Ref<HTMLHeadingElement>
  ref?: Ref<HTMLElement>
}

function ehListaTrilha(trilha: readonly ItemTrilha[] | ReactNode): trilha is readonly ItemTrilha[] {
  return Array.isArray(trilha) && trilha.every((item) => typeof item === 'object' && item !== null && !isValidElement(item) && 'rotulo' in item)
}

function ehItemMeta(item: ItemMetaCabecalho | ReactNode): item is ItemMetaCabecalho {
  return typeof item === 'object' && item !== null && !isValidElement(item) && 'rotulo' in item
}

export function CabecalhoPagina({
  titulo,
  sobretitulo,
  descricao,
  trilha,
  icone,
  avatar,
  tom = 'azul',
  selos,
  meta,
  acoes,
  abas,
  variante = 'padrao',
  divisor = false,
  nivelTitulo = 1,
  refTitulo,
  className,
  style,
  children,
  ref,
  ...props
}: PropsCabecalhoPagina) {
  const Titulo = `h${nivelTitulo}` as const
  const midia = avatar ?? icone
  const itensMeta = meta?.filter((item) => item !== null && item !== undefined && item !== false) ?? []

  return (
    <header
      ref={ref}
      className={juntarClasses(estilos.cabecalho, className)}
      data-variante={variante}
      data-divisor={divisor || abas ? true : undefined}
      data-com-abas={abas ? true : undefined}
      style={{ '--cp-tom': `var(--aleph-${tom})`, ...style } as CSSProperties}
      {...props}
    >
      {variante === 'destaque' && <div className={estilos.capa} aria-hidden="true" />}
      <div className={estilos.corpo}>
        {trilha && (
          <div className={estilos.trilha}>
            {ehListaTrilha(trilha) ? <TrilhaNavegacao itens={trilha} tamanho="pequeno" /> : trilha}
          </div>
        )}
        <div className={estilos.linha}>
          {midia && (
            <div className={estilos.midia} data-tipo={avatar ? 'avatar' : 'icone'} aria-hidden={avatar ? undefined : true}>
              {midia}
            </div>
          )}
          <div className={estilos.textos}>
            {sobretitulo && <div className={estilos.sobretitulo}>{sobretitulo}</div>}
            <div className={estilos.linhaTitulo}>
              <Titulo ref={refTitulo} tabIndex={refTitulo ? -1 : undefined} className={estilos.titulo}>{titulo}</Titulo>
              {selos && <div className={estilos.selos}>{selos}</div>}
            </div>
            {descricao && <div className={estilos.descricao}>{descricao}</div>}
            {itensMeta.length > 0 && (
              <ul className={estilos.meta}>
                {itensMeta.map((item, indice) =>
                  ehItemMeta(item) ? (
                    <li key={indice} className={estilos.itemMeta} data-tom={item.tom}>
                      {item.icone && (
                        <span className={estilos.iconeMeta} aria-hidden="true">
                          {item.icone}
                        </span>
                      )}
                      <span>{item.rotulo}</span>
                    </li>
                  ) : (
                    <li key={indice} className={estilos.itemMeta}>
                      {item}
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
          {acoes && <div className={estilos.acoes}>{acoes}</div>}
        </div>
        {children}
      </div>
      {abas && <div className={estilos.abas}>{abas}</div>}
    </header>
  )
}
