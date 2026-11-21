import { useCallback, useSyncExternalStore } from 'react'

export function useConsultaMidia(consulta: string, valorServidor = false) {
  const assinar = useCallback(
    (avisar: () => void) => {
      const lista = window.matchMedia(consulta)
      lista.addEventListener('change', avisar)
      return () => lista.removeEventListener('change', avisar)
    },
    [consulta],
  )
  const ler = useCallback(() => window.matchMedia(consulta).matches, [consulta])

  return useSyncExternalStore(assinar, ler, () => valorServidor)
}
