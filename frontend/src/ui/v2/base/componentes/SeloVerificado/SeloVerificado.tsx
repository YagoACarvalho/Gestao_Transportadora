import type { SVGAttributes } from 'react'
import { juntarClasses } from '../../utilitarios'
import estilos from './SeloVerificado.module.css'

export type PropsSeloVerificado = Omit<SVGAttributes<SVGSVGElement>, 'children'> & {
  tamanho?: number
  rotulo?: string
}

const PONTAS = 12

// estrela de 12 pontas; o stroke com linejoin round arredonda as pontas e vira o contorno ondulado do selo
const CONTORNO = Array.from({ length: PONTAS * 2 }, (_, indice) => {
  const raio = indice % 2 === 0 ? 10 : 8.4
  const angulo = (Math.PI * indice) / PONTAS - Math.PI / 2
  return `${(12 + raio * Math.cos(angulo)).toFixed(2)},${(12 + raio * Math.sin(angulo)).toFixed(2)}`
}).join(' ')

export function SeloVerificado({ tamanho = 16, rotulo = 'Verificado', className, ...props }: PropsSeloVerificado) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      role="img"
      aria-label={rotulo}
      className={juntarClasses(estilos.selo, className)}
      {...props}
    >
      <title>{rotulo}</title>
      <polygon points={CONTORNO} fill="currentColor" stroke="currentColor" strokeWidth={2.6} strokeLinejoin="round" />
      <path
        className={estilos.marca}
        d="M8.3 12.3l2.5 2.5 4.9-5.1"
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
