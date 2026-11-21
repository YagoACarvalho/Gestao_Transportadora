import type { HTMLAttributes, MouseEvent, ReactNode, Ref } from 'react'
import { juntarClasses } from '../../utilitarios'
import estilos from './CaixaEntrada.module.css'

export type VarianteCaixaEntrada = 'contorno' | 'suave' | 'flutuante' | 'sublinhado'
export type TamanhoCaixaEntrada = 'pequeno' | 'medio' | 'grande'
export type FormaCaixaEntrada = 'arredondado' | 'pilula'

export type PropsCaixaEntrada = HTMLAttributes<HTMLDivElement> & {
  variante?: VarianteCaixaEntrada
  tamanho?: TamanhoCaixaEntrada
  forma?: FormaCaixaEntrada
  invalido?: boolean
  desabilitado?: boolean
  arrastando?: boolean
  multilinha?: boolean
  inicio?: ReactNode
  fim?: ReactNode
  addonInicio?: ReactNode
  addonFim?: ReactNode
  ref?: Ref<HTMLDivElement>
}

const INTERATIVOS = 'input, textarea, button, a, select, [role="button"], [contenteditable="true"]'

export function CaixaEntrada({
  variante = 'contorno',
  tamanho = 'medio',
  forma = 'arredondado',
  invalido = false,
  desabilitado = false,
  arrastando = false,
  multilinha = false,
  inicio,
  fim,
  addonInicio,
  addonFim,
  className,
  children,
  onMouseDown,
  ...props
}: PropsCaixaEntrada) {
  // clicar no espaço vazio da caixa leva o foco para o campo de texto
  function focarAoClicar(evento: MouseEvent<HTMLDivElement>) {
    onMouseDown?.(evento)
    if (evento.defaultPrevented || desabilitado) return
    if ((evento.target as HTMLElement).closest(INTERATIVOS)) return
    const campo = evento.currentTarget.querySelector<HTMLElement>('input:not([type="hidden"]):not([type="file"]), textarea')
    if (!campo) return
    evento.preventDefault()
    campo.focus()
  }

  return (
    <div
      className={juntarClasses(estilos.caixa, className)}
      data-variante={variante}
      data-tamanho={tamanho}
      data-forma={forma}
      data-invalido={invalido || undefined}
      data-desabilitado={desabilitado || undefined}
      data-arrastando={arrastando || undefined}
      data-multilinha={multilinha || undefined}
      onMouseDown={focarAoClicar}
      {...props}
    >
      {addonInicio && (
        <span className={estilos.addon} data-lado="inicio">
          {addonInicio}
        </span>
      )}
      {inicio && <span className={estilos.inicio}>{inicio}</span>}
      <div className={estilos.miolo}>{children}</div>
      {fim && <span className={estilos.fim}>{fim}</span>}
      {addonFim && (
        <span className={estilos.addon} data-lado="fim">
          {addonFim}
        </span>
      )}
    </div>
  )
}
