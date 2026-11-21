import { ChevronDown } from 'lucide-react'
import type { ReactNode, Ref, SelectHTMLAttributes } from 'react'
import { useControlavel } from '../../hooks'
import { juntarClasses } from '../../utilitarios'
import { CaixaEntrada, type FormaCaixaEntrada, type TamanhoCaixaEntrada, type VarianteCaixaEntrada } from '../CaixaEntrada'
import { Campo, useCampo } from '../Campo'
import type { PropsCampoEmbutido } from '../Entrada'
import estilos from './SelecaoNativa.module.css'

export type OpcaoSelecaoNativa = {
  valor: string
  rotulo: string
  desabilitado?: boolean
}

export type GrupoSelecaoNativa = {
  rotulo: string
  opcoes: readonly OpcaoSelecaoNativa[]
  desabilitado?: boolean
}

export type ItemSelecaoNativa = OpcaoSelecaoNativa | GrupoSelecaoNativa

export type PropsSelecaoNativa = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'defaultValue' | 'onChange' | 'size' | 'children'
> &
  PropsCampoEmbutido & {
    opcoes: readonly ItemSelecaoNativa[]
    valor?: string
    valorPadrao?: string
    onMudar?: (valor: string) => void
    placeholder?: string
    icone?: ReactNode
    variante?: VarianteCaixaEntrada
    tamanho?: TamanhoCaixaEntrada
    forma?: FormaCaixaEntrada
    ref?: Ref<HTMLSelectElement>
  }

const ehGrupo = (item: ItemSelecaoNativa): item is GrupoSelecaoNativa => 'opcoes' in item

export function SelecaoNativa({ rotulo, ajuda, erro, opcional, dica, acaoRotulo, obrigatorio, className, ...props }: PropsSelecaoNativa) {
  const campo = useCampo()
  if (campo) return <SelecaoInterna {...props} required={props.required ?? campo.obrigatorio} classeCaixa={className} />
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
      <SelecaoInterna {...props} required={required} />
    </Campo>
  )
}

type PropsInternas = Omit<PropsSelecaoNativa, keyof PropsCampoEmbutido | 'className'> & { classeCaixa?: string }

function SelecaoInterna({
  opcoes,
  valor,
  valorPadrao = '',
  onMudar,
  placeholder,
  icone,
  variante,
  tamanho,
  forma,
  classeCaixa,
  disabled,
  id,
  ref,
  ...props
}: PropsInternas) {
  const campo = useCampo()
  const [atual, mudar] = useControlavel(valor, valorPadrao, onMudar)
  const existe = opcoes.some((item) => (ehGrupo(item) ? item.opcoes.some((opcao) => opcao.valor === atual) : item.valor === atual))
  const marcadorVazio = placeholder !== undefined || (atual === '' && !existe)

  return (
    <CaixaEntrada
      className={juntarClasses(estilos.caixa, classeCaixa)}
      variante={variante}
      tamanho={tamanho}
      forma={forma}
      invalido={campo?.invalido}
      desabilitado={disabled ?? campo?.desabilitado}
      inicio={icone}
      fim={<ChevronDown aria-hidden="true" />}
    >
      <select
        {...props}
        ref={ref}
        id={id ?? campo?.id}
        className={estilos.selecao}
        value={atual}
        disabled={disabled ?? campo?.desabilitado}
        data-vazio={atual === '' || undefined}
        data-icone={icone ? true : undefined}
        aria-invalid={campo?.invalido || undefined}
        aria-describedby={campo?.temMensagem ? campo.idMensagem : undefined}
        onChange={(evento) => mudar(evento.target.value)}
      >
        {marcadorVazio && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {opcoes.map((item) =>
          ehGrupo(item) ? (
            <optgroup key={item.rotulo} label={item.rotulo} disabled={item.desabilitado}>
              {item.opcoes.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor} disabled={opcao.desabilitado}>
                  {opcao.rotulo}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={item.valor} value={item.valor} disabled={item.desabilitado}>
              {item.rotulo}
            </option>
          ),
        )}
      </select>
    </CaixaEntrada>
  )
}
