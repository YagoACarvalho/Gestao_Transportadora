import type { FocusEvent, MouseEvent, PointerEvent, Ref } from 'react'

export type PropsGatilhoDica = {
  ref?: Ref<HTMLElement>
  title?: string
  onPointerEnter?: (evento: PointerEvent<HTMLElement>) => void
  onPointerLeave?: (evento: PointerEvent<HTMLElement>) => void
  onPointerDown?: (evento: PointerEvent<HTMLElement>) => void
  onFocus?: (evento: FocusEvent<HTMLElement>) => void
  onBlur?: (evento: FocusEvent<HTMLElement>) => void
  onClick?: (evento: MouseEvent<HTMLElement>) => void
  'aria-describedby'?: string
}

// depois que uma dica fecha, a próxima abre sem esperar (igual ao macOS)
export const aquecimento = { ate: 0 }

export function atribuirRef<T>(ref: Ref<T> | undefined, valor: T | null) {
  if (typeof ref === 'function') ref(valor)
  else if (ref) (ref as { current: T | null }).current = valor
}

export const juntarIds = (...ids: Array<string | undefined>) => ids.filter(Boolean).join(' ') || undefined
