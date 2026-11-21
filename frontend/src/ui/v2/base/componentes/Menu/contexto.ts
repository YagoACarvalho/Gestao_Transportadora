import { createContext, useEffect, type RefObject } from 'react'

export type TamanhoMenu = 'pequeno' | 'medio' | 'grande'
export type VarianteMenu = 'padrao' | 'suave'
export type FocoInicialMenu = 'primeiro' | 'ultimo' | 'painel'

export type ContextoRaizMenu = {
  fecharTudo: (devolverFoco?: boolean) => void
}

export type ContextoPainelMenu = {
  subAberto: string | null
  tamanho: TamanhoMenu
  abrirSub: (id: string) => void
  fecharSub: () => void
  agendarFecharSub: () => void
  cancelarFecharSub: () => void
}

export const ContextoRaiz = createContext<ContextoRaizMenu | null>(null)
export const ContextoPainel = createContext<ContextoPainelMenu | null>(null)

export const SELETOR_ITEM_MENU = '[data-item-menu]:not([data-desabilitado])'

export function useFocoInicialMenu(
  aberto: boolean,
  painel: RefObject<HTMLElement | null>,
  foco: RefObject<FocoInicialMenu>,
) {
  useEffect(() => {
    const elemento = painel.current
    if (!aberto || !elemento) return
    const itens = elemento.querySelectorAll<HTMLElement>(SELETOR_ITEM_MENU)
    const alvo =
      foco.current === 'primeiro' ? itens[0] : foco.current === 'ultimo' ? itens[itens.length - 1] : undefined
    ;(alvo ?? elemento).focus({ preventScroll: true })
  }, [aberto, painel, foco])
}
