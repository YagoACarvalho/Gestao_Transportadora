import { createContext, useContext } from 'react'

export type ValorCascaApp = {
  recolhido: boolean
  mudarRecolhido: (recolhido: boolean) => void
  celular: boolean
  /** true para o que está renderizado dentro da gaveta do celular */
  naGaveta: boolean
  gavetaAberta: boolean
  abrirGaveta: () => void
  fecharGaveta: () => void
  atalhoRecolher?: string
}

export const ContextoCascaApp = createContext<ValorCascaApp | null>(null)

/** estado da casca (menu recolhido, celular, gaveta); null fora de uma CascaApp */
export function useCascaApp() {
  return useContext(ContextoCascaApp)
}

const lerArmazenamento = (chave: string) => {
  try {
    return window.localStorage.getItem(chave)
  } catch {
    return null
  }
}

export function lerRecolhidoPersistido(chave: string | undefined): boolean | undefined {
  if (!chave || typeof window === 'undefined') return undefined
  const salvo = lerArmazenamento(chave)
  return salvo === null ? undefined : salvo === '1'
}

export function gravarRecolhidoPersistido(chave: string | undefined, recolhido: boolean) {
  if (!chave) return
  try {
    window.localStorage.setItem(chave, recolhido ? '1' : '0')
  } catch {
    // armazenamento bloqueado (aba anônima): segue só em memória
  }
}
