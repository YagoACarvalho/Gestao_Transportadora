import type { HTMLAttributes, ReactNode } from 'react'
import type { Cor } from '../../tema'
import { juntarClasses } from '../../utilitarios'
import estilos from './Sinalizador.module.css'

export type PosicaoSinalizador = 'topo-direita' | 'topo-esquerda' | 'base-direita' | 'base-esquerda'
export type SobreposicaoSinalizador = 'retangulo' | 'circulo'

export type PropsSinalizador = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
  conteudo?: ReactNode
  maximo?: number
  ponto?: boolean
  tom?: Cor | 'primaria' | 'escuro'
  posicao?: PosicaoSinalizador
  sobreposicao?: SobreposicaoSinalizador
  mostrarZero?: boolean
  oculto?: boolean
  rotulo?: string
}

export function Sinalizador({
  children,
  conteudo,
  maximo = 99,
  ponto = false,
  tom = 'vermelho',
  posicao = 'topo-direita',
  sobreposicao = 'retangulo',
  mostrarZero = false,
  oculto = false,
  rotulo,
  className,
  ...props
}: PropsSinalizador) {
  const texto = typeof conteudo === 'number' && conteudo > maximo ? `${maximo}+` : conteudo
  const vazio = conteudo === undefined || conteudo === null || conteudo === false || conteudo === '' || (conteudo === 0 && !mostrarZero)
  const visivel = !oculto && (ponto || !vazio)

  return (
    <span className={juntarClasses(estilos.sinalizador, className)} {...props}>
      {children}
      <span
        className={estilos.marca}
        data-tom={tom}
        data-posicao={posicao}
        data-sobreposicao={sobreposicao}
        data-ponto={ponto || undefined}
        data-visivel={visivel || undefined}
        aria-hidden={rotulo ? undefined : true}
        role={rotulo ? 'status' : undefined}
      >
        {!ponto && visivel && texto}
        {rotulo && visivel && <span className={estilos.oculto}>{rotulo}</span>}
      </span>
    </span>
  )
}
