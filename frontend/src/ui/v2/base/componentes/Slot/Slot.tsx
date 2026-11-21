import { cloneElement, useMemo, type CSSProperties, type ReactElement, type Ref } from 'react'
import { combinarRefs, juntarClasses } from '../../utilitarios'

export type PropsSlot = {
  filho: ReactElement<Record<string, unknown>>
  propriedades: Record<string, unknown>
  mesclar?: boolean
}

const HANDLER = /^on[A-Z]/

function mesclarPropriedades(doFilho: Record<string, unknown>, injetadas: Record<string, unknown>) {
  const resultado: Record<string, unknown> = {}
  for (const [chave, valor] of Object.entries(injetadas)) {
    if (valor === undefined || chave === 'ref') continue
    const original = doFilho[chave]
    if (chave === 'className' && typeof valor === 'string' && typeof original === 'string') {
      resultado.className = juntarClasses(original, valor)
    } else if (chave === 'style' && typeof valor === 'object' && typeof original === 'object' && valor && original) {
      resultado.style = { ...(original as CSSProperties), ...(valor as CSSProperties) }
    } else if (HANDLER.test(chave) && typeof valor === 'function' && typeof original === 'function') {
      resultado[chave] = (...argumentos: unknown[]) => {
        original(...argumentos)
        return valor(...argumentos)
      }
    } else {
      resultado[chave] = valor
    }
  }
  return resultado
}

// repassa props para o elemento filho sem criar outro nó no DOM (gatilhos de menu, alvos de contexto)
export function Slot({ filho, propriedades, mesclar = false }: PropsSlot) {
  const refFilho = filho.props.ref as Ref<unknown> | undefined
  const refInjetado = propriedades.ref as Ref<unknown> | undefined
  const refCombinado = useMemo(
    () => (refFilho && refInjetado && refFilho !== refInjetado ? combinarRefs(refFilho, refInjetado) : refInjetado),
    [refFilho, refInjetado],
  )

  if (!mesclar) return cloneElement(filho, propriedades)
  const mescladas = mesclarPropriedades(filho.props, propriedades)
  if (refInjetado !== undefined) mescladas.ref = refCombinado
  return cloneElement(filho, mescladas)
}
