export type Periodo = { inicio: Date | null; fim: Date | null }
export type FormatoHorario = '24h' | '12h'

const DIA = 86_400_000

export const inicioDoDia = (data: Date) => new Date(data.getFullYear(), data.getMonth(), data.getDate())

/** dois "sem data" contam como iguais */
export const mesmoDia = (a: Date | null | undefined, b: Date | null | undefined) =>
  a == null || b == null
    ? a == b
    : a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const mesmoMes = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

/** -1, 0 ou 1 comparando só o dia (ignora hora) */
export const compararDias = (a: Date, b: Date) => Math.sign(inicioDoDia(a).getTime() - inicioDoDia(b).getTime())

export const adicionarDias = (data: Date, dias: number) => new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias, data.getHours(), data.getMinutes())

/** soma meses sem pular mês: 31/01 + 1 mês = 28 ou 29/02 */
export function adicionarMeses(data: Date, meses: number) {
  const alvo = new Date(data.getFullYear(), data.getMonth() + meses, 1, data.getHours(), data.getMinutes())
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate()
  alvo.setDate(Math.min(data.getDate(), ultimoDia))
  return alvo
}

export const inicioDoMes = (data: Date) => new Date(data.getFullYear(), data.getMonth(), 1)

export const diasEntre = (a: Date, b: Date) => Math.round((inicioDoDia(b).getTime() - inicioDoDia(a).getTime()) / DIA)

export function estaEntre(data: Date, inicio: Date | null, fim: Date | null) {
  if (!inicio || !fim) return false
  const [menor, maior] = compararDias(inicio, fim) <= 0 ? [inicio, fim] : [fim, inicio]
  return compararDias(data, menor) >= 0 && compararDias(data, maior) <= 0
}

/** 6 semanas completas do mês, começando no dia da semana escolhido (0 = domingo) */
export function semanasDoMes(ano: number, mes: number, inicioSemana = 0): Date[][] {
  const primeiro = new Date(ano, mes, 1)
  const recuo = (primeiro.getDay() - inicioSemana + 7) % 7
  const inicio = new Date(ano, mes, 1 - recuo)
  return Array.from({ length: 6 }, (_, semana) =>
    Array.from({ length: 7 }, (_, dia) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + semana * 7 + dia)),
  )
}

export function nomesDosDias(inicioSemana = 0, formato: 'estreito' | 'curto' | 'longo' = 'curto', idioma = 'pt-BR') {
  const formatador = new Intl.DateTimeFormat(idioma, { weekday: formato === 'estreito' ? 'narrow' : formato === 'curto' ? 'short' : 'long' })
  // 4/1/1970 caiu num domingo
  return Array.from({ length: 7 }, (_, indice) =>
    formatador.format(new Date(1970, 0, 4 + ((indice + inicioSemana) % 7))).replace('.', ''),
  )
}

export const nomeDoMes = (mes: number, idioma = 'pt-BR', formato: 'long' | 'short' = 'long') =>
  new Intl.DateTimeFormat(idioma, { month: formato }).format(new Date(2000, mes, 1)).replace('.', '')

export type EstiloData = 'curta' | 'media' | 'longa' | 'extensa' | 'numerica'

const OPCOES_ESTILO: Record<EstiloData, Intl.DateTimeFormatOptions> = {
  numerica: { day: '2-digit', month: '2-digit', year: 'numeric' },
  curta: { day: 'numeric', month: 'short' },
  media: { day: 'numeric', month: 'short', year: 'numeric' },
  longa: { day: 'numeric', month: 'long', year: 'numeric' },
  extensa: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
}

export function formatarData(data: Date | null | undefined, estilo: EstiloData = 'media', idioma = 'pt-BR') {
  if (!data) return ''
  const texto = new Intl.DateTimeFormat(idioma, OPCOES_ESTILO[estilo]).format(data).replace(/\./g, '')
  // "21 set 2027" no curto; por extenso mantém "21 de setembro de 2027"
  return estilo === 'curta' || estilo === 'media' ? texto.replace(/ de /g, ' ') : texto
}

/** "Hoje", "Amanhã", "Ontem" ou a data curta */
export function formatarDataRelativa(data: Date | null | undefined, hoje = new Date(), estilo: EstiloData = 'media') {
  if (!data) return ''
  const diferenca = diasEntre(hoje, data)
  if (diferenca === 0) return 'Hoje'
  if (diferenca === 1) return 'Amanhã'
  if (diferenca === -1) return 'Ontem'
  return formatarData(data, estilo)
}

export function formatarPeriodo({ inicio, fim }: Periodo, idioma = 'pt-BR') {
  if (!inicio) return ''
  if (!fim || mesmoDia(inicio, fim)) return formatarData(inicio, 'media', idioma)
  const [a, b] = compararDias(inicio, fim) <= 0 ? [inicio, fim] : [fim, inicio]
  const mesmoAno = a.getFullYear() === b.getFullYear()
  if (mesmoAno && a.getMonth() === b.getMonth()) return `${a.getDate()} – ${formatarData(b, 'media', idioma)}`
  return `${formatarData(a, mesmoAno ? 'curta' : 'media', idioma)} – ${formatarData(b, 'media', idioma)}`
}

/** lê "dd/mm/aaaa" e devolve null se a data não existir */
export function analisarData(texto: string) {
  const partes = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!partes) return null
  const [dia, mes, ano] = [Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])]
  const data = new Date(ano, mes, dia)
  return data.getFullYear() === ano && data.getMonth() === mes && data.getDate() === dia ? data : null
}

export const paraIso = (data: Date) =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`

export const paraMinutos = (horario: string) => {
  const [horas, minutos] = horario.split(':').map(Number)
  return horas * 60 + (minutos || 0)
}

export const deMinutos = (total: number) =>
  `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`

export function gerarHorarios(inicio = '00:00', fim = '23:30', intervalo = 30) {
  const lista: string[] = []
  for (let minuto = paraMinutos(inicio); minuto <= paraMinutos(fim); minuto += intervalo) lista.push(deMinutos(minuto))
  return lista
}

export function formatarHorario(horario: string, formato: FormatoHorario = '24h') {
  if (formato === '24h') return horario
  const [horas, minutos] = horario.split(':').map(Number)
  return `${horas % 12 || 12}:${String(minutos).padStart(2, '0')} ${horas < 12 ? 'AM' : 'PM'}`
}

export const aplicarHorario = (data: Date, horario: string) => {
  const [horas, minutos] = horario.split(':').map(Number)
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), horas, minutos)
}

export const horarioDe = (data: Date) => `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`

const UNIDADES = [
  { segundos: 86_400, curta: 'd', singular: 'dia', plural: 'dias' },
  { segundos: 3_600, curta: 'h', singular: 'hora', plural: 'horas' },
  { segundos: 60, curta: 'min', singular: 'minuto', plural: 'minutos' },
  { segundos: 1, curta: 's', singular: 'segundo', plural: 'segundos' },
]

/** 5400 -> "1 h 30 min" (curto) ou "1 hora e 30 minutos" */
export function formatarDuracaoExtensa(totalSegundos: number, curto = true) {
  let resto = Math.max(0, Math.round(totalSegundos))
  const partes: string[] = []
  for (const unidade of UNIDADES) {
    const quantidade = Math.floor(resto / unidade.segundos)
    resto -= quantidade * unidade.segundos
    if (quantidade) partes.push(curto ? `${quantidade} ${unidade.curta}` : `${quantidade} ${quantidade === 1 ? unidade.singular : unidade.plural}`)
  }
  if (!partes.length) return curto ? '0 min' : '0 minutos'
  if (curto) return partes.join(' ')
  return partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`
}
