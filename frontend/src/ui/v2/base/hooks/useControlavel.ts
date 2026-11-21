import { useCallback, useState } from 'react'

export function useControlavel<T>(valor: T | undefined, valorPadrao: T, onMudar?: (valor: T) => void) {
  const [interno, setInterno] = useState(valorPadrao)
  const controlado = valor !== undefined
  const atual = controlado ? valor : interno

  const mudar = useCallback(
    (novo: T) => {
      if (!controlado) setInterno(novo)
      onMudar?.(novo)
    },
    [controlado, onMudar],
  )

  return [atual, mudar] as const
}
