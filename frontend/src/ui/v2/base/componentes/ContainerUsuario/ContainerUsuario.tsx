import { Fragment, isValidElement, type ElementType, type HTMLAttributes, type MouseEventHandler, type ReactNode } from 'react'
import type { Cor } from '../../tema'
import { juntarClasses } from '../../utilitarios'
import { Avatar } from '../Avatar'
import { Destaque } from '../Destaque'
import { SeloVerificado } from '../SeloVerificado'
import { Texto, type PesoTexto, type TomTexto } from '../Texto'
import estilos from './ContainerUsuario.module.css'

export type SegmentoTexto = {
  texto: string
  tom?: TomTexto
  peso?: PesoTexto
}

export type SegmentoUsuario = ReactNode | SegmentoTexto
export type TamanhoContainerUsuario = 'pequeno' | 'medio' | 'grande'
export type VarianteContainerUsuario = 'padrao' | 'perfil'

export type PropsContainerUsuario = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onClick'> & {
  nome: string
  avatarSrc?: string
  corAvatar?: Cor
  avatar?: ReactNode
  verificado?: boolean
  descricao?: SegmentoUsuario | SegmentoUsuario[]
  detalhe?: SegmentoUsuario | SegmentoUsuario[]
  tamanho?: TamanhoContainerUsuario
  variante?: VarianteContainerUsuario
  separador?: ReactNode
  termoBusca?: string
  acao?: ReactNode
  href?: string
  onClick?: MouseEventHandler<HTMLElement>
  selecionado?: boolean
  desabilitado?: boolean
  como?: 'div' | 'span' | 'li'
}

const TAMANHO_AVATAR: Record<TamanhoContainerUsuario, number> = { pequeno: 32, medio: 44, grande: 56 }
const TAMANHO_VERIFICADO: Record<TamanhoContainerUsuario, number> = { pequeno: 14, medio: 16, grande: 18 }

function ehSegmentoTexto(segmento: SegmentoUsuario): segmento is SegmentoTexto {
  return typeof segmento === 'object' && segmento !== null && !isValidElement(segmento) && 'texto' in segmento
}

function renderizarLinha(
  segmentos: SegmentoUsuario | SegmentoUsuario[] | undefined,
  tomPadrao: TomTexto,
  classe: string,
  separador: ReactNode,
  termoBusca?: string,
) {
  const lista = (Array.isArray(segmentos) ? segmentos : [segmentos]).filter(
    (segmento) => segmento !== null && segmento !== undefined && segmento !== false && segmento !== '',
  )
  if (!lista.length) return null

  return (
    <span className={juntarClasses(estilos.linha, classe)}>
      {lista.map((segmento, indice) => (
        <Fragment key={indice}>
          {indice > 0 && (
            <span className={estilos.separador} aria-hidden="true">
              {separador}
            </span>
          )}
          {ehSegmentoTexto(segmento) ? (
            <Texto variante="herdar" tom={segmento.tom ?? tomPadrao} peso={segmento.peso}>
              <Destaque texto={segmento.texto} termo={termoBusca} />
            </Texto>
          ) : typeof segmento === 'string' ? (
            <Texto variante="herdar" tom={tomPadrao}>
              <Destaque texto={segmento} termo={termoBusca} />
            </Texto>
          ) : (
            segmento
          )}
        </Fragment>
      ))}
    </span>
  )
}

export function ContainerUsuario({
  nome,
  avatarSrc,
  corAvatar,
  avatar,
  verificado = false,
  descricao,
  detalhe,
  tamanho = 'medio',
  variante = 'padrao',
  separador = '/',
  termoBusca,
  acao,
  href,
  onClick,
  selecionado,
  desabilitado = false,
  como = 'div',
  className,
  ...props
}: PropsContainerUsuario) {
  const interativo = Boolean(href || onClick)
  const Elemento = como as ElementType

  const principal = (
    <>
      <span className={estilos.avatar}>
        {avatar ?? (
          <Avatar nome={nome} src={avatarSrc} cor={corAvatar} tamanho={TAMANHO_AVATAR[tamanho]} decorativo />
        )}
      </span>
      <span className={estilos.textos}>
        <span className={estilos.linhaNome}>
          <Texto variante="herdar" truncar className={estilos.nome}>
            <Destaque texto={nome} termo={termoBusca} />
          </Texto>
          {verificado && <SeloVerificado tamanho={TAMANHO_VERIFICADO[tamanho]} />}
        </span>
        {renderizarLinha(descricao, 'suave', estilos.descricao, separador, termoBusca)}
        {renderizarLinha(detalhe, 'fraco', estilos.detalhe, separador, termoBusca)}
      </span>
    </>
  )

  const area = href ? (
    <a
      className={estilos.principal}
      href={desabilitado ? undefined : href}
      aria-disabled={desabilitado || undefined}
      aria-current={selecionado ? 'page' : undefined}
      onClick={desabilitado ? undefined : onClick}
    >
      {principal}
    </a>
  ) : onClick ? (
    <button
      type="button"
      className={estilos.principal}
      disabled={desabilitado}
      aria-pressed={selecionado}
      onClick={onClick}
    >
      {principal}
    </button>
  ) : (
    <span className={estilos.principal}>{principal}</span>
  )

  return (
    <Elemento
      className={juntarClasses(estilos.container, className)}
      data-tamanho={tamanho}
      data-variante={variante}
      data-interativo={interativo || undefined}
      data-selecionado={selecionado || undefined}
      data-desabilitado={desabilitado || undefined}
      {...props}
    >
      {area}
      {acao && <span className={estilos.acao}>{acao}</span>}
    </Elemento>
  )
}
