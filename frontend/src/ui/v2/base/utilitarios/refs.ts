import type { Ref, RefCallback } from 'react'

export function combinarRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (valor) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(valor)
      else if (ref) (ref as { current: T | null }).current = valor
    }
  }
}
