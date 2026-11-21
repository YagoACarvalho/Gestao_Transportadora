import { Eye, EyeOff, X } from 'lucide-react'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'
import { useControlavel, usePlataformaMac } from '../../hooks'
import {
  combinarRefs,
  regras as REGRAS,
  resolverMascara,
  somenteAlfanumericos,
  validarValor,
  type Mascara,
  type Regra,
} from '../../utilitarios'
import { Atalho } from '../Atalho'
import { BotaoIcone } from '../BotaoIcone'
import { CaixaEntrada, type FormaCaixaEntrada, type TamanhoCaixaEntrada, type VarianteCaixaEntrada } from '../CaixaEntrada'
import { Campo, useCampo } from '../Campo'
import { ProgressoCircular } from '../ProgressoCircular'

export type QuandoValidar = 'saida' | 'digitacao'

export type PropsCampoEmbutido = {
  rotulo?: ReactNode
  ajuda?: ReactNode
  erro?: ReactNode
  opcional?: boolean | string
  dica?: string
  acaoRotulo?: ReactNode
  obrigatorio?: boolean
}

export type PropsEntrada = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'size' | 'prefix'
> &
  PropsCampoEmbutido & {
    valor?: string
    valorPadrao?: string
    onMudarValor?: (valor: string, bruto: string) => void
    mascara?: Mascara
    regras?: readonly Regra[]
    validarEm?: QuandoValidar
    validarMascara?: boolean
    icone?: ReactNode
    inicio?: ReactNode
    fim?: ReactNode
    addonInicio?: ReactNode
    addonFim?: ReactNode
    limpavel?: boolean
    atalho?: string
    carregando?: boolean
    contador?: boolean
    variante?: VarianteCaixaEntrada
    tamanho?: TamanhoCaixaEntrada
    forma?: FormaCaixaEntrada
    classeCaixa?: string
    ref?: Ref<HTMLInputElement>
  }

type PropsInternas = Omit<PropsEntrada, keyof PropsCampoEmbutido>

const contarValidos = (texto: string) => somenteAlfanumericos(texto).length

function indiceAposValidos(texto: string, quantidade: number) {
  if (quantidade <= 0) return 0
  let contados = 0
  for (let indice = 0; indice < texto.length; indice++) {
    if (/[a-z0-9]/i.test(texto[indice])) contados++
    if (contados === quantidade) return indice + 1
  }
  return texto.length
}

export function Entrada({ rotulo, ajuda, erro, opcional, dica, acaoRotulo, obrigatorio, className, classeCaixa, ...props }: PropsEntrada) {
  const campo = useCampo()
  if (campo) return <EntradaInterna classeCaixa={classeCaixa ?? className} {...props} required={props.required ?? campo.obrigatorio} />
  const required = props.required ?? obrigatorio
  return (
    <Campo
      rotulo={rotulo}
      ajuda={ajuda}
      erro={erro}
      opcional={opcional}
      dica={dica}
      acaoRotulo={acaoRotulo}
      obrigatorio={required}
      desabilitado={props.disabled}
      idControle={props.id}
      className={className}
    >
      <EntradaInterna classeCaixa={classeCaixa} {...props} required={required} />
    </Campo>
  )
}

function EntradaInterna({
  valor,
  valorPadrao = '',
  onMudarValor,
  mascara,
  regras,
  validarEm = 'saida',
  validarMascara = true,
  icone,
  inicio,
  fim,
  addonInicio,
  addonFim,
  limpavel = false,
  atalho,
  carregando = false,
  contador = false,
  variante,
  tamanho,
  forma,
  classeCaixa,
  type = 'text',
  maxLength,
  required,
  disabled,
  id,
  placeholder,
  inputMode,
  onBlur,
  ref,
  ...props
}: PropsInternas) {
  const campo = useCampo()
  const config = useMemo(() => resolverMascara(mascara), [mascara])
  const [atual, mudar] = useControlavel(valor, config && valorPadrao ? config.formatar(valorPadrao) : valorPadrao)
  const entradaRef = useRef<HTMLInputElement>(null)
  const cursorPendente = useRef<number | 'fim' | null>(null)
  const [mostrarErro, setMostrarErro] = useState(false)
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const mac = usePlataformaMac()
  const limpar = (texto: string) => (config?.limpar ? config.limpar(texto) : texto)

  function definir(novo: string) {
    mudar(novo)
    onMudarValor?.(novo, limpar(novo))
  }

  let erroValidacao: string | undefined
  if (mostrarErro) {
    const lista = required ? [REGRAS.obrigatorio(), ...(regras ?? [])] : (regras ?? [])
    erroValidacao = validarValor(atual, lista)
    const bruto = limpar(atual)
    if (!erroValidacao && config?.validar && validarMascara && bruto) erroValidacao = config.validar(bruto, atual)
  }

  const definirErroInterno = campo?.definirErroInterno
  const definirContador = campo?.definirContador
  const textoContador = contador && maxLength ? `${atual.length}/${maxLength}` : undefined

  useEffect(() => {
    definirErroInterno?.(erroValidacao)
  }, [definirErroInterno, erroValidacao])

  useEffect(() => () => definirErroInterno?.(undefined), [definirErroInterno])

  useEffect(() => {
    definirContador?.(textoContador)
  }, [definirContador, textoContador])

  // depois de formatar, devolve o cursor para perto de onde a pessoa estava digitando
  useLayoutEffect(() => {
    const pendente = cursorPendente.current
    const entrada = entradaRef.current
    if (pendente === null || !entrada || document.activeElement !== entrada) return
    cursorPendente.current = null
    const posicao = pendente === 'fim' ? atual.length : indiceAposValidos(atual, pendente)
    entrada.setSelectionRange(posicao, posicao)
  }, [atual])

  useEffect(() => {
    if (!atalho) return
    function ouvir(evento: KeyboardEvent) {
      if (!(evento.metaKey || evento.ctrlKey) || evento.key.toLowerCase() !== atalho?.toLowerCase()) return
      evento.preventDefault()
      entradaRef.current?.focus()
      entradaRef.current?.select()
    }
    document.addEventListener('keydown', ouvir)
    return () => document.removeEventListener('keydown', ouvir)
  }, [atalho])

  function aoMudar(evento: ChangeEvent<HTMLInputElement>) {
    if (validarEm === 'digitacao') setMostrarErro(true)
    let texto = evento.target.value
    if (!config) return definir(texto)
    const cursor = evento.target.selectionStart ?? texto.length
    let validos = contarValidos(texto.slice(0, cursor))
    // apagar só um separador (ponto, traço, parêntese) não muda nada; então apaga o caractere anterior
    if (limpar(texto) === limpar(atual) && texto.length < atual.length && validos > 0) {
      const posicao = indiceAposValidos(texto, validos) - 1
      texto = texto.slice(0, posicao) + texto.slice(posicao + 1)
      validos -= 1
    }
    cursorPendente.current = cursor >= evento.target.value.length ? 'fim' : validos
    definir(config.formatar(texto))
  }

  const ehSenha = type === 'password'
  const temFim = carregando || (limpavel && atual) || ehSenha || atalho || fim

  return (
    <CaixaEntrada
      variante={variante}
      tamanho={tamanho}
      forma={forma}
      invalido={Boolean(campo?.invalido)}
      desabilitado={disabled ?? campo?.desabilitado}
      inicio={icone ?? inicio}
      addonInicio={addonInicio}
      addonFim={addonFim}
      className={classeCaixa}
      fim={
        temFim ? (
          <>
            {carregando && <ProgressoCircular tamanho={16} />}
            {limpavel && atual && !disabled && (
              <BotaoIcone
                rotulo="Limpar"
                icone={<X />}
                tamanho="mini"
                onClick={() => {
                  definir('')
                  entradaRef.current?.focus()
                }}
              />
            )}
            {ehSenha && (
              <BotaoIcone
                rotulo={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                icone={senhaVisivel ? <EyeOff /> : <Eye />}
                tamanho="mini"
                onClick={() => setSenhaVisivel(!senhaVisivel)}
              />
            )}
            {atalho && !atual && <Atalho teclas={[mac ? '⌘' : 'Ctrl', atalho.toUpperCase()]} />}
            {fim}
          </>
        ) : undefined
      }
    >
      <input
        ref={combinarRefs(entradaRef, ref)}
        id={id ?? campo?.id}
        type={ehSenha && senhaVisivel ? 'text' : type}
        value={atual}
        placeholder={placeholder ?? config?.placeholder}
        inputMode={inputMode ?? config?.modoTeclado}
        maxLength={config ? undefined : maxLength}
        required={required}
        disabled={disabled}
        aria-invalid={campo?.invalido || undefined}
        aria-describedby={campo?.temMensagem ? campo.idMensagem : undefined}
        onChange={aoMudar}
        onBlur={(evento) => {
          onBlur?.(evento)
          setMostrarErro(true)
        }}
        {...props}
      />
    </CaixaEntrada>
  )
}
