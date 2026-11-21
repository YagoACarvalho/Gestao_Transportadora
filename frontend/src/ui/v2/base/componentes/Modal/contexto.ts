import { createContext, useContext } from 'react'

export type MotivoFechar = 'esc' | 'fora' | 'botao' | 'acao'

export type ContextoModal = {
  idTitulo: string
  idDescricao: string
  fechar: (motivo?: MotivoFechar) => void
}

export const ContextoModal = createContext<ContextoModal | null>(null)

export function useModal() {
  const contexto = useContext(ContextoModal)
  if (!contexto) throw new Error('useModal precisa estar dentro de <Modal>')
  return contexto
}
