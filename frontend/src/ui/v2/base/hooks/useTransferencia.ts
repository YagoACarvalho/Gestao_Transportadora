import { useEffect, useRef, useState } from 'react'
import {
  baixarComProgresso,
  enviarComProgresso,
  foiCancelado,
  type OpcoesEnvio,
  type OpcoesTransferencia,
  type ProgressoTransferencia,
} from '../utilitarios'

export type StatusUseTransferencia = 'aguardando' | 'transferindo' | 'concluido' | 'erro' | 'cancelado'

export type EstadoTransferencia = ProgressoTransferencia & {
  status: StatusUseTransferencia
  erro?: string
}

const INICIAL: EstadoTransferencia = { status: 'aguardando', transferido: 0, total: 0, percentual: 0, velocidade: 0 }

function mensagemDe(falha: unknown) {
  return falha instanceof Error ? falha.message : 'Falha na transferência'
}

export function useTransferencia() {
  const [estado, setEstado] = useState<EstadoTransferencia>(INICIAL)
  const controleRef = useRef<AbortController | null>(null)

  useEffect(() => () => controleRef.current?.abort(), [])

  function iniciar(total: number) {
    controleRef.current?.abort()
    const controle = new AbortController()
    controleRef.current = controle
    setEstado({ ...INICIAL, status: 'transferindo', total })
    return controle
  }

  function falhou(controle: AbortController, falha: unknown) {
    if (controleRef.current !== controle) return
    setEstado((atual) => ({ ...atual, status: foiCancelado(falha) ? 'cancelado' : 'erro', erro: mensagemDe(falha) }))
  }

  async function enviar(url: string, arquivo: Blob, opcoes: Omit<OpcoesEnvio, 'sinal' | 'onProgresso'> = {}) {
    const controle = iniciar(arquivo.size)
    try {
      const resposta = await enviarComProgresso(url, arquivo, {
        ...opcoes,
        sinal: controle.signal,
        onProgresso: (progresso) => {
          if (controleRef.current === controle) setEstado((atual) => ({ ...atual, ...progresso }))
        },
      })
      if (controleRef.current === controle) {
        setEstado((atual) => ({ ...atual, status: 'concluido', percentual: 100, transferido: atual.total }))
      }
      return resposta
    } catch (falha) {
      falhou(controle, falha)
      return undefined
    }
  }

  async function baixar(url: string, opcoes: Omit<OpcoesTransferencia, 'sinal' | 'onProgresso'> = {}) {
    const controle = iniciar(0)
    try {
      const conteudo = await baixarComProgresso(url, {
        ...opcoes,
        sinal: controle.signal,
        onProgresso: (progresso) => {
          if (controleRef.current === controle) setEstado((atual) => ({ ...atual, ...progresso }))
        },
      })
      if (controleRef.current === controle) {
        setEstado((atual) => ({ ...atual, status: 'concluido', percentual: 100, transferido: conteudo.size, total: conteudo.size }))
      }
      return conteudo
    } catch (falha) {
      falhou(controle, falha)
      return undefined
    }
  }

  function cancelar() {
    controleRef.current?.abort()
  }

  function reiniciar() {
    controleRef.current?.abort()
    controleRef.current = null
    setEstado(INICIAL)
  }

  return { ...estado, enviar, baixar, cancelar, reiniciar }
}
