import { Inbox } from 'lucide-react'
import type { HTMLAttributes, ReactNode, Ref } from 'react'
import type { Cor } from '../../tema'
import { juntarClasses } from '../../utilitarios'
import estilos from './EstadoVazio.module.css'

export type VarianteEstadoVazio = 'simples' | 'tracejada' | 'cartao'
export type TamanhoEstadoVazio = 'pequeno' | 'medio' | 'grande'

export type PropsEstadoVazio = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  titulo: ReactNode
  descricao?: ReactNode
  icone?: ReactNode
  ilustracao?: ReactNode
  tom?: Cor
  acoes?: ReactNode
  variante?: VarianteEstadoVazio
  tamanho?: TamanhoEstadoVazio
  ref?: Ref<HTMLDivElement>
}

export function EstadoVazio({
  titulo,
  descricao,
  icone,
  ilustracao,
  tom = 'azul',
  acoes,
  variante = 'simples',
  tamanho = 'medio',
  className,
  ...props
}: PropsEstadoVazio) {
  const tamanhoIcone = tamanho === 'pequeno' ? 22 : tamanho === 'grande' ? 34 : 28

  return (
    <div className={juntarClasses(estilos.vazio, className)} data-variante={variante} data-tamanho={tamanho} data-tom={tom} {...props}>
      {ilustracao ?? (
        <div className={estilos.arte} aria-hidden="true">
          <span className={estilos.anel} />
          <span className={estilos.cartaoFundo}>
            <span className={estilos.risco} />
            <span className={estilos.risco} />
          </span>
          <span className={estilos.ficha}>{icone ?? <Inbox size={tamanhoIcone} strokeWidth={1.8} />}</span>
          <span className={estilos.brilho} />
          <span className={estilos.brilho} />
        </div>
      )}
      <div className={estilos.texto}>
        <p className={estilos.titulo}>{titulo}</p>
        {descricao && <p className={estilos.descricao}>{descricao}</p>}
      </div>
      {acoes && <div className={estilos.acoes}>{acoes}</div>}
    </div>
  )
}
