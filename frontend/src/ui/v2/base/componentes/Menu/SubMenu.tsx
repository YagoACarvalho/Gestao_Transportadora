import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useContext, useEffect, useId, useRef, type ReactNode } from 'react'
import { juntarClasses } from '../../utilitarios'
import { PainelFlutuante } from '../PainelFlutuante'
import { ContextoPainel, ContextoRaiz, SELETOR_ITEM_MENU, type TamanhoMenu, type VarianteMenu } from './contexto'
import { PainelMenu } from './Menu'
import estilos from './Menu.module.css'

export type LadoSubMenu = 'direita' | 'esquerda'

export type PropsSubMenu = {
  rotulo: ReactNode
  children: ReactNode
  icone?: ReactNode
  descricao?: ReactNode
  meta?: ReactNode
  fim?: ReactNode
  lado?: LadoSubMenu
  largura?: number | string
  tamanho?: TamanhoMenu
  variante?: VarianteMenu
  realce?: boolean
  desabilitado?: boolean
  rotuloPainel?: string
  className?: string
}

export function SubMenu({
  rotulo,
  children,
  icone,
  descricao,
  meta,
  fim,
  lado = 'direita',
  largura,
  tamanho,
  variante,
  realce = false,
  desabilitado = false,
  rotuloPainel,
  className,
}: PropsSubMenu) {
  const painelPai = useContext(ContextoPainel)
  const raiz = useContext(ContextoRaiz)
  const id = useId()
  const itemRef = useRef<HTMLButtonElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const abrirTimer = useRef(0)
  const focarPrimeiro = useRef(false)
  const aberto = painelPai?.subAberto === id
  const Seta = lado === 'esquerda' ? ChevronLeft : ChevronRight

  useEffect(() => {
    if (!aberto || !focarPrimeiro.current) return
    focarPrimeiro.current = false
    subRef.current?.querySelector<HTMLElement>(SELETOR_ITEM_MENU)?.focus({ preventScroll: true })
  }, [aberto])

  useEffect(() => () => window.clearTimeout(abrirTimer.current), [])

  function abrir(focar: boolean) {
    focarPrimeiro.current = focar
    painelPai?.abrirSub(id)
  }

  function voltar() {
    painelPai?.fecharSub()
    itemRef.current?.focus()
  }

  const teclaAbrir = lado === 'esquerda' ? 'ArrowLeft' : 'ArrowRight'
  const teclaVoltar = lado === 'esquerda' ? 'ArrowRight' : 'ArrowLeft'

  return (
    <>
      <button
        ref={itemRef}
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? id : undefined}
        tabIndex={-1}
        disabled={desabilitado}
        data-item-menu=""
        data-desabilitado={desabilitado || undefined}
        data-aberto={aberto || undefined}
        data-realce={realce || undefined}
        data-com-descricao={descricao ? true : undefined}
        data-texto={typeof rotulo === 'string' ? rotulo : undefined}
        className={juntarClasses(estilos.item, className)}
        onPointerMove={(evento) => {
          if (document.activeElement !== evento.currentTarget) evento.currentTarget.focus({ preventScroll: true })
        }}
        onFocus={() => painelPai?.cancelarFecharSub()}
        onPointerEnter={() => {
          painelPai?.cancelarFecharSub()
          window.clearTimeout(abrirTimer.current)
          abrirTimer.current = window.setTimeout(() => abrir(false), 90)
        }}
        onPointerLeave={() => {
          window.clearTimeout(abrirTimer.current)
          if (aberto) painelPai?.agendarFecharSub()
        }}
        onClick={(evento) => abrir(evento.detail === 0)}
        onKeyDown={(evento) => {
          if (evento.key !== teclaAbrir && evento.key !== 'Enter' && evento.key !== ' ') return
          evento.preventDefault()
          evento.stopPropagation()
          abrir(true)
        }}
      >
        {lado === 'esquerda' && <Seta className={estilos.seta} aria-hidden="true" />}
        {icone && <span className={estilos.icone}>{icone}</span>}
        <span className={estilos.textos}>
          <span className={estilos.titulo}>{rotulo}</span>
          {descricao && <span className={estilos.descricao}>{descricao}</span>}
        </span>
        {meta && <span className={estilos.meta}>{meta}</span>}
        {fim && <span className={estilos.fim}>{fim}</span>}
        {lado === 'direita' && <Seta className={estilos.seta} aria-hidden="true" />}
      </button>
      <PainelFlutuante
        aberto={aberto}
        ancora={itemRef}
        lado={lado}
        alinhamento="inicio"
        deslocamento={6}
        onFechar={(motivo) => (motivo === 'escape' ? raiz?.fecharTudo(true) : painelPai?.fecharSub())}
        onPointerEnter={() => painelPai?.cancelarFecharSub()}
        onPointerLeave={() => painelPai?.agendarFecharSub()}
      >
        <PainelMenu
          ref={subRef}
          id={id}
          rotulo={rotuloPainel ?? (typeof rotulo === 'string' ? rotulo : undefined)}
          tamanho={tamanho ?? painelPai?.tamanho}
          variante={variante}
          largura={largura}
          onKeyDown={(evento) => {
            if (evento.key === teclaVoltar) {
              evento.preventDefault()
              voltar()
            } else if (evento.key === 'Tab') {
              evento.preventDefault()
              raiz?.fecharTudo(true)
            }
          }}
        >
          {children}
        </PainelMenu>
      </PainelFlutuante>
    </>
  )
}
