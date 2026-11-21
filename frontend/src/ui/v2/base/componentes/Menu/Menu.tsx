import {
  useCallback,
  useEffect,
  useMemo,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { useControlavel, type AlinhamentoFlutuante, type AncoraFlutuante, type LadoFlutuante } from '../../hooks'
import { combinarRefs, juntarClasses, normalizarTexto } from '../../utilitarios'

function atribuirRef<T>(ref: Ref<T> | undefined, valor: T | null) {
  if (typeof ref === 'function') ref(valor)
  else if (ref) (ref as { current: T | null }).current = valor
}
import { PainelFlutuante } from '../PainelFlutuante'
import { Slot } from '../Slot'
import {
  ContextoPainel,
  ContextoRaiz,
  SELETOR_ITEM_MENU,
  useFocoInicialMenu,
  type FocoInicialMenu,
  type TamanhoMenu,
  type VarianteMenu,
} from './contexto'
import estilos from './Menu.module.css'

export type PropsPainelMenu = HTMLAttributes<HTMLDivElement> & {
  rotulo?: string
  tamanho?: TamanhoMenu
  variante?: VarianteMenu
  superficie?: boolean
  largura?: number | string
  ref?: Ref<HTMLDivElement>
}

export function PainelMenu({
  rotulo,
  tamanho = 'medio',
  variante = 'padrao',
  superficie = false,
  largura,
  className,
  style,
  children,
  onKeyDown,
  onPointerLeave,
  ref,
  ...props
}: PropsPainelMenu) {
  const elementoRef = useRef<HTMLDivElement>(null)
  const temporizador = useRef(0)
  const busca = useRef({ texto: '', expira: 0 })
  const [subAberto, setSubAberto] = useState<string | null>(null)

  const contexto = useMemo(
    () => ({
      subAberto,
      tamanho,
      abrirSub: (id: string) => {
        window.clearTimeout(temporizador.current)
        setSubAberto(id)
      },
      fecharSub: () => {
        window.clearTimeout(temporizador.current)
        setSubAberto(null)
      },
      agendarFecharSub: () => {
        window.clearTimeout(temporizador.current)
        temporizador.current = window.setTimeout(() => setSubAberto(null), 180)
      },
      cancelarFecharSub: () => window.clearTimeout(temporizador.current),
    }),
    [subAberto, tamanho],
  )

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  function itensProprios() {
    const elemento = elementoRef.current
    if (!elemento) return []
    return Array.from(elemento.querySelectorAll<HTMLElement>(SELETOR_ITEM_MENU)).filter(
      (item) => item.closest('[data-painel-menu]') === elemento,
    )
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(evento)
    // eventos de submenus em portal sobem pela árvore do React; só tratamos os deste painel
    if (evento.defaultPrevented || !evento.currentTarget.contains(evento.target as Node)) return
    if (evento.target instanceof HTMLInputElement || evento.target instanceof HTMLTextAreaElement) return
    const itens = itensProprios()
    if (!itens.length) return
    const atual = itens.indexOf(document.activeElement as HTMLElement)
    const ir = (indice: number) => itens[(indice + itens.length) % itens.length]?.focus()

    if (evento.key === 'ArrowDown') ir(atual + 1)
    else if (evento.key === 'ArrowUp') ir(atual === -1 ? itens.length - 1 : atual - 1)
    else if (evento.key === 'Home') ir(0)
    else if (evento.key === 'End') ir(itens.length - 1)
    else if (evento.key.length === 1 && /\S/.test(evento.key) && !evento.ctrlKey && !evento.metaKey && !evento.altKey) {
      const comTecla = itens.find((item) => item.dataset.tecla === evento.key.toLowerCase())
      if (comTecla) {
        evento.preventDefault()
        comTecla.click()
        return
      }
      const agora = Date.now()
      const continuar = agora < busca.current.expira
      busca.current = { texto: (continuar ? busca.current.texto : '') + normalizarTexto(evento.key), expira: agora + 600 }
      const inicio = continuar ? Math.max(atual, 0) : atual + 1
      const ordem = [...itens.slice(inicio), ...itens.slice(0, inicio)]
      const achado = ordem.find((item) =>
        normalizarTexto(item.dataset.texto ?? item.textContent ?? '').trim().startsWith(busca.current.texto),
      )
      if (!achado) return
      achado.focus()
    } else return
    evento.preventDefault()
  }

  return (
    <ContextoPainel.Provider value={contexto}>
      <div
        ref={combinarRefs(elementoRef, ref)}
        role="menu"
        aria-label={rotulo}
        tabIndex={-1}
        data-painel-menu=""
        data-tamanho={tamanho}
        data-variante={variante}
        data-superficie={superficie || undefined}
        className={juntarClasses(estilos.painel, className)}
        style={{ width: largura, ...style }}
        onKeyDown={aoTeclar}
        onPointerLeave={(evento) => {
          onPointerLeave?.(evento)
          const elemento = elementoRef.current
          if (!subAberto && elemento?.contains(document.activeElement)) elemento.focus({ preventScroll: true })
        }}
        {...props}
      >
        {children}
      </div>
    </ContextoPainel.Provider>
  )
}

type PropsGatilhoMenu = {
  onClick?: (evento: MouseEvent<HTMLElement>) => void
  onKeyDown?: (evento: KeyboardEvent<HTMLElement>) => void
  ref?: Ref<HTMLElement>
}

type PropsComunsMenu = {
  children: ReactNode
  tamanho?: TamanhoMenu
  variante?: VarianteMenu
  largura?: number | string
  rotulo?: string
  desabilitado?: boolean
  onMudarAberto?: (aberto: boolean) => void
  className?: string
}

export type PropsMenuSuspenso = PropsComunsMenu & {
  gatilho: ReactElement<PropsGatilhoMenu & Record<string, unknown>>
  aberto?: boolean
  lado?: LadoFlutuante
  alinhamento?: AlinhamentoFlutuante
  deslocamento?: number
  larguraDoGatilho?: boolean
}

export function MenuSuspenso({
  gatilho,
  children,
  aberto,
  onMudarAberto,
  lado = 'baixo',
  alinhamento = 'inicio',
  deslocamento = 8,
  largura,
  larguraDoGatilho = false,
  tamanho,
  variante,
  rotulo,
  desabilitado = false,
  className,
}: PropsMenuSuspenso) {
  const [estaAberto, mudarAberto] = useControlavel(aberto, false, onMudarAberto)
  const gatilhoRef = useRef<HTMLElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const foco = useRef<FocoInicialMenu>('painel')
  const id = useId()

  const raiz = useMemo(
    () => ({
      fecharTudo: (devolverFoco = true) => {
        mudarAberto(false)
        if (devolverFoco) gatilhoRef.current?.focus()
      },
    }),
    [mudarAberto],
  )

  useFocoInicialMenu(estaAberto, painelRef, foco)

  function abrir(inicial: FocoInicialMenu) {
    foco.current = inicial
    mudarAberto(true)
  }

  const original = gatilho.props
  const refOriginal = original.ref
  const atribuirGatilho = useCallback(
    (no: HTMLElement | null) => {
      gatilhoRef.current = no
      atribuirRef(refOriginal, no)
    },
    [refOriginal],
  )
  const propsGatilho: PropsGatilhoMenu & Record<string, unknown> = {
    ref: atribuirGatilho,
    'aria-haspopup': 'menu',
    'aria-expanded': estaAberto,
    'aria-controls': estaAberto ? id : undefined,
    'data-aberto': estaAberto || undefined,
    onClick: (evento: MouseEvent<HTMLElement>) => {
      original.onClick?.(evento)
      if (evento.defaultPrevented || desabilitado) return
      if (estaAberto) raiz.fecharTudo(false)
      // detail 0 significa clique vindo do teclado (Enter ou Espaço)
      else abrir(evento.detail === 0 ? 'primeiro' : 'painel')
    },
    onKeyDown: (evento: KeyboardEvent<HTMLElement>) => {
      original.onKeyDown?.(evento)
      if (evento.defaultPrevented || desabilitado) return
      if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return
      evento.preventDefault()
      abrir(evento.key === 'ArrowDown' ? 'primeiro' : 'ultimo')
    },
  }

  return (
    <>
      <Slot filho={gatilho} propriedades={propsGatilho} />
      <ContextoRaiz.Provider value={raiz}>
        <PainelFlutuante
          aberto={estaAberto}
          ancora={gatilhoRef}
          lado={lado}
          alinhamento={alinhamento}
          deslocamento={deslocamento}
          largura={larguraDoGatilho ? 'ancora' : undefined}
          onFechar={(motivo) => raiz.fecharTudo(motivo === 'escape')}
        >
          <PainelMenu
            ref={painelRef}
            id={id}
            rotulo={rotulo}
            tamanho={tamanho}
            variante={variante}
            largura={largura}
            className={className}
            onKeyDown={(evento) => {
              if (evento.key !== 'Tab') return
              evento.preventDefault()
              raiz.fecharTudo(true)
            }}
          >
            {children}
          </PainelMenu>
        </PainelFlutuante>
      </ContextoRaiz.Provider>
    </>
  )
}

type PropsAlvoContexto = {
  onContextMenu?: (evento: MouseEvent<HTMLElement>) => void
  onKeyDown?: (evento: KeyboardEvent<HTMLElement>) => void
  ref?: Ref<HTMLElement>
}

export type PropsMenuContexto = PropsComunsMenu & {
  alvo: ReactElement<PropsAlvoContexto & Record<string, unknown>>
}

export function MenuContexto({
  alvo,
  children,
  onMudarAberto,
  largura,
  tamanho,
  variante,
  rotulo,
  desabilitado = false,
  className,
}: PropsMenuContexto) {
  const [aberto, setAberto] = useState(false)
  const alvoRef = useRef<HTMLElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const ancoraRef = useRef<AncoraFlutuante>({ getBoundingClientRect: () => new DOMRect() })
  const foco = useRef<FocoInicialMenu>('painel')

  function mudar(valor: boolean) {
    setAberto(valor)
    onMudarAberto?.(valor)
  }

  const raiz = {
    fecharTudo: (devolverFoco = true) => {
      mudar(false)
      if (devolverFoco) alvoRef.current?.focus()
    },
  }

  useFocoInicialMenu(aberto, painelRef, foco)

  function abrirEm(x: number, y: number, inicial: FocoInicialMenu) {
    ancoraRef.current = { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }
    foco.current = inicial
    mudar(true)
  }

  const original = alvo.props
  const refOriginal = original.ref
  const atribuirAlvo = useCallback(
    (no: HTMLElement | null) => {
      alvoRef.current = no
      atribuirRef(refOriginal, no)
    },
    [refOriginal],
  )
  const propsAlvo: PropsAlvoContexto & Record<string, unknown> = {
    ref: atribuirAlvo,
    onContextMenu: (evento: MouseEvent<HTMLElement>) => {
      original.onContextMenu?.(evento)
      if (evento.defaultPrevented || desabilitado) return
      evento.preventDefault()
      abrirEm(evento.clientX, evento.clientY, 'painel')
    },
    onKeyDown: (evento: KeyboardEvent<HTMLElement>) => {
      original.onKeyDown?.(evento)
      if (evento.defaultPrevented || desabilitado) return
      if (evento.key !== 'ContextMenu' && !(evento.shiftKey && evento.key === 'F10')) return
      evento.preventDefault()
      const caixa = evento.currentTarget.getBoundingClientRect()
      abrirEm(caixa.left + 12, caixa.bottom, 'primeiro')
    },
  }

  return (
    <>
      <Slot filho={alvo} propriedades={propsAlvo} />
      <ContextoRaiz.Provider value={raiz}>
        <PainelFlutuante
          aberto={aberto}
          ancora={ancoraRef}
          deslocamento={2}
          onFechar={(motivo) => raiz.fecharTudo(motivo === 'escape')}
        >
          <PainelMenu
            ref={painelRef}
            rotulo={rotulo}
            tamanho={tamanho}
            variante={variante}
            largura={largura}
            className={className}
            onKeyDown={(evento) => {
              if (evento.key !== 'Tab') return
              evento.preventDefault()
              raiz.fecharTudo(true)
            }}
          >
            {children}
          </PainelMenu>
        </PainelFlutuante>
      </ContextoRaiz.Provider>
    </>
  )
}
