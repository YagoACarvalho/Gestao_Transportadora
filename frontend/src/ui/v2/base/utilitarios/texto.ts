import { CORES, type Cor } from '../tema'

export function normalizarTexto(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export const escaparRegex = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export type Trecho = { texto: string; destaque: boolean }

export function encontrarTrechos(texto: string, termo: string): Trecho[] {
  const busca = normalizarTexto(termo.trim())
  if (!busca) return [{ texto, destaque: false }]

  // mapeia cada caractere normalizado de volta ao original para destacar "João" ao buscar "joao"
  const caracteres = Array.from(texto)
  const origem: number[] = []
  let normalizado = ''
  caracteres.forEach((caractere, indice) => {
    const convertido = normalizarTexto(caractere)
    normalizado += convertido
    for (let i = 0; i < convertido.length; i++) origem.push(indice)
  })

  const trechos: Trecho[] = []
  let cursor = 0
  let posicao = normalizado.indexOf(busca)
  while (posicao !== -1) {
    const inicio = origem[posicao]
    const fim = origem[posicao + busca.length - 1] + 1
    if (inicio > cursor) trechos.push({ texto: caracteres.slice(cursor, inicio).join(''), destaque: false })
    trechos.push({ texto: caracteres.slice(inicio, fim).join(''), destaque: true })
    cursor = fim
    posicao = normalizado.indexOf(busca, posicao + busca.length)
  }
  if (cursor < caracteres.length) trechos.push({ texto: caracteres.slice(cursor).join(''), destaque: false })
  return trechos
}

export function obterIniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return '?'
  const primeira = Array.from(partes[0])[0] ?? ''
  const ultima = partes.length > 1 ? (Array.from(partes[partes.length - 1])[0] ?? '') : ''
  return (primeira + ultima).toUpperCase()
}

const CORES_AUTOMATICAS = CORES.filter((cor) => cor !== 'cinza')

export function escolherCor(semente: string): Cor {
  let soma = 0
  for (const caractere of semente) soma = (soma * 31 + caractere.charCodeAt(0)) >>> 0
  return CORES_AUTOMATICAS[soma % CORES_AUTOMATICAS.length]
}
