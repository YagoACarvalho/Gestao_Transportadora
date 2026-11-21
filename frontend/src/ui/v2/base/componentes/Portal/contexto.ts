import { createContext } from 'react'

// dentro de um modal, menus e listas abrem no próprio diálogo para não ficarem inertes
export const ContextoPortal = createContext<Element | null>(null)
