import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { juntarClasses } from '../../utilitarios'
import estilos from './Menu.module.css'

export type VarianteGrupoMenu = 'padrao' | 'suave'

export type PropsGrupoMenu = HTMLAttributes<HTMLDivElement> & {
  rotulo?: ReactNode
  variante?: VarianteGrupoMenu
}

export function GrupoMenu({ rotulo, variante = 'padrao', className, children, ...props }: PropsGrupoMenu) {
  const id = useId()
  return (
    <div
      role="group"
      aria-labelledby={rotulo ? id : undefined}
      className={juntarClasses(estilos.grupo, className)}
      data-variante={variante}
      {...props}
    >
      {rotulo && (
        <span id={id} className={estilos.rotulo}>
          {rotulo}
        </span>
      )}
      {children}
    </div>
  )
}

export type PropsRotuloMenu = HTMLAttributes<HTMLSpanElement>

export function RotuloMenu({ className, ...props }: PropsRotuloMenu) {
  return <span className={juntarClasses(estilos.rotulo, className)} {...props} />
}

export function SeparadorMenu({ className }: { className?: string }) {
  return <span role="separator" className={juntarClasses(estilos.separador, className)} />
}

export type PropsCabecalhoMenu = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  titulo?: ReactNode
  acoes?: ReactNode
  divisor?: boolean
  compacto?: boolean
}

export function CabecalhoMenu({
  titulo,
  acoes,
  divisor = true,
  compacto = false,
  className,
  children,
  ...props
}: PropsCabecalhoMenu) {
  return (
    <div
      className={juntarClasses(estilos.cabecalho, className)}
      data-sem-divisor={divisor ? undefined : true}
      data-compacto={compacto || undefined}
      {...props}
    >
      {children ?? (
        <>
          <span className={estilos.cabecalhoTitulo}>{titulo}</span>
          {acoes && <span className={estilos.cabecalhoAcoes}>{acoes}</span>}
        </>
      )}
    </div>
  )
}

export type VarianteRodapeMenu = 'padrao' | 'suave'

export type PropsRodapeMenu = HTMLAttributes<HTMLDivElement> & {
  variante?: VarianteRodapeMenu
  divisor?: boolean
}

export function RodapeMenu({ variante = 'padrao', divisor = true, className, ...props }: PropsRodapeMenu) {
  return (
    <div
      className={juntarClasses(estilos.rodape, className)}
      data-variante={variante}
      data-sem-divisor={divisor ? undefined : true}
      {...props}
    />
  )
}

export type PropsTextoMenu = HTMLAttributes<HTMLParagraphElement>

export function TextoMenu({ className, ...props }: PropsTextoMenu) {
  return <p className={juntarClasses(estilos.texto, className)} {...props} />
}

export type PropsSecaoMenu = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  titulo?: ReactNode
  descricao?: ReactNode
  acao?: ReactNode
}

export function SecaoMenu({ titulo, descricao, acao, className, children, ...props }: PropsSecaoMenu) {
  return (
    <div className={juntarClasses(estilos.secao, className)} {...props}>
      <div className={estilos.secaoConteudo}>
        {titulo && <span className={estilos.secaoTitulo}>{titulo}</span>}
        {descricao && <span className={estilos.secaoDescricao}>{descricao}</span>}
        {children}
      </div>
      {acao}
    </div>
  )
}
