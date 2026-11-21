import { useEffect, useEffectEvent, type RefObject } from 'react'
import { analisarAtalho, ehMac, eventoConfereComPasso } from '../utilitarios'

export type OpcoesAtalho = {
  ativo?: boolean
  emCampos?: boolean
  prevenir?: boolean
  alvo?: RefObject<HTMLElement | null>
  intervaloSequencia?: number
}

const CAMPOS = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

/** registra um ou mais atalhos de teclado; aceita "mod+k", "shift+?" e sequências como "g d" */
export function useAtalho(
  combinacao: string | readonly string[],
  acao: (evento: KeyboardEvent, combinacao: string) => void,
  { ativo = true, emCampos = false, prevenir = true, alvo, intervaloSequencia = 1000 }: OpcoesAtalho = {},
) {
  const lista = typeof combinacao === 'string' ? [combinacao] : combinacao
  const chave = lista.join('|')
  const executar = useEffectEvent(acao)

  useEffect(() => {
    if (!ativo) return
    const atalhos = chave.split('|').map((texto) => ({ texto, passos: analisarAtalho(texto) }))
    const progresso = new Map<string, { indice: number; ate: number }>()
    const destino: HTMLElement | Window = alvo?.current ?? window

    function aoTeclar(evento: Event) {
      const tecla = evento as KeyboardEvent
      if (tecla.isComposing || tecla.defaultPrevented) return
      const mac = ehMac()
      const emCampo = (tecla.target as HTMLElement | null)?.closest?.(CAMPOS)
      for (const { texto, passos } of atalhos) {
        const estado = progresso.get(texto)
        const indice = estado && estado.ate > Date.now() ? estado.indice : 0
        const passo = passos[indice]
        // atalho de uma tecla só não pode disparar enquanto a pessoa digita
        const temModificador = passo.mod || passo.ctrl || passo.meta || passo.alt
        if (emCampo && !emCampos && !temModificador) continue
        if (!eventoConfereComPasso(tecla, passo, mac)) {
          if (indice > 0) progresso.delete(texto)
          continue
        }
        if (indice < passos.length - 1) {
          progresso.set(texto, { indice: indice + 1, ate: Date.now() + intervaloSequencia })
          continue
        }
        progresso.delete(texto)
        if (prevenir) tecla.preventDefault()
        executar(tecla, texto)
        return
      }
    }

    destino.addEventListener('keydown', aoTeclar)
    return () => destino.removeEventListener('keydown', aoTeclar)
  }, [chave, ativo, emCampos, prevenir, alvo, intervaloSequencia])
}
