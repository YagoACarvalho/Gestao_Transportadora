import type { CSSProperties, HTMLAttributes } from 'react'
import { juntarClasses } from '../../utilitarios'
import estilos from './ProgressoCircular.module.css'

export type CorProgressoCircular = 'atual' | 'primaria' | 'sucesso' | 'perigo'

export type PropsProgressoCircular = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  valor?: number
  tamanho?: number
  espessura?: number
  cor?: CorProgressoCircular
  rotulo?: string
}

export function ProgressoCircular({
  valor,
  tamanho = 20,
  espessura: espessuraPedida = 2.5,
  cor = 'atual',
  rotulo = 'Carregando',
  className,
  style,
  ...props
}: PropsProgressoCircular) {
  const indeterminado = valor === undefined
  const percentual = Math.min(100, Math.max(0, valor ?? 25))
  const espessura = Math.min(Math.max(espessuraPedida, 0), 20)
  const raio = 12 - espessura / 2
  const circunferencia = 2 * Math.PI * raio

  return (
    <span
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={indeterminado ? undefined : 0}
      aria-valuemax={indeterminado ? undefined : 100}
      aria-valuenow={indeterminado ? undefined : Math.round(percentual)}
      className={juntarClasses(estilos.progresso, className)}
      data-indeterminado={indeterminado || undefined}
      data-cor={cor}
      style={{ width: tamanho, height: tamanho, ...style } as CSSProperties}
      {...props}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle className={estilos.trilho} cx="12" cy="12" r={raio} strokeWidth={espessura} />
        <circle
          className={estilos.indicador}
          cx="12"
          cy="12"
          r={raio}
          strokeWidth={espessura}
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - percentual / 100)}
        />
      </svg>
    </span>
  )
}
