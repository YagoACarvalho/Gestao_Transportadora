import type { ButtonHTMLAttributes, Ref } from 'react'
import { useControlavel } from '../../hooks'
import { juntarClasses } from '../../utilitarios'
import estilos from './Interruptor.module.css'

export type VarianteInterruptor = 'padrao' | 'ios' | 'ios26' | 'contraste'
export type TamanhoInterruptor = 'pequeno' | 'medio' | 'grande'

export type PropsInterruptor = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'children' | 'value'> & {
  marcado?: boolean
  marcadoPadrao?: boolean
  onMudar?: (marcado: boolean) => void
  variante?: VarianteInterruptor
  tamanho?: TamanhoInterruptor
  rotulo?: string
  decorativo?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Interruptor({
  marcado,
  marcadoPadrao = false,
  onMudar,
  variante = 'padrao',
  tamanho = 'medio',
  rotulo,
  decorativo = false,
  className,
  onClick,
  ...props
}: PropsInterruptor) {
  const [ligado, mudar] = useControlavel(marcado, marcadoPadrao, onMudar)
  const atributos = {
    className: juntarClasses(estilos.interruptor, className),
    'data-variante': variante,
    'data-tamanho': tamanho,
    'data-marcado': ligado || undefined,
  }
  const conteudo = (
    <>
      {variante === 'contraste' && <span className={estilos.marca} aria-hidden="true" />}
      <span className={estilos.botao} aria-hidden="true" />
    </>
  )

  // dentro de um item de menu o item já é o controle; aqui vira só desenho
  if (decorativo) {
    return (
      <span {...atributos} aria-hidden="true">
        {conteudo}
      </span>
    )
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={(evento) => {
        onClick?.(evento)
        if (!evento.defaultPrevented) mudar(!ligado)
      }}
      {...atributos}
      {...props}
    >
      {conteudo}
    </button>
  )
}
