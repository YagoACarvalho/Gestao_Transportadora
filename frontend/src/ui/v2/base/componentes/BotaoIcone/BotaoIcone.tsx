import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { juntarClasses } from '../../utilitarios'
import estilos from './BotaoIcone.module.css'

export type VarianteBotaoIcone = 'fantasma' | 'suave' | 'contorno' | 'solido'
export type TomBotaoIcone = 'neutro' | 'primario' | 'perigo'
export type TamanhoBotaoIcone = 'mini' | 'pequeno' | 'medio' | 'grande'
export type FormaBotaoIcone = 'circulo' | 'quadrado'

export type PropsBotaoIcone = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icone: ReactNode
  rotulo: string
  variante?: VarianteBotaoIcone
  tom?: TomBotaoIcone
  tamanho?: TamanhoBotaoIcone
  forma?: FormaBotaoIcone
  pressionado?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function BotaoIcone({
  icone,
  rotulo,
  variante = 'fantasma',
  tom = 'neutro',
  tamanho = 'medio',
  forma = 'circulo',
  pressionado,
  type = 'button',
  className,
  ...props
}: PropsBotaoIcone) {
  return (
    <button
      type={type}
      className={juntarClasses(estilos.botao, className)}
      data-variante={variante}
      data-tom={tom}
      data-tamanho={tamanho}
      data-forma={forma}
      aria-label={rotulo}
      title={rotulo}
      aria-pressed={pressionado}
      {...props}
    >
      {icone}
    </button>
  )
}
