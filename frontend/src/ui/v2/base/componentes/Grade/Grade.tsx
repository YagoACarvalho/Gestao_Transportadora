import type { CSSProperties, ElementType, HTMLAttributes, ReactNode, Ref } from 'react'
import { juntarClasses } from '../../utilitarios'
import { valorEspaco, type EspacoLayout } from '../Pilha/espaco'
import estilos from './Grade.module.css'

export type Responsivo<T> = T | { base?: T; medio?: T; grande?: T }
export type AlinharGrade = 'inicio' | 'centro' | 'fim' | 'esticar'

export type PropsGrade = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  como?: ElementType
  colunas?: Responsivo<number>
  larguraMinima?: number | string
  preencher?: boolean
  espaco?: EspacoLayout
  espacoLinha?: EspacoLayout
  espacoColuna?: EspacoLayout
  alinhar?: AlinharGrade
  alinharItens?: AlinharGrade
  ref?: Ref<HTMLElement>
  children?: ReactNode
}

export function Grade({
  como,
  colunas,
  larguraMinima,
  preencher = false,
  espaco = 4,
  espacoLinha,
  espacoColuna,
  alinhar,
  alinharItens,
  className,
  style,
  children,
  ...props
}: PropsGrade) {
  const Elemento: ElementType = como ?? 'div'
  const minima = typeof larguraMinima === 'number' ? `${larguraMinima}px` : larguraMinima
  const automatica = minima
    ? `repeat(auto-${preencher ? 'fill' : 'fit'}, minmax(min(100%, ${minima}), 1fr))`
    : undefined
  const fixa = (n: number) => `repeat(${n}, minmax(0, 1fr))`

  const variaveis: Record<string, string | undefined> = {
    '--grade-espaco-linha': valorEspaco(espacoLinha ?? espaco),
    '--grade-espaco-coluna': valorEspaco(espacoColuna ?? espaco),
  }
  if (typeof colunas === 'number') variaveis['--grade-base'] = fixa(colunas)
  else if (colunas) {
    variaveis['--grade-base'] = colunas.base !== undefined ? fixa(colunas.base) : (automatica ?? fixa(1))
    if (colunas.medio !== undefined) variaveis['--grade-medio'] = fixa(colunas.medio)
    if (colunas.grande !== undefined) variaveis['--grade-grande'] = fixa(colunas.grande)
  } else variaveis['--grade-base'] = automatica ?? fixa(1)

  return (
    <Elemento
      className={juntarClasses(estilos.grade, className)}
      data-alinhar={alinhar}
      data-alinhar-itens={alinharItens}
      style={{ ...variaveis, ...style } as CSSProperties}
      {...props}
    >
      {children}
    </Elemento>
  )
}

export type PropsItemGrade = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  como?: ElementType
  colunas?: Responsivo<number | 'total'>
  linhas?: number
  ref?: Ref<HTMLElement>
  children?: ReactNode
}

function ocupar(valor: number | 'total') {
  return valor === 'total' ? '1 / -1' : `span ${valor} / span ${valor}`
}

export function ItemGrade({ como, colunas, linhas, className, style, children, ...props }: PropsItemGrade) {
  const Elemento: ElementType = como ?? 'div'
  const variaveis: Record<string, string> = {}
  if (typeof colunas === 'number' || colunas === 'total') variaveis['--item-base'] = ocupar(colunas)
  else if (colunas) {
    if (colunas.base !== undefined) variaveis['--item-base'] = ocupar(colunas.base)
    if (colunas.medio !== undefined) variaveis['--item-medio'] = ocupar(colunas.medio)
    if (colunas.grande !== undefined) variaveis['--item-grande'] = ocupar(colunas.grande)
  }
  if (linhas) variaveis['--item-linhas'] = `span ${linhas} / span ${linhas}`

  return (
    <Elemento className={juntarClasses(estilos.item, className)} style={{ ...variaveis, ...style } as CSSProperties} {...props}>
      {children}
    </Elemento>
  )
}
