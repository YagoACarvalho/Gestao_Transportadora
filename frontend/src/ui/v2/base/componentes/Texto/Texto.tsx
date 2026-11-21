import type { ElementType, HTMLAttributes, Ref } from 'react'
import type { Cor } from '../../tema'
import { juntarClasses } from '../../utilitarios'
import estilos from './Texto.module.css'

export type VarianteTexto = 'titulo' | 'subtitulo' | 'corpo' | 'pequeno' | 'legenda' | 'herdar'
export type TomTexto = 'padrao' | 'suave' | 'fraco' | Cor
export type PesoTexto = 'regular' | 'medio' | 'semibold' | 'negrito'
export type ElementoTexto = 'span' | 'p' | 'div' | 'strong' | 'em' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export type PropsTexto = HTMLAttributes<HTMLElement> & {
  como?: ElementoTexto
  variante?: VarianteTexto
  tom?: TomTexto
  peso?: PesoTexto
  truncar?: boolean
  ref?: Ref<HTMLElement>
}

export function Texto({
  como = 'span',
  variante = 'corpo',
  tom = 'padrao',
  peso,
  truncar = false,
  className,
  ...props
}: PropsTexto) {
  const Elemento = como as ElementType
  return (
    <Elemento
      className={juntarClasses(estilos.texto, className)}
      data-variante={variante}
      data-tom={tom}
      data-peso={peso}
      data-truncar={truncar || undefined}
      {...props}
    />
  )
}
