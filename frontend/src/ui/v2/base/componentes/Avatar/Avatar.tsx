import { useState, type CSSProperties, type HTMLAttributes } from 'react'
import type { Cor } from '../../tema'
import { escolherCor, juntarClasses, obterIniciais } from '../../utilitarios'
import estilos from './Avatar.module.css'

export type TamanhoAvatar = 'pequeno' | 'medio' | 'grande'
export type FormaAvatar = 'circulo' | 'arredondado'

export type PropsAvatar = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  nome: string
  src?: string
  cor?: Cor
  tamanho?: TamanhoAvatar | number
  forma?: FormaAvatar
  decorativo?: boolean
}

const TAMANHOS: Record<TamanhoAvatar, number> = { pequeno: 32, medio: 44, grande: 56 }

export function Avatar({
  nome,
  src,
  cor,
  tamanho = 'medio',
  forma = 'circulo',
  decorativo = false,
  className,
  style,
  ...props
}: PropsAvatar) {
  const [srcComErro, setSrcComErro] = useState<string>()
  const pixels = typeof tamanho === 'number' ? tamanho : TAMANHOS[tamanho]
  const mostrarImagem = Boolean(src) && src !== srcComErro

  return (
    <span
      className={juntarClasses(estilos.avatar, className)}
      data-cor={cor ?? escolherCor(nome)}
      data-forma={forma}
      style={{ '--avatar-tamanho': `${pixels}px`, ...style } as CSSProperties}
      role={decorativo ? undefined : 'img'}
      aria-label={decorativo ? undefined : nome}
      aria-hidden={decorativo || undefined}
      {...props}
    >
      {mostrarImagem ? (
        <img className={estilos.imagem} src={src} alt="" draggable={false} onError={() => setSrcComErro(src)} />
      ) : (
        <span className={estilos.iniciais}>{obterIniciais(nome)}</span>
      )}
    </span>
  )
}
