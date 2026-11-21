import { Check } from 'lucide-react'
import type { ElementType, HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react'
import type { Cor } from '../../tema'
import { useControlavel } from '../../hooks'
import { juntarClasses } from '../../utilitarios'
import estilos from './Cartao.module.css'

export type VarianteCartao = 'padrao' | 'destaque' | 'recurso' | 'contorno'
export type TamanhoCartao = 'pequeno' | 'medio' | 'grande'

export type PropsCartao = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  como?: ElementType
  variante?: VarianteCartao
  tamanho?: TamanhoCartao
  orientacao?: 'vertical' | 'horizontal'
  tom?: Cor
  interativo?: boolean
  selecionavel?: boolean
  selecionado?: boolean
  selecionadoPadrao?: boolean
  onMudarSelecao?: (selecionado: boolean) => void
  desabilitado?: boolean
  ref?: Ref<HTMLElement>
  children?: ReactNode
}

const ELEMENTOS_INTERNOS = 'a, button, input, select, textarea, label, [data-cartao-acao]'

export function Cartao({
  como,
  variante = 'padrao',
  tamanho = 'medio',
  orientacao = 'vertical',
  tom,
  interativo = false,
  selecionavel = false,
  selecionado,
  selecionadoPadrao = false,
  onMudarSelecao,
  desabilitado = false,
  className,
  onClick,
  onKeyDown,
  tabIndex,
  children,
  ...props
}: PropsCartao) {
  const Elemento: ElementType = como ?? 'div'
  const [marcado, mudarSelecao] = useControlavel(selecionado, selecionadoPadrao, onMudarSelecao)

  function aoClicar(evento: MouseEvent<HTMLElement>) {
    if (desabilitado) return
    onClick?.(evento)
    if (!selecionavel || evento.defaultPrevented) return
    if ((evento.target as HTMLElement).closest(ELEMENTOS_INTERNOS)) return
    mudarSelecao(!marcado)
  }

  function aoTeclar(evento: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(evento)
    if (!selecionavel || desabilitado || evento.defaultPrevented || evento.target !== evento.currentTarget) return
    if (evento.key === ' ' || evento.key === 'Enter') {
      evento.preventDefault()
      mudarSelecao(!marcado)
    }
  }

  const acessibilidadeSelecao = selecionavel
    ? { role: 'checkbox', 'aria-checked': marcado, 'aria-disabled': desabilitado || undefined, tabIndex: desabilitado ? -1 : (tabIndex ?? 0) }
    : { tabIndex }

  return (
    <Elemento
      className={juntarClasses(estilos.cartao, className)}
      data-variante={variante}
      data-tamanho={tamanho}
      data-orientacao={orientacao}
      data-tom={tom}
      data-interativo={interativo || undefined}
      data-selecionavel={selecionavel || undefined}
      data-selecionado={(selecionavel && marcado) || undefined}
      data-desabilitado={desabilitado || undefined}
      onClick={aoClicar}
      onKeyDown={aoTeclar}
      {...acessibilidadeSelecao}
      {...props}
    >
      {selecionavel && (
        <span className={estilos.marca} aria-hidden="true">
          <Check size={13} strokeWidth={3} />
        </span>
      )}
      {children}
    </Elemento>
  )
}
