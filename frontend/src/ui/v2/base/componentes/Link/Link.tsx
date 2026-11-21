import { ArrowUpRight } from 'lucide-react'
import { cloneElement, isValidElement, type AnchorHTMLAttributes, type MouseEvent, type ReactElement, type ReactNode, type Ref } from 'react'
import type { Cor } from '../../tema'
import { juntarClasses } from '../../utilitarios'
import { OcultoVisualmente } from '../OcultoVisualmente'
import { Slot } from '../Slot'
import estilos from './Link.module.css'

export type VarianteLink = 'padrao' | 'sutil' | 'sublinhado'
export type TomLink = 'primaria' | 'padrao' | 'herdar' | Cor

export type PropsLink = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variante?: VarianteLink
  tom?: TomLink
  externo?: boolean
  desabilitado?: boolean
  comoFilho?: boolean
  ref?: Ref<HTMLAnchorElement>
}

export function Link({
  variante = 'padrao',
  tom = 'primaria',
  externo = false,
  desabilitado = false,
  comoFilho = false,
  className,
  children,
  href,
  onClick,
  target,
  rel,
  ...props
}: PropsLink) {
  const propriedades = {
    className: juntarClasses(estilos.link, className),
    'data-variante': variante,
    'data-tom': tom,
    'data-externo': externo || undefined,
    'data-desabilitado': desabilitado || undefined,
    href: desabilitado ? undefined : href,
    role: desabilitado ? 'link' : undefined,
    'aria-disabled': desabilitado || undefined,
    tabIndex: desabilitado ? -1 : undefined,
    target: externo ? '_blank' : target,
    rel: externo ? 'noopener noreferrer' : rel,
    onClick: (evento: MouseEvent<HTMLAnchorElement>) => {
      if (desabilitado) {
        evento.preventDefault()
        return
      }
      onClick?.(evento)
    },
    ...props,
  }

  const marca = (conteudo: ReactNode) => (
    <>
      {conteudo}
      {externo && (
        <>
          <ArrowUpRight className={estilos.seta} aria-hidden strokeWidth={2.2} />
          <OcultoVisualmente> (abre em nova aba)</OcultoVisualmente>
        </>
      )}
    </>
  )

  if (comoFilho && isValidElement(children)) {
    const filho = children as ReactElement<{ children?: ReactNode; onClick?: unknown }>
    return (
      <Slot
        mesclar
        filho={desabilitado ? cloneElement(filho, { onClick: undefined }) : filho}
        propriedades={{ ...propriedades, href: desabilitado ? null : href, children: marca(filho.props.children) }}
      />
    )
  }

  return <a {...propriedades}>{marca(children)}</a>
}
