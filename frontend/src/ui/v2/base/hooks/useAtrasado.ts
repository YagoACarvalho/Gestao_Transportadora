import { useEffect, useState } from 'react'

export function useAtrasado<T>(valor: T, ms = 300) {
  const [atrasado, definirAtrasado] = useState(valor)

  useEffect(() => {
    const espera = window.setTimeout(() => definirAtrasado(valor), ms)
    return () => window.clearTimeout(espera)
  }, [valor, ms])

  return atrasado
}
