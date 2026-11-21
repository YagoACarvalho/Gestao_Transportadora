import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ElementType, HTMLAttributes, ReactNode, Ref } from 'react'
import type { Cor } from '../../tema'
import { juntarClasses } from '../../utilitarios'
import { Proporcao, type RazaoProporcao } from '../Proporcao'
import estilos from './Cartao.module.css'

export type PropsCartaoCabecalho = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  icone?: ReactNode
  titulo?: ReactNode
  descricao?: ReactNode
  acoes?: ReactNode
  tom?: Cor
  nivelTitulo?: 2 | 3 | 4 | 5
  ref?: Ref<HTMLElement>
}

export function CartaoCabecalho({ icone, titulo, descricao, acoes, tom = 'azul', nivelTitulo = 3, className, children, ...props }: PropsCartaoCabecalho) {
  const Titulo = `h${nivelTitulo}` as ElementType
  return (
    <header className={juntarClasses(estilos.cabecalho, className)} data-tom={tom} {...props}>
      {icone && (
        <span className={estilos.icone} aria-hidden="true">
          {icone}
        </span>
      )}
      <div className={estilos.textos}>
        {titulo && <Titulo className={estilos.titulo}>{titulo}</Titulo>}
        {descricao && <p className={estilos.descricao}>{descricao}</p>}
        {children}
      </div>
      {acoes && (
        <div className={estilos.acoes} data-cartao-acao>
          {acoes}
        </div>
      )}
    </header>
  )
}

export type PropsCartaoCorpo = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }

export function CartaoCorpo({ className, ...props }: PropsCartaoCorpo) {
  return <div className={juntarClasses(estilos.corpo, className)} {...props} />
}

export type PropsCartaoRodape = HTMLAttributes<HTMLElement> & {
  separado?: boolean
  alinhar?: 'inicio' | 'fim' | 'entre'
  ref?: Ref<HTMLElement>
}

export function CartaoRodape({ separado = false, alinhar = 'entre', className, ...props }: PropsCartaoRodape) {
  return <footer className={juntarClasses(estilos.rodape, className)} data-separado={separado || undefined} data-alinhar={alinhar} {...props} />
}

export type PropsCartaoMidia = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  proporcao?: RazaoProporcao
  src?: string
  alt?: string
  ilustracao?: boolean
  tom?: Cor
  children?: ReactNode
  ref?: Ref<HTMLElement>
}

export function CartaoMidia({ proporcao = '16/9', src, alt = '', ilustracao = false, tom = 'azul', className, children, ...props }: PropsCartaoMidia) {
  return (
    <Proporcao
      razao={proporcao}
      className={juntarClasses(estilos.midia, className)}
      data-ilustracao={ilustracao || undefined}
      data-tom={tom}
      {...props}
    >
      {src ? <img src={src} alt={alt} loading="lazy" draggable={false} /> : null}
      {children}
    </Proporcao>
  )
}

type PropsBaseLink = { className?: string; children?: ReactNode }
export type PropsCartaoLink = PropsBaseLink &
  (({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>))

export function CartaoLink({ className, children, ...props }: PropsCartaoLink) {
  if (props.href !== undefined) {
    return (
      <a className={juntarClasses(estilos.link, className)} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={juntarClasses(estilos.link, className)} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  )
}
