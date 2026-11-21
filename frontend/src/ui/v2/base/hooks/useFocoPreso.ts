import { useEffect, type RefObject } from 'react'

const FOCAVEIS =
  'a[href], button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"]), [contenteditable=""], [contenteditable="true"]'

function listarFocaveis(raiz: HTMLElement) {
  return Array.from(raiz.querySelectorAll<HTMLElement>(FOCAVEIS)).filter(
    (elemento) => !elemento.hasAttribute('inert') && elemento.getClientRects().length > 0,
  )
}

/** mantém o Tab dentro do contêiner, foca o primeiro item ao ativar e devolve o foco ao desativar */
export function useFocoPreso(ref: RefObject<HTMLElement | null>, ativo = true) {
  useEffect(() => {
    const raiz = ref.current
    if (!ativo || !raiz) return
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null

    if (!raiz.contains(document.activeElement)) {
      const alvo = raiz.querySelector<HTMLElement>('[data-autofocus], [autofocus]') ?? listarFocaveis(raiz)[0]
      if (alvo) alvo.focus({ preventScroll: true })
      else {
        if (!raiz.hasAttribute('tabindex')) raiz.tabIndex = -1
        raiz.focus({ preventScroll: true })
      }
    }

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== 'Tab' || !raiz) return
      const itens = listarFocaveis(raiz)
      if (itens.length === 0) {
        evento.preventDefault()
        return
      }
      const primeiro = itens[0]
      const ultimo = itens[itens.length - 1]
      const atual = document.activeElement
      if (evento.shiftKey && (atual === primeiro || !raiz.contains(atual))) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && (atual === ultimo || !raiz.contains(atual))) {
        evento.preventDefault()
        primeiro.focus()
      }
    }

    function aoFocarFora(evento: FocusEvent) {
      if (raiz && evento.target instanceof Node && !raiz.contains(evento.target)) {
        const itens = listarFocaveis(raiz)
        ;(itens[0] ?? raiz).focus({ preventScroll: true })
      }
    }

    document.addEventListener('keydown', aoTeclar)
    document.addEventListener('focusin', aoFocarFora)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.removeEventListener('focusin', aoFocarFora)
      if (anterior?.isConnected) anterior.focus({ preventScroll: true })
    }
  }, [ref, ativo])
}
