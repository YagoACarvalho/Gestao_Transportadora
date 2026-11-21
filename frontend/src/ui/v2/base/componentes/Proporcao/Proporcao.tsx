import type { CSSProperties, ElementType, HTMLAttributes, ReactNode, Ref } from 'react'
import { juntarClasses } from '../../utilitarios'
import { VALOR_RAIO, type RaioLayout } from '../Pilha/espaco'
import estilos from './Proporcao.module.css'

export type RazaoProporcao = number | '1/1' | '4/3' | '3/2' | '16/9' | '21/9' | '3/4' | '2/3' | '9/16' | (string & {})

export type PropsProporcao = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  como?: ElementType
  razao?: RazaoProporcao
  raio?: RaioLayout
  encaixe?: 'cobrir' | 'conter'
  ref?: Ref<HTMLElement>
  children?: ReactNode
}

export function Proporcao({ como, razao = '16/9', raio = 'nenhum', encaixe = 'cobrir', className, style, children, ...props }: PropsProporcao) {
  const Elemento: ElementType = como ?? 'div'
  return (
    <Elemento
      className={juntarClasses(estilos.proporcao, className)}
      data-encaixe={encaixe}
      style={{ '--proporcao-razao': String(razao).replace('/', ' / '), '--proporcao-raio': VALOR_RAIO[raio], ...style } as CSSProperties}
      {...props}
    >
      {children}
    </Elemento>
  )
}
