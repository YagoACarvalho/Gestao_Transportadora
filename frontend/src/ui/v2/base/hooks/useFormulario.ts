import { useState, type FormEvent } from 'react'
import { validarValor, type Regra } from '../utilitarios'

type Valores = Record<string, string>

export type OpcoesFormulario<T extends Valores> = {
  valoresIniciais: T
  regras?: Partial<Record<keyof T, readonly Regra[]>>
}

export function useFormulario<T extends Valores>({ valoresIniciais, regras = {} }: OpcoesFormulario<T>) {
  const [valores, setValores] = useState<T>(valoresIniciais)
  const [tocados, setTocados] = useState<Partial<Record<keyof T, boolean>>>({})
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const nomes = Object.keys(valores) as Array<keyof T>
  const erros = Object.fromEntries(
    nomes.map((nome) => [nome, validarValor(valores[nome], regras[nome] ?? [], valores)]),
  ) as Partial<Record<keyof T, string>>
  const valido = nomes.every((nome) => !erros[nome])

  function definirValor<K extends keyof T>(nome: K, valor: string) {
    setValores((atuais) => ({ ...atuais, [nome]: valor }))
  }

  function registrar<K extends keyof T>(nome: K) {
    return {
      name: String(nome),
      valor: valores[nome],
      onMudarValor: (valor: string) => definirValor(nome, valor),
      onBlur: () => setTocados((atuais) => ({ ...atuais, [nome]: true })),
      erro: tocados[nome] || tentouEnviar ? erros[nome] : undefined,
    }
  }

  function enviar(acao: (valores: T) => void | Promise<void>) {
    return async (evento?: FormEvent) => {
      evento?.preventDefault()
      setTentouEnviar(true)
      if (!valido) {
        const primeiro = nomes.find((nome) => erros[nome])
        if (primeiro) document.querySelector<HTMLElement>(`[name="${CSS.escape(String(primeiro))}"]`)?.focus()
        return
      }
      setEnviando(true)
      try {
        await acao(valores)
      } finally {
        setEnviando(false)
      }
    }
  }

  function redefinir() {
    setValores(valoresIniciais)
    setTocados({})
    setTentouEnviar(false)
  }

  return { valores, erros, valido, enviando, registrar, enviar, redefinir, definirValor }
}
