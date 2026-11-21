import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import type { Cor } from '../../tema'
import { juntarClasses } from '../../utilitarios'
import estilos from './Selo.module.css'

export type VarianteSelo = 'texto' | 'suave' | 'tingido' | 'contorno' | 'neutro' | 'solido' | 'gradiente' | 'iridescente'
export type TamanhoSelo = 'pequeno' | 'medio' | 'grande' | 'extra'
export type FormaSelo = 'pilula' | 'arredondado' | 'quadrado'

export type PropsSelo = HTMLAttributes<HTMLSpanElement> & {
  tom?: Cor
  cor?: string
  corTexto?: string
  variante?: VarianteSelo
  tamanho?: TamanhoSelo
  forma?: FormaSelo
  ponto?: boolean
  pulsar?: boolean
  icone?: ReactNode
  iconeFim?: ReactNode
  duotom?: boolean
  esmaecido?: boolean
  riscado?: boolean
}

export function Selo({
  tom = 'cinza',
  cor,
  corTexto,
  variante = 'suave',
  tamanho,
  forma = 'pilula',
  ponto = false,
  pulsar = false,
  icone,
  iconeFim,
  duotom = false,
  esmaecido = false,
  riscado = false,
  className,
  style,
  children,
  ...props
}: PropsSelo) {
  const personalizada = cor
    ? ({
        '--selo-cor': cor,
        '--selo-fundo': `color-mix(in srgb, ${cor} 15%, var(--aleph-superficie))`,
        ...(corTexto ? { '--selo-sobre': corTexto } : null),
      } as CSSProperties)
    : corTexto
      ? ({ '--selo-sobre': corTexto } as CSSProperties)
      : undefined

  return (
    <span
      className={juntarClasses(estilos.selo, className)}
      data-tom={cor ? undefined : tom}
      data-variante={variante}
      data-tamanho={tamanho}
      data-forma={forma}
      data-duotom={duotom || undefined}
      data-esmaecido={esmaecido || undefined}
      data-riscado={riscado || undefined}
      style={personalizada ? { ...personalizada, ...style } : style}
      {...props}
    >
      {ponto && <span className={estilos.ponto} data-pulsar={pulsar || undefined} aria-hidden="true" />}
      {icone && (
        <span className={estilos.icone} aria-hidden="true">
          {icone}
        </span>
      )}
      {children !== undefined && children !== null && children !== false && <span className={estilos.texto}>{children}</span>}
      {iconeFim && (
        <span className={estilos.icone} aria-hidden="true">
          {iconeFim}
        </span>
      )}
    </span>
  )
}
