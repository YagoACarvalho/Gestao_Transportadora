import { Check, Minus } from 'lucide-react'
import type { CSSProperties } from 'react'
import { juntarClasses } from '../../utilitarios'
import estilos from './CaixaMarcacao.module.css'

export type FormaCaixaMarcacao = 'circulo' | 'quadrado'

export type PropsCaixaMarcacao = {
  marcado?: boolean
  indeterminado?: boolean
  forma?: FormaCaixaMarcacao
  tamanho?: number
  className?: string
}

export function CaixaMarcacao({
  marcado = false,
  indeterminado = false,
  forma = 'circulo',
  tamanho = 18,
  className,
}: PropsCaixaMarcacao) {
  const ativo = marcado || indeterminado
  return (
    <span
      className={juntarClasses(estilos.caixa, className)}
      data-forma={forma}
      data-marcado={ativo || undefined}
      style={{ '--caixa-tamanho': `${tamanho}px` } as CSSProperties}
      aria-hidden="true"
    >
      {indeterminado ? <Minus /> : marcado ? <Check /> : null}
    </span>
  )
}
