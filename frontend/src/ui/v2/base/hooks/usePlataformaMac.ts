import { useSyncExternalStore } from 'react'

const assinar = () => () => undefined

export function usePlataformaMac() {
  return useSyncExternalStore(
    assinar,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  )
}
