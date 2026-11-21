import { useEffect, useEffectEvent, type RefObject } from 'react'

export function useClickFora(
  referencias: ReadonlyArray<RefObject<HTMLElement | null>>,
  aoClicarFora: () => void,
  ativo = true,
) {
  const verificar = useEffectEvent((evento: PointerEvent) => {
    const alvo = evento.target as Node
    if (referencias.some((referencia) => referencia.current?.contains(alvo))) return
    aoClicarFora()
  })

  useEffect(() => {
    if (!ativo) return
    document.addEventListener('pointerdown', verificar)
    return () => document.removeEventListener('pointerdown', verificar)
  }, [ativo])
}
