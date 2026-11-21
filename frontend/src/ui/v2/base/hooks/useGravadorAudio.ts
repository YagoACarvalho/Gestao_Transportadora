import { useEffect, useRef, useState } from 'react'
import { reduzirAmostras } from '../utilitarios'

export type EstadoGravacao = 'ocioso' | 'pedindo' | 'gravando' | 'pausado' | 'gravado' | 'erro'

export type AudioGravado = {
  blob: Blob
  url: string
  tipo: string
  duracao: number
  amostras: number[]
}

export type OpcoesGravadorAudio = {
  janela?: number
  amostrasFinais?: number
  intervaloMs?: number
}

function mensagemDeErro(falha: unknown) {
  if (falha instanceof DOMException) {
    if (falha.name === 'NotAllowedError') return 'Permissão do microfone negada'
    if (falha.name === 'NotFoundError') return 'Nenhum microfone encontrado'
    if (falha.name === 'NotSupportedError') return 'Gravação de áudio não suportada neste navegador'
  }
  return 'Não foi possível acessar o microfone'
}

export function useGravadorAudio({ janela = 36, amostrasFinais = 48, intervaloMs = 80 }: OpcoesGravadorAudio = {}) {
  const [estado, setEstado] = useState<EstadoGravacao>('ocioso')
  const [duracao, setDuracao] = useState(0)
  const [niveis, setNiveis] = useState<number[]>([])
  const [audio, setAudio] = useState<AudioGravado>()
  const [erro, setErro] = useState<string>()

  const gravadorRef = useRef<MediaRecorder | null>(null)
  const fluxoRef = useRef<MediaStream | null>(null)
  const contextoRef = useRef<AudioContext | null>(null)
  const analisadorRef = useRef<AnalyserNode | null>(null)
  const quadroRef = useRef(0)
  const historicoRef = useRef<number[]>([])
  const pedacosRef = useRef<Blob[]>([])
  const acumuladoRef = useRef(0)
  const inicioTrechoRef = useRef(0)
  const ultimaLeituraRef = useRef(0)
  const ocupadoRef = useRef(false)

  function liberarRecursos() {
    cancelAnimationFrame(quadroRef.current)
    fluxoRef.current?.getTracks().forEach((trilha) => trilha.stop())
    fluxoRef.current = null
    void contextoRef.current?.close()
    contextoRef.current = null
    analisadorRef.current = null
  }

  // o requestAnimationFrame entrega o horário na mesma base do performance.now
  function medir(agora: number) {
    const analisador = analisadorRef.current
    if (!analisador) return
    if (agora - ultimaLeituraRef.current >= intervaloMs) {
      ultimaLeituraRef.current = agora
      const dados = new Uint8Array(analisador.fftSize)
      analisador.getByteTimeDomainData(dados)
      let soma = 0
      for (const valor of dados) {
        const normalizado = (valor - 128) / 128
        soma += normalizado * normalizado
      }
      // RMS da fala fica perto de 0,1; multiplicar deixa a onda legível
      const nivel = Math.min(1, Math.sqrt(soma / dados.length) * 4)
      historicoRef.current.push(nivel)
      setNiveis(historicoRef.current.slice(-janela))
      setDuracao((acumuladoRef.current + agora - inicioTrechoRef.current) / 1000)
    }
    quadroRef.current = requestAnimationFrame(medir)
  }

  async function iniciar() {
    if (ocupadoRef.current) return
    ocupadoRef.current = true
    setErro(undefined)
    setAudio(undefined)
    setEstado('pedindo')
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new DOMException('sem suporte', 'NotSupportedError')
      }
      const fluxo = await navigator.mediaDevices.getUserMedia({ audio: true })
      const contexto = new AudioContext()
      const analisador = contexto.createAnalyser()
      analisador.fftSize = 1024
      contexto.createMediaStreamSource(fluxo).connect(analisador)
      fluxoRef.current = fluxo
      contextoRef.current = contexto
      analisadorRef.current = analisador

      const gravador = new MediaRecorder(fluxo)
      pedacosRef.current = []
      historicoRef.current = []
      gravador.ondataavailable = (evento) => {
        if (evento.data.size) pedacosRef.current.push(evento.data)
      }
      gravador.onstop = () => {
        const tipo = gravador.mimeType || 'audio/webm'
        const blob = new Blob(pedacosRef.current, { type: tipo })
        setAudio({
          blob,
          tipo,
          url: URL.createObjectURL(blob),
          duracao: acumuladoRef.current / 1000,
          amostras: reduzirAmostras(historicoRef.current, amostrasFinais),
        })
        setEstado('gravado')
        ocupadoRef.current = false
      }
      gravadorRef.current = gravador

      acumuladoRef.current = 0
      inicioTrechoRef.current = performance.now()
      ultimaLeituraRef.current = 0
      setDuracao(0)
      setNiveis([])
      gravador.start(250)
      setEstado('gravando')
      quadroRef.current = requestAnimationFrame(medir)
    } catch (falha) {
      liberarRecursos()
      ocupadoRef.current = false
      setErro(mensagemDeErro(falha))
      setEstado('erro')
    }
  }

  function pausar() {
    const gravador = gravadorRef.current
    if (gravador?.state !== 'recording') return
    gravador.pause()
    acumuladoRef.current += performance.now() - inicioTrechoRef.current
    cancelAnimationFrame(quadroRef.current)
    setDuracao(acumuladoRef.current / 1000)
    setEstado('pausado')
  }

  function retomar() {
    const gravador = gravadorRef.current
    if (gravador?.state !== 'paused') return
    gravador.resume()
    inicioTrechoRef.current = performance.now()
    setEstado('gravando')
    quadroRef.current = requestAnimationFrame(medir)
  }

  function parar() {
    const gravador = gravadorRef.current
    if (!gravador || gravador.state === 'inactive') return
    if (gravador.state === 'recording') acumuladoRef.current += performance.now() - inicioTrechoRef.current
    gravador.stop()
    liberarRecursos()
  }

  // volta ao início sem revogar a URL, para quem recebeu o áudio continuar tocando
  function reiniciar() {
    const gravador = gravadorRef.current
    if (gravador && gravador.state !== 'inactive') {
      gravador.onstop = null
      gravador.stop()
    }
    gravadorRef.current = null
    liberarRecursos()
    ocupadoRef.current = false
    acumuladoRef.current = 0
    historicoRef.current = []
    setAudio(undefined)
    setDuracao(0)
    setNiveis([])
    setErro(undefined)
    setEstado('ocioso')
  }

  function descartar() {
    if (audio) URL.revokeObjectURL(audio.url)
    reiniciar()
  }

  useEffect(
    () => () => {
      const gravador = gravadorRef.current
      if (gravador && gravador.state !== 'inactive') {
        gravador.onstop = null
        gravador.stop()
      }
      cancelAnimationFrame(quadroRef.current)
      fluxoRef.current?.getTracks().forEach((trilha) => trilha.stop())
      void contextoRef.current?.close()
    },
    [],
  )

  return { estado, duracao, niveis, audio, erro, iniciar, pausar, retomar, parar, reiniciar, descartar }
}
