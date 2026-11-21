import { useEffect, useState } from 'react'
import { reduzirAmostras } from '../utilitarios'

export type AmostrasAudio = {
  amostras: number[]
  duracao: number
  carregando: boolean
  erro?: string
}

const VAZIO: AmostrasAudio = { amostras: [], duracao: 0, carregando: false }

export function useAmostrasAudio(src: string | undefined, quantidade = 48): AmostrasAudio {
  const [resultado, setResultado] = useState<AmostrasAudio & { src?: string }>(VAZIO)

  useEffect(() => {
    if (!src) return
    let cancelado = false
    // OfflineAudioContext decodifica sem precisar de gesto do usuário
    const contexto = new OfflineAudioContext(1, 1, 44100)
    fetch(src)
      .then((resposta) => {
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        return resposta.arrayBuffer()
      })
      .then((dados) => contexto.decodeAudioData(dados))
      .then((buffer) => {
        if (cancelado) return
        setResultado({
          src,
          amostras: reduzirAmostras(buffer.getChannelData(0), quantidade),
          duracao: buffer.duration,
          carregando: false,
        })
      })
      .catch(() => {
        if (!cancelado) setResultado({ ...VAZIO, src, erro: 'Não foi possível ler o áudio' })
      })
    return () => {
      cancelado = true
    }
  }, [src, quantidade])

  if (!src) return VAZIO
  if (resultado.src !== src) return { ...VAZIO, carregando: true }
  return resultado
}
