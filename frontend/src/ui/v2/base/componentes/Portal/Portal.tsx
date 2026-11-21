import { useContext, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ContextoPortal } from './contexto'

export type PropsPortal = {
  children: ReactNode
  destino?: Element | null
}

const assinar = () => () => undefined

export function Portal({ children, destino }: PropsPortal) {
  const destinoDoContexto = useContext(ContextoPortal)
  // no servidor não existe document; só renderiza depois de hidratar
  const noCliente = useSyncExternalStore(
    assinar,
    () => true,
    () => false,
  )
  if (!noCliente) return null
  return createPortal(children, destino ?? destinoDoContexto ?? document.body)
}
