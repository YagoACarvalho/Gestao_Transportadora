import type { LabelHTMLAttributes } from 'react'
import { juntarClasses } from '../../utilitarios'
import estilos from './RotuloCampo.module.css'

export type PropsRotuloCampo = LabelHTMLAttributes<HTMLLabelElement> & {
  opcional?: boolean | string
  obrigatorio?: boolean
}

export function RotuloCampo({ opcional, obrigatorio = false, className, children, ...props }: PropsRotuloCampo) {
  return (
    <label className={juntarClasses(estilos.rotulo, className)} {...props}>
      {children}
      {obrigatorio && (
        <span className={estilos.obrigatorio} aria-hidden="true">
          *
        </span>
      )}
      {opcional && <span className={estilos.opcional}>{typeof opcional === 'string' ? opcional : '(opcional)'}</span>}
    </label>
  )
}
