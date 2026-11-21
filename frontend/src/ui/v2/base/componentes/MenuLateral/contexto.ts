import { Children, createContext, isValidElement, useContext, type ReactNode } from 'react'
import { normalizarTexto } from '../../utilitarios'

export type VarianteMenuLateral = 'padrao' | 'suave' | 'flutuante'
export type TamanhoMenuLateral = 'pequeno' | 'medio' | 'grande'

export type ValorMenuLateral = {
  recolhido: boolean
  mudarRecolhido: (recolhido: boolean) => void
  valor: string | null
  navegar: (valor: string) => void
  /** termo da busca já normalizado */
  termo: string
  /** termo como foi digitado, para destacar no rótulo */
  busca: string
  registrarAtalhos: boolean
  naGaveta: boolean
}

export const ContextoMenuLateral = createContext<ValorMenuLateral | null>(null)

/** estado do MenuLateral mais próximo: recolhido, item ativo e termo de busca */
export function useMenuLateral() {
  const contexto = useContext(ContextoMenuLateral)
  if (!contexto) throw new Error('As partes do MenuLateral precisam estar dentro de <MenuLateral>')
  return contexto
}

/** lista: itens comuns; flutuante: dentro do menu de um grupo com o MenuLateral recolhido; oculto: só registra atalhos */
export type ModoGrupoMenuLateral = 'lista' | 'flutuante' | 'oculto'

export type ValorGrupoMenuLateral = {
  modo: ModoGrupoMenuLateral
  nivel: number
  /** o rótulo do grupo casou com a busca: mostra todos os filhos */
  casouGrupo: boolean
}

export const ContextoGrupoMenuLateral = createContext<ValorGrupoMenuLateral>({ modo: 'lista', nivel: 0, casouGrupo: false })

/** true quando o pai é um <ul>: itens e seções viram <li> */
export const ContextoListaMenuLateral = createContext(false)

type PropsComTexto = { valor?: unknown; rotulo?: unknown; textoBusca?: unknown; titulo?: unknown; children?: ReactNode }

export function textoBuscaDe(props: PropsComTexto) {
  if (typeof props.textoBusca === 'string') return props.textoBusca
  if (typeof props.rotulo === 'string') return props.rotulo
  if (typeof props.children === 'string') return props.children
  return ''
}

export const casaTermo = (texto: string, termo: string) => !termo || normalizarTexto(texto).includes(termo)

/** procura nos filhos (itens e grupos) algum que case com a busca */
export function algumCasa(filhos: ReactNode, termo: string): boolean {
  if (!termo) return true
  for (const filho of Children.toArray(filhos)) {
    if (!isValidElement<PropsComTexto>(filho)) continue
    const props = filho.props
    if (props.valor !== undefined || typeof props.textoBusca === 'string') {
      if (casaTermo(textoBuscaDe(props), termo)) return true
      if (typeof props.children !== 'string' && algumCasa(props.children, termo)) return true
    } else if (algumCasa(props.children, termo)) return true
  }
  return false
}

/** algum item dentro destes filhos é o ativo? */
export function contemValor(filhos: ReactNode, valor: string | null): boolean {
  if (valor === null) return false
  for (const filho of Children.toArray(filhos)) {
    if (!isValidElement<PropsComTexto & { ativo?: boolean }>(filho)) continue
    if (filho.props.ativo === true || filho.props.valor === valor) return true
    if (typeof filho.props.children !== 'string' && contemValor(filho.props.children, valor)) return true
  }
  return false
}

export const SELETOR_ITEM_MENU_LATERAL = '[data-item-menu-lateral]'

export function formatarContador(contador: number, maximo = 99) {
  return contador > maximo ? `${maximo}+` : String(contador)
}
