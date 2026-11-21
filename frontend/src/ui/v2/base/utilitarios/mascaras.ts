import {
  detectarBandeiraCartao,
  validarCEP,
  validarCNPJ,
  validarCPF,
  validarCartao,
  validarData,
  validarHora,
  validarPlaca,
  validarTelefoneBR,
  validarValidadeCartao,
} from './validacoes'

export type ConfigMascara = {
  formatar: (valor: string) => string
  limpar?: (valor: string) => string
  validar?: (bruto: string, formatado: string) => string | undefined
  modoTeclado?: 'numeric' | 'decimal' | 'text' | 'tel'
  placeholder?: string
}

export type NomeMascara =
  | 'cpf'
  | 'cnpj'
  | 'cpfCnpj'
  | 'cep'
  | 'telefone'
  | 'data'
  | 'hora'
  | 'dataHora'
  | 'cartao'
  | 'validadeCartao'
  | 'cvv'
  | 'placa'
  | 'rg'
  | 'pis'
  | 'numero'
  | 'decimal'
  | 'moeda'
  | 'porcentagem'

export type PadraoMascara = string | readonly string[]
export type Mascara = NomeMascara | PadraoMascara | ConfigMascara

// 9 = dígito, A = letra, * = letra ou dígito; o resto é literal
const TOKENS: Record<string, RegExp> = { '9': /\d/, A: /[a-z]/i, '*': /[a-z0-9]/i }

export const somenteDigitos = (valor: string) => valor.replace(/\D/g, '')
export const somenteAlfanumericos = (valor: string) => valor.replace(/[^a-z0-9]/gi, '')

const capacidade = (padrao: string) => [...padrao].filter((simbolo) => simbolo in TOKENS).length

export function aplicarPadrao(valor: string, padrao: PadraoMascara, maiusculas = false) {
  const lista: readonly string[] = typeof padrao === 'string' ? [padrao] : padrao
  const soNumeros = lista.every((item) => [...item].every((simbolo) => !(simbolo in TOKENS) || simbolo === '9'))
  const brutos = soNumeros ? somenteDigitos(valor) : somenteAlfanumericos(valor)
  // com vários padrões, usa o primeiro que comporta o que foi digitado (fixo ou celular, CPF ou CNPJ)
  const escolhido = lista.find((item) => capacidade(item) >= brutos.length) ?? lista[lista.length - 1]
  let resultado = ''
  let indice = 0
  for (const simbolo of escolhido) {
    if (indice >= brutos.length) break
    const token = TOKENS[simbolo]
    if (!token) {
      resultado += simbolo
      continue
    }
    while (indice < brutos.length && !token.test(brutos[indice])) indice++
    if (indice >= brutos.length) break
    resultado += maiusculas ? brutos[indice].toUpperCase() : brutos[indice]
    indice++
  }
  return resultado
}

export function formatarDecimal(valor: string, casas = 2) {
  const limpo = valor.replace(/[^\d,]/g, '')
  const [inteiro = '', ...resto] = limpo.split(',')
  const decimais = resto.join('').slice(0, casas)
  const inteiroFormatado = inteiro.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return limpo.includes(',') ? `${inteiroFormatado || '0'},${decimais}` : inteiroFormatado
}

export function formatarCentavos(valor: string, locale = 'pt-BR') {
  const numeros = somenteDigitos(valor).replace(/^0+(?=\d)/, '').slice(0, 15)
  if (!numeros) return ''
  return (Number(numeros) / 100).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const padrao = (formato: PadraoMascara, extra: Partial<ConfigMascara> = {}): ConfigMascara => ({
  formatar: (valor) => aplicarPadrao(valor, formato),
  limpar: somenteDigitos,
  modoTeclado: 'numeric',
  ...extra,
})

const incompleto = (rotulo: string) => `${rotulo} incompleto`

export const MASCARAS: Record<NomeMascara, ConfigMascara> = {
  cpf: padrao('999.999.999-99', {
    placeholder: '000.000.000-00',
    validar: (bruto) => (bruto.length < 11 ? incompleto('CPF') : validarCPF(bruto) ? undefined : 'CPF inválido'),
  }),
  cnpj: padrao('99.999.999/9999-99', {
    placeholder: '00.000.000/0000-00',
    validar: (bruto) => (bruto.length < 14 ? incompleto('CNPJ') : validarCNPJ(bruto) ? undefined : 'CNPJ inválido'),
  }),
  cpfCnpj: padrao(['999.999.999-99', '99.999.999/9999-99'], {
    placeholder: 'CPF ou CNPJ',
    validar: (bruto) => {
      if (bruto.length <= 11) return bruto.length < 11 ? incompleto('Documento') : validarCPF(bruto) ? undefined : 'CPF inválido'
      return bruto.length < 14 ? incompleto('CNPJ') : validarCNPJ(bruto) ? undefined : 'CNPJ inválido'
    },
  }),
  cep: padrao('99999-999', {
    placeholder: '00000-000',
    validar: (bruto) => (validarCEP(bruto) ? undefined : incompleto('CEP')),
  }),
  telefone: padrao(['(99) 9999-9999', '(99) 99999-9999'], {
    placeholder: '(00) 00000-0000',
    modoTeclado: 'tel',
    validar: (bruto) => (validarTelefoneBR(bruto) ? undefined : 'Telefone inválido'),
  }),
  data: padrao('99/99/9999', {
    placeholder: 'dd/mm/aaaa',
    validar: (_bruto, formatado) => (validarData(formatado) ? undefined : 'Data inválida'),
  }),
  hora: padrao('99:99', {
    placeholder: '00:00',
    validar: (_bruto, formatado) => (validarHora(formatado) ? undefined : 'Hora inválida'),
  }),
  dataHora: padrao('99/99/9999 99:99', {
    placeholder: 'dd/mm/aaaa 00:00',
    validar: (_bruto, formatado) => {
      const [data = '', hora = ''] = formatado.split(' ')
      return validarData(data) && validarHora(hora) ? undefined : 'Data ou hora inválida'
    },
  }),
  cartao: {
    formatar: (valor) => {
      const numeros = somenteDigitos(valor)
      return aplicarPadrao(numeros, detectarBandeiraCartao(numeros) === 'amex' ? '9999 999999 99999' : ['9999 9999 9999 9999', '9999 9999 9999 9999 999'])
    },
    limpar: somenteDigitos,
    modoTeclado: 'numeric',
    placeholder: '0000 0000 0000 0000',
    validar: (bruto) => (validarCartao(bruto) ? undefined : 'Número de cartão inválido'),
  },
  validadeCartao: padrao('99/99', {
    placeholder: 'MM/AA',
    validar: (_bruto, formatado) => (validarValidadeCartao(formatado) ? undefined : 'Validade inválida ou vencida'),
  }),
  cvv: padrao('9999', {
    placeholder: '000',
    validar: (bruto) => (bruto.length >= 3 ? undefined : incompleto('Código')),
  }),
  placa: {
    formatar: (valor) => {
      const limpa = somenteAlfanumericos(valor).toUpperCase()
      return aplicarPadrao(limpa, /^[A-Z]{3}\d[A-Z]/.test(limpa) ? 'AAA9A99' : 'AAA-9999', true)
    },
    limpar: (valor) => somenteAlfanumericos(valor).toUpperCase(),
    modoTeclado: 'text',
    placeholder: 'ABC1D23',
    validar: (bruto) => (validarPlaca(bruto) ? undefined : 'Placa inválida'),
  },
  rg: {
    formatar: (valor) => aplicarPadrao(valor, '99.999.999-*', true),
    limpar: (valor) => somenteAlfanumericos(valor).toUpperCase(),
    modoTeclado: 'text',
    placeholder: '00.000.000-0',
  },
  pis: padrao('999.99999.99-9', { placeholder: '000.00000.00-0' }),
  numero: { formatar: somenteDigitos, limpar: somenteDigitos, modoTeclado: 'numeric' },
  decimal: {
    formatar: (valor) => formatarDecimal(valor),
    limpar: (valor) => formatarDecimal(valor).replace(/\./g, ''),
    modoTeclado: 'decimal',
    placeholder: '0,00',
  },
  moeda: {
    formatar: (valor) => formatarCentavos(valor),
    limpar: (valor) => somenteDigitos(valor).replace(/^0+(?=\d)/, ''),
    modoTeclado: 'numeric',
    placeholder: '0,00',
  },
  porcentagem: {
    formatar: (valor) => formatarDecimal(valor),
    limpar: (valor) => formatarDecimal(valor).replace(/\./g, ''),
    modoTeclado: 'decimal',
    placeholder: '0',
    validar: (bruto) => {
      const numero = Number(bruto.replace(',', '.'))
      return numero >= 0 && numero <= 100 ? undefined : 'Use um valor entre 0 e 100'
    },
  },
}

export function resolverMascara(mascara?: Mascara): ConfigMascara | undefined {
  if (!mascara) return undefined
  if (typeof mascara === 'object' && 'formatar' in mascara) return mascara
  if (typeof mascara === 'string' && mascara in MASCARAS) return MASCARAS[mascara as NomeMascara]
  return padrao(mascara as PadraoMascara, { limpar: somenteAlfanumericos, modoTeclado: 'text' })
}
