import { isValidElement, type ElementType, type HTMLAttributes, type ReactElement, type Ref } from 'react'
import { juntarClasses } from '../../utilitarios'
import { Slot } from '../Slot'
import estilos from './OcultoVisualmente.module.css'

export type PropsOcultoVisualmente = HTMLAttributes<HTMLElement> & {
  como?: 'span' | 'div' | 'p' | 'a' | 'button' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  comoFilho?: boolean
  focavel?: boolean
  href?: string
  ref?: Ref<HTMLElement>
}

export function OcultoVisualmente({
  como = 'span',
  comoFilho = false,
  focavel = false,
  className,
  children,
  ...props
}: PropsOcultoVisualmente) {
  const propriedades = {
    className: juntarClasses(estilos.oculto, className),
    'data-focavel': focavel || undefined,
    ...props,
  }

  if (comoFilho && isValidElement(children)) {
    return <Slot mesclar filho={children as ReactElement<Record<string, unknown>>} propriedades={propriedades} />
  }

  const Elemento = como as ElementType
  return <Elemento {...propriedades}>{children}</Elemento>
}
