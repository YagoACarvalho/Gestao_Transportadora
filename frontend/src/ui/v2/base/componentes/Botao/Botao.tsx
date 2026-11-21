import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { juntarClasses } from '../../utilitarios'
import { ProgressoCircular } from '../ProgressoCircular'
import estilos from './Botao.module.css'

export type VarianteBotao = 'solido' | 'suave' | 'contorno' | 'fantasma' | 'ia' | 'premium'
export type TomBotao = 'neutro' | 'primario' | 'perigo'
export type TamanhoBotao = 'pequeno' | 'medio' | 'grande'
export type FormaBotao = 'pilula' | 'arredondado'

export type PropsBotao = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBotao
  tom?: TomBotao
  tamanho?: TamanhoBotao
  forma?: FormaBotao
  iconeEsquerda?: ReactNode
  iconeDireita?: ReactNode
  pressionado?: boolean
  carregando?: boolean
  larguraTotal?: boolean
  ref?: Ref<HTMLButtonElement>
}

const TAMANHO_PROGRESSO: Record<TamanhoBotao, number> = { pequeno: 14, medio: 16, grande: 18 }

export function Botao({
  variante = 'solido',
  tom = 'neutro',
  tamanho = 'medio',
  forma = 'pilula',
  iconeEsquerda,
  iconeDireita,
  pressionado,
  carregando = false,
  larguraTotal = false,
  type = 'button',
  disabled,
  className,
  children,
  ...props
}: PropsBotao) {
  return (
    <button
      type={type}
      className={juntarClasses(estilos.botao, className)}
      data-variante={variante}
      data-tom={tom}
      data-tamanho={tamanho}
      data-forma={forma}
      data-largura-total={larguraTotal || undefined}
      aria-pressed={pressionado}
      aria-busy={carregando || undefined}
      disabled={disabled || carregando}
      {...props}
    >
      {carregando ? (
        <ProgressoCircular tamanho={TAMANHO_PROGRESSO[tamanho]} rotulo="Carregando" />
      ) : (
        iconeEsquerda && <span className={estilos.icone}>{iconeEsquerda}</span>
      )}
      {children !== undefined && children !== null && <span className={estilos.rotulo}>{children}</span>}
      {iconeDireita && <span className={estilos.icone}>{iconeDireita}</span>}
    </button>
  )
}
