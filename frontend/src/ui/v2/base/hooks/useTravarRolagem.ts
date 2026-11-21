import { useEffect } from 'react'

// várias camadas abertas travam a rolagem uma única vez
const trava = { contagem: 0, overflow: '', preenchimento: '' }

/** trava a rolagem da página e compensa a largura da barra para o layout não pular */
export function useTravarRolagem(ativo = true) {
  useEffect(() => {
    if (!ativo) return
    const raiz = document.documentElement
    if (trava.contagem === 0) {
      const barra = window.innerWidth - raiz.clientWidth
      trava.overflow = raiz.style.overflow
      trava.preenchimento = raiz.style.paddingRight
      if (barra > 0) {
        const atual = Number.parseFloat(getComputedStyle(raiz).paddingRight) || 0
        raiz.style.paddingRight = `${atual + barra}px`
      }
      raiz.style.overflow = 'hidden'
    }
    trava.contagem += 1
    return () => {
      trava.contagem -= 1
      if (trava.contagem === 0) {
        raiz.style.overflow = trava.overflow
        raiz.style.paddingRight = trava.preenchimento
      }
    }
  }, [ativo])
}
