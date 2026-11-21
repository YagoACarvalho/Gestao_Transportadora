import { createContext, useContext, type ReactNode } from 'react'

export type ContextoCampo = {
  id: string
  idMensagem: string
  desabilitado: boolean
  obrigatorio: boolean
  invalido: boolean
  temMensagem: boolean
  definirErroInterno: (erro?: string) => void
  definirContador: (contador?: ReactNode) => void
}

export const ContextoDoCampo = createContext<ContextoCampo | null>(null)

export function useCampo() {
  return useContext(ContextoDoCampo)
}
