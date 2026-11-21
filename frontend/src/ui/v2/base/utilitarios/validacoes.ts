const digitos = (valor: string) => valor.replace(/\D/g, '')

export function validarCPF(valor: string) {
  const numeros = digitos(valor)
  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false
  const verificador = (tamanho: number) => {
    let soma = 0
    for (let i = 0; i < tamanho; i++) soma += Number(numeros[i]) * (tamanho + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return verificador(9) === Number(numeros[9]) && verificador(10) === Number(numeros[10])
}

export function validarCNPJ(valor: string) {
  const numeros = digitos(valor)
  if (numeros.length !== 14 || /^(\d)\1{13}$/.test(numeros)) return false
  const verificador = (tamanho: number) => {
    const pesos = tamanho === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const soma = pesos.reduce((total, peso, i) => total + peso * Number(numeros[i]), 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  return verificador(12) === Number(numeros[12]) && verificador(13) === Number(numeros[13])
}

export function validarEmail(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())
}

export function validarCEP(valor: string) {
  return digitos(valor).length === 8
}

export function validarTelefoneBR(valor: string) {
  const numeros = digitos(valor)
  if (numeros.length !== 10 && numeros.length !== 11) return false
  const ddd = Number(numeros.slice(0, 2))
  if (ddd < 11 || ddd > 99) return false
  return numeros.length === 10 || numeros[2] === '9'
}

// algoritmo de Luhn
export function validarCartao(valor: string) {
  const numeros = digitos(valor)
  if (numeros.length < 13 || numeros.length > 19) return false
  let soma = 0
  for (let i = 0; i < numeros.length; i++) {
    let numero = Number(numeros[numeros.length - 1 - i])
    if (i % 2 === 1) {
      numero *= 2
      if (numero > 9) numero -= 9
    }
    soma += numero
  }
  return soma % 10 === 0
}

export function validarValidadeCartao(valor: string, hoje = new Date()) {
  const [mes, ano] = valor.split('/').map(Number)
  if (!mes || ano === undefined || Number.isNaN(ano) || mes < 1 || mes > 12) return false
  const fimDoMes = new Date(2000 + ano, mes, 0, 23, 59, 59)
  return fimDoMes >= hoje
}

export function validarData(valor: string) {
  const [dia, mes, ano] = valor.split('/').map(Number)
  if (!dia || !mes || !ano || ano < 1900 || ano > 2200) return false
  const data = new Date(ano, mes - 1, dia)
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia
}

export function validarHora(valor: string) {
  const [horas, minutos] = valor.split(':').map(Number)
  return valor.length === 5 && horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59
}

export function validarURL(valor: string) {
  try {
    const endereco = new URL(/^[a-z]+:\/\//i.test(valor) ? valor : `https://${valor}`)
    return endereco.hostname.includes('.') && !endereco.hostname.endsWith('.')
  } catch {
    return false
  }
}

export function validarPlaca(valor: string) {
  const limpa = valor.replace(/[^a-z0-9]/gi, '').toUpperCase()
  return /^[A-Z]{3}\d{4}$/.test(limpa) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(limpa)
}

export type BandeiraCartao = 'elo' | 'hipercard' | 'amex' | 'diners' | 'discover' | 'jcb' | 'mastercard' | 'visa'

const BANDEIRAS: Array<[BandeiraCartao, RegExp]> = [
  ['elo', /^(4011(78|79)|43(1274|8935)|45(1416|7393|763[12])|50(4175|6699|67[0-7]\d|9000)|627780|63(6297|6368)|650(0[3-5]|4[0-9]|5[0-3]|9[2-7]|541|700|720|901)|651652|655000|655021)/],
  ['hipercard', /^(606282|3841)/],
  ['amex', /^3[47]/],
  ['diners', /^3(0[0-5]|[68])/],
  ['discover', /^6(011|5)/],
  ['jcb', /^35(2[89]|[3-8])/],
  ['mastercard', /^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/],
  ['visa', /^4/],
]

export function detectarBandeiraCartao(valor: string): BandeiraCartao | undefined {
  const numeros = digitos(valor)
  return BANDEIRAS.find(([, padrao]) => padrao.test(numeros))?.[0]
}

export type ForcaSenha = {
  pontos: 0 | 1 | 2 | 3 | 4
  rotulo: string
}

const ROTULOS_FORCA = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte']

export function medirForcaSenha(senha: string): ForcaSenha {
  if (!senha) return { pontos: 0, rotulo: ROTULOS_FORCA[0] }
  let pontos = 0
  if (senha.length >= 8) pontos++
  if (senha.length >= 12) pontos++
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++
  if (/\d/.test(senha)) pontos++
  if (/[^a-zA-Z0-9]/.test(senha)) pontos++
  const final = Math.min(4, Math.max(0, pontos - 1)) as ForcaSenha['pontos']
  return { pontos: final, rotulo: ROTULOS_FORCA[final] }
}

export type Regra = (valor: string, valores?: Readonly<Record<string, string>>) => string | undefined

const vazio = (valor: string) => !valor.trim()

export const regras = {
  obrigatorio:
    (mensagem = 'Preencha este campo'): Regra =>
    (valor) =>
      vazio(valor) ? mensagem : undefined,
  minimo:
    (tamanho: number, mensagem?: string): Regra =>
    (valor) =>
      vazio(valor) || valor.length >= tamanho ? undefined : (mensagem ?? `Use pelo menos ${tamanho} caracteres`),
  maximo:
    (tamanho: number, mensagem?: string): Regra =>
    (valor) =>
      valor.length <= tamanho ? undefined : (mensagem ?? `Use no máximo ${tamanho} caracteres`),
  padrao:
    (expressao: RegExp, mensagem: string): Regra =>
    (valor) =>
      vazio(valor) || expressao.test(valor) ? undefined : mensagem,
  email:
    (mensagem = 'E-mail inválido'): Regra =>
    (valor) =>
      vazio(valor) || validarEmail(valor) ? undefined : mensagem,
  url:
    (mensagem = 'Endereço inválido'): Regra =>
    (valor) =>
      vazio(valor) || validarURL(valor) ? undefined : mensagem,
  cpf:
    (mensagem = 'CPF inválido'): Regra =>
    (valor) =>
      vazio(valor) || validarCPF(valor) ? undefined : mensagem,
  cnpj:
    (mensagem = 'CNPJ inválido'): Regra =>
    (valor) =>
      vazio(valor) || validarCNPJ(valor) ? undefined : mensagem,
  telefone:
    (mensagem = 'Telefone inválido'): Regra =>
    (valor) =>
      vazio(valor) || validarTelefoneBR(valor) ? undefined : mensagem,
  cartao:
    (mensagem = 'Número de cartão inválido'): Regra =>
    (valor) =>
      vazio(valor) || validarCartao(valor) ? undefined : mensagem,
  data:
    (mensagem = 'Data inválida'): Regra =>
    (valor) =>
      vazio(valor) || validarData(valor) ? undefined : mensagem,
  numeroEntre:
    (minimo: number, maximo: number, mensagem?: string): Regra =>
    (valor) => {
      if (vazio(valor)) return undefined
      const numero = Number(valor.replace(/\./g, '').replace(',', '.'))
      return numero >= minimo && numero <= maximo ? undefined : (mensagem ?? `Use um valor entre ${minimo} e ${maximo}`)
    },
  igual:
    (obterOutro: () => string, mensagem = 'Os valores não conferem'): Regra =>
    (valor) =>
      vazio(valor) || valor === obterOutro() ? undefined : mensagem,
  igualAoCampo:
    (campo: string, mensagem = 'Os valores não conferem'): Regra =>
    (valor, valores) =>
      vazio(valor) || !valores || valor === valores[campo] ? undefined : mensagem,
  senhaForte:
    (mensagem = 'Use uma senha mais forte'): Regra =>
    (valor) =>
      vazio(valor) || medirForcaSenha(valor).pontos >= 3 ? undefined : mensagem,
}

export function validarValor(valor: string, lista: readonly Regra[] = [], valores?: Readonly<Record<string, string>>) {
  for (const regra of lista) {
    const erro = regra(valor, valores)
    if (erro) return erro
  }
  return undefined
}
