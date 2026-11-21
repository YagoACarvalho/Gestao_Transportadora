import { useLayoutEffect, useState, type RefObject } from 'react'

export type LadoFlutuante = 'baixo' | 'cima' | 'direita' | 'esquerda'
export type AlinhamentoFlutuante = 'inicio' | 'centro' | 'fim'

export type AncoraFlutuante = {
  getBoundingClientRect: () => DOMRect
}

export type OpcoesPosicaoFlutuante = {
  aberto: boolean
  lado?: LadoFlutuante
  alinhamento?: AlinhamentoFlutuante
  deslocamento?: number
  margem?: number
}

export type PosicaoFlutuante = {
  topo: number
  esquerda: number
  lado: LadoFlutuante
  alturaDisponivel: number
  larguraAncora: number
  /** centro da âncora medido a partir do canto do painel (x em cima/baixo, y nas laterais) */
  centroAncora: number
}

const OPOSTO: Record<LadoFlutuante, LadoFlutuante> = {
  baixo: 'cima',
  cima: 'baixo',
  direita: 'esquerda',
  esquerda: 'direita',
}

const ALTURA_MINIMA = 140

export function usePosicaoFlutuante(
  ancora: RefObject<AncoraFlutuante | null>,
  painel: RefObject<HTMLElement | null>,
  { aberto, lado = 'baixo', alinhamento = 'inicio', deslocamento = 8, margem = 8 }: OpcoesPosicaoFlutuante,
) {
  const [posicao, setPosicao] = useState<PosicaoFlutuante | null>(null)

  useLayoutEffect(() => {
    if (!aberto) return

    function calcular() {
      const elemento = painel.current
      const alvo = ancora.current?.getBoundingClientRect()
      if (!elemento || !alvo) return
      const larguraTela = window.innerWidth
      const alturaTela = window.innerHeight
      const largura = elemento.offsetWidth
      // scrollHeight é a altura natural, mesmo quando o painel já está limitado por max-height
      const altura = elemento.scrollHeight

      const espaco: Record<LadoFlutuante, number> = {
        baixo: alturaTela - alvo.bottom - deslocamento - margem,
        cima: alvo.top - deslocamento - margem,
        direita: larguraTela - alvo.right - deslocamento - margem,
        esquerda: alvo.left - deslocamento - margem,
      }
      const vertical = lado === 'baixo' || lado === 'cima'
      const necessario = vertical ? altura : largura
      const ladoFinal =
        espaco[lado] < necessario && espaco[OPOSTO[lado]] > espaco[lado] ? OPOSTO[lado] : lado

      const alturaDisponivel = vertical
        ? Math.max(ALTURA_MINIMA, espaco[ladoFinal])
        : alturaTela - margem * 2
      const alturaFinal = Math.min(altura, alturaDisponivel)

      let topo: number
      let esquerda: number
      if (ladoFinal === 'baixo' || ladoFinal === 'cima') {
        topo = ladoFinal === 'baixo' ? alvo.bottom + deslocamento : alvo.top - deslocamento - alturaFinal
        esquerda =
          alinhamento === 'inicio'
            ? alvo.left
            : alinhamento === 'fim'
              ? alvo.right - largura
              : alvo.left + (alvo.width - largura) / 2
      } else {
        esquerda = ladoFinal === 'direita' ? alvo.right + deslocamento : alvo.left - deslocamento - largura
        topo =
          alinhamento === 'inicio'
            ? alvo.top
            : alinhamento === 'fim'
              ? alvo.bottom - alturaFinal
              : alvo.top + (alvo.height - alturaFinal) / 2
      }

      esquerda = Math.round(Math.min(Math.max(esquerda, margem), larguraTela - margem - largura))
      topo = Math.round(Math.min(Math.max(topo, margem), alturaTela - margem - alturaFinal))

      const centroAncora = Math.round(
        ladoFinal === 'baixo' || ladoFinal === 'cima' ? alvo.left + alvo.width / 2 - esquerda : alvo.top + alvo.height / 2 - topo,
      )

      setPosicao((anterior) =>
        anterior &&
        anterior.topo === topo &&
        anterior.esquerda === esquerda &&
        anterior.lado === ladoFinal &&
        anterior.alturaDisponivel === alturaDisponivel &&
        anterior.larguraAncora === alvo.width &&
        anterior.centroAncora === centroAncora
          ? anterior
          : { topo, esquerda, lado: ladoFinal, alturaDisponivel, larguraAncora: alvo.width, centroAncora },
      )
    }

    calcular()
    const observador = new ResizeObserver(calcular)
    if (painel.current) observador.observe(painel.current)
    window.addEventListener('resize', calcular)
    window.addEventListener('scroll', calcular, true)
    return () => {
      observador.disconnect()
      window.removeEventListener('resize', calcular)
      window.removeEventListener('scroll', calcular, true)
    }
  }, [aberto, lado, alinhamento, deslocamento, margem, ancora, painel])

  return aberto ? posicao : null
}
