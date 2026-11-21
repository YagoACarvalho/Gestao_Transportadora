export type ProgressoTransferencia = {
  transferido: number
  total: number
  percentual: number
  velocidade: number
}

export type OpcoesTransferencia = {
  onProgresso?: (progresso: ProgressoTransferencia) => void
  sinal?: AbortSignal
  cabecalhos?: Record<string, string>
}

export type OpcoesEnvio = OpcoesTransferencia & {
  metodo?: string
  campo?: string
  dadosExtras?: Record<string, string>
  cru?: boolean
}

export type RespostaEnvio = {
  status: number
  corpo: string
}

export class ErroTransferencia extends Error {
  status?: number

  constructor(mensagem: string, status?: number) {
    super(mensagem)
    this.name = 'ErroTransferencia'
    this.status = status
  }
}

export function foiCancelado(falha: unknown) {
  return falha instanceof DOMException && falha.name === 'AbortError'
}

function medir(inicio: number, transferido: number, total: number): ProgressoTransferencia {
  const segundos = Math.max((performance.now() - inicio) / 1000, 0.001)
  return {
    transferido,
    total,
    percentual: total ? Math.min(100, (transferido / total) * 100) : 0,
    velocidade: transferido / segundos,
  }
}

// XHR porque o fetch ainda não informa o progresso do envio
export function enviarComProgresso(url: string, arquivo: Blob, opcoes: OpcoesEnvio = {}): Promise<RespostaEnvio> {
  const { onProgresso, sinal, cabecalhos, metodo = 'POST', campo = 'arquivo', dadosExtras, cru = false } = opcoes
  return new Promise((resolver, rejeitar) => {
    if (sinal?.aborted) return rejeitar(new DOMException('Envio cancelado', 'AbortError'))
    const requisicao = new XMLHttpRequest()
    const inicio = performance.now()
    requisicao.open(metodo, url)
    for (const [nome, valor] of Object.entries(cabecalhos ?? {})) requisicao.setRequestHeader(nome, valor)

    requisicao.upload.onprogress = (evento) => {
      const total = evento.lengthComputable ? evento.total : arquivo.size
      onProgresso?.(medir(inicio, evento.loaded, total))
    }
    requisicao.onload = () => {
      if (requisicao.status >= 200 && requisicao.status < 300) {
        resolver({ status: requisicao.status, corpo: requisicao.responseText })
      } else {
        rejeitar(new ErroTransferencia(`O servidor respondeu ${requisicao.status}`, requisicao.status))
      }
    }
    requisicao.onerror = () => rejeitar(new ErroTransferencia('Falha de rede durante o envio'))
    requisicao.onabort = () => rejeitar(new DOMException('Envio cancelado', 'AbortError'))
    sinal?.addEventListener('abort', () => requisicao.abort(), { once: true })

    if (cru) {
      requisicao.send(arquivo)
      return
    }
    const formulario = new FormData()
    for (const [nome, valor] of Object.entries(dadosExtras ?? {})) formulario.append(nome, valor)
    formulario.append(campo, arquivo, arquivo instanceof File ? arquivo.name : 'arquivo')
    requisicao.send(formulario)
  })
}

export async function baixarComProgresso(url: string, opcoes: OpcoesTransferencia = {}): Promise<Blob> {
  const { onProgresso, sinal, cabecalhos } = opcoes
  const inicio = performance.now()
  const resposta = await fetch(url, { signal: sinal, headers: cabecalhos })
  if (!resposta.ok) throw new ErroTransferencia(`O servidor respondeu ${resposta.status}`, resposta.status)
  const total = Number(resposta.headers.get('content-length')) || 0
  const tipo = resposta.headers.get('content-type') ?? ''
  if (!resposta.body) return resposta.blob()

  const leitor = resposta.body.getReader()
  const pedacos: Uint8Array<ArrayBuffer>[] = []
  let recebido = 0
  for (;;) {
    const { done, value } = await leitor.read()
    if (done) break
    pedacos.push(value)
    recebido += value.length
    onProgresso?.(medir(inicio, recebido, total || recebido))
  }
  return new Blob(pedacos, { type: tipo })
}

export function salvarArquivo(conteudo: Blob, nome: string) {
  const url = URL.createObjectURL(conteudo)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
