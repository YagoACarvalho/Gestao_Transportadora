import { ArrowUpRight, Check } from 'lucide-react'
import { useContext, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { juntarClasses } from '../../utilitarios'
import { Atalho } from '../Atalho'
import { CaixaMarcacao } from '../CaixaMarcacao'
import { Interruptor } from '../Interruptor'
import { ContextoPainel, ContextoRaiz } from './contexto'
import estilos from './Menu.module.css'

export type TipoItemMenu = 'acao' | 'radio' | 'caixa' | 'interruptor'
export type TomItemMenu = 'neutro' | 'perigo' | 'primario'
export type IndicadorItemMenu = 'caixa' | 'check'

export type PropsItemMenu = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> & {
  children: ReactNode
  icone?: ReactNode
  descricao?: ReactNode
  meta?: ReactNode
  fim?: ReactNode
  atalho?: string | readonly string[]
  combinacao?: string
  tipo?: TipoItemMenu
  marcado?: boolean
  selecionado?: boolean
  indicador?: IndicadorItemMenu
  tom?: TomItemMenu
  externo?: boolean
  href?: string
  alvo?: string
  realce?: boolean
  manterAberto?: boolean
  textoBusca?: string
  tecla?: string
  onSelecionar?: () => void
}

export function ItemMenu({
  children,
  icone,
  descricao,
  meta,
  fim,
  atalho,
  combinacao,
  tipo,
  marcado,
  selecionado,
  indicador = 'caixa',
  tom = 'neutro',
  externo = false,
  href,
  alvo,
  realce = false,
  manterAberto,
  textoBusca,
  tecla,
  onSelecionar,
  onClick,
  disabled,
  className,
  ...props
}: PropsItemMenu) {
  const raiz = useContext(ContextoRaiz)
  const painel = useContext(ContextoPainel)
  const tipoFinal: TipoItemMenu = tipo ?? (selecionado !== undefined ? 'radio' : 'acao')
  const marcadoFinal = marcado ?? selecionado ?? false
  const manter = manterAberto ?? (tipoFinal === 'caixa' || tipoFinal === 'interruptor')
  const papel = tipoFinal === 'acao' ? 'menuitem' : tipoFinal === 'radio' ? 'menuitemradio' : 'menuitemcheckbox'
  const checkNoFim = (tipoFinal === 'radio' || (tipoFinal === 'caixa' && indicador === 'check')) && marcadoFinal

  const comum = {
    role: papel,
    tabIndex: -1,
    'aria-checked': tipoFinal === 'acao' ? undefined : marcadoFinal,
    'data-item-menu': '',
    'data-desabilitado': disabled || undefined,
    'data-tom': tom,
    'data-realce': realce || undefined,
    'data-com-descricao': descricao ? true : undefined,
    'data-texto': textoBusca ?? (typeof children === 'string' ? children : undefined),
    'data-tecla': tecla?.toLowerCase(),
    'aria-keyshortcuts': tecla,
    className: juntarClasses(estilos.item, className),
    onPointerMove: (evento: MouseEvent<HTMLElement>) => {
      if (!disabled && document.activeElement !== evento.currentTarget) evento.currentTarget.focus({ preventScroll: true })
    },
    onFocus: () => {
      if (painel?.subAberto) painel.agendarFecharSub()
    },
    onClick: (evento: MouseEvent<HTMLElement>) => {
      onClick?.(evento as MouseEvent<HTMLButtonElement>)
      if (evento.defaultPrevented || disabled) return
      onSelecionar?.()
      if (!manter) raiz?.fecharTudo(true)
    },
  }

  const conteudo = (
    <>
      {tipoFinal === 'caixa' && indicador === 'caixa' && <CaixaMarcacao marcado={marcadoFinal} />}
      {icone && <span className={estilos.icone}>{icone}</span>}
      <span className={estilos.textos}>
        <span className={estilos.titulo}>{children}</span>
        {descricao && <span className={estilos.descricao}>{descricao}</span>}
      </span>
      {meta && <span className={estilos.meta}>{meta}</span>}
      {checkNoFim && <Check className={estilos.marcado} aria-hidden="true" />}
      {fim && <span className={estilos.fim}>{fim}</span>}
      {combinacao ? (
        <Atalho combinacao={combinacao} className={estilos.atalho} />
      ) : (
        atalho && <Atalho teclas={atalho} variante={typeof atalho === 'string' ? 'texto' : 'tecla'} className={estilos.atalho} />
      )}
      {externo && <ArrowUpRight className={estilos.seta} aria-hidden="true" />}
      {tipoFinal === 'interruptor' && <Interruptor marcado={marcadoFinal} decorativo tamanho="pequeno" />}
    </>
  )

  if (href) {
    return (
      <a
        {...comum}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        href={disabled ? undefined : href}
        target={alvo}
        rel={alvo === '_blank' ? 'noreferrer' : undefined}
        aria-disabled={disabled || undefined}
      >
        {conteudo}
      </a>
    )
  }

  return (
    <button type="button" {...comum} disabled={disabled} {...props}>
      {conteudo}
    </button>
  )
}
