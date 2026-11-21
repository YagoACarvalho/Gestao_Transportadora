import { useEffect, useLayoutEffect, useRef, useState, type Ref, type TextareaHTMLAttributes } from 'react'
import { useControlavel } from '../../hooks'
import { combinarRefs, regras as REGRAS, validarValor, type Regra } from '../../utilitarios'
import { CaixaEntrada, type TamanhoCaixaEntrada, type VarianteCaixaEntrada } from '../CaixaEntrada'
import { Campo, useCampo } from '../Campo'
import type { PropsCampoEmbutido } from '../Entrada'

export type PropsAreaTexto = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'defaultValue' | 'onChange'> &
  PropsCampoEmbutido & {
    valor?: string
    valorPadrao?: string
    onMudarValor?: (valor: string) => void
    regras?: readonly Regra[]
    minLinhas?: number
    maxLinhas?: number
    contador?: boolean
    variante?: VarianteCaixaEntrada
    tamanho?: TamanhoCaixaEntrada
    ref?: Ref<HTMLTextAreaElement>
  }

export function AreaTexto({ rotulo, ajuda, erro, opcional, dica, acaoRotulo, obrigatorio, className, ...props }: PropsAreaTexto) {
  const campo = useCampo()
  if (campo) return <AreaTextoInterna {...props} className={className} required={props.required ?? campo.obrigatorio} />
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
      <AreaTextoInterna {...props} required={required} />
    </Campo>
  )
}

function AreaTextoInterna({
  valor,
  valorPadrao = '',
  onMudarValor,
  regras,
  minLinhas = 3,
  maxLinhas = 10,
  contador = false,
  variante,
  tamanho,
  maxLength,
  required,
  disabled,
  id,
  className,
  onBlur,
  ref,
  ...props
}: Omit<PropsAreaTexto, keyof PropsCampoEmbutido>) {
  const campo = useCampo()
  const [atual, mudar] = useControlavel(valor, valorPadrao, onMudarValor)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const [mostrarErro, setMostrarErro] = useState(false)
  const erroValidacao = mostrarErro
    ? validarValor(atual, required ? [REGRAS.obrigatorio(), ...(regras ?? [])] : (regras ?? []))
    : undefined
  const definirErroInterno = campo?.definirErroInterno
  const definirContador = campo?.definirContador
  const textoContador = contador && maxLength ? `${atual.length}/${maxLength}` : undefined

  useEffect(() => {
    definirErroInterno?.(erroValidacao)
  }, [definirErroInterno, erroValidacao])

  useEffect(() => {
    definirContador?.(textoContador)
  }, [definirContador, textoContador])

  useLayoutEffect(() => {
    const area = areaRef.current
    if (!area) return
    const estilo = getComputedStyle(area)
    const linha = parseFloat(estilo.lineHeight) || 22
    area.style.height = 'auto'
    const altura = Math.min(Math.max(area.scrollHeight, minLinhas * linha), maxLinhas * linha)
    area.style.height = `${altura}px`
    area.style.overflowY = area.scrollHeight > altura ? 'auto' : 'hidden'
  }, [atual, minLinhas, maxLinhas])

  return (
    <CaixaEntrada
      className={className}
      variante={variante}
      tamanho={tamanho}
      invalido={Boolean(campo?.invalido)}
      desabilitado={disabled ?? campo?.desabilitado}
    >
      <textarea
        ref={combinarRefs(areaRef, ref)}
        id={id ?? campo?.id}
        value={atual}
        rows={minLinhas}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        aria-invalid={campo?.invalido || undefined}
        aria-describedby={campo?.temMensagem ? campo.idMensagem : undefined}
        onChange={(evento) => mudar(evento.target.value)}
        onBlur={(evento) => {
          onBlur?.(evento)
          setMostrarErro(true)
        }}
        {...props}
      />
    </CaixaEntrada>
  )
}
