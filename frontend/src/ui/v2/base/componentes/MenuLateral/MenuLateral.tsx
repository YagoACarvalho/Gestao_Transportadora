import { ChevronLeft, Search, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { useAtalho } from '../../hooks'
import { juntarClasses, normalizarTexto } from '../../utilitarios'
import { Atalho } from '../Atalho'
import { BotaoIcone } from '../BotaoIcone'
import { useCascaApp } from '../CascaApp/contexto'
import { Dica } from '../Dica'
import {
  algumCasa,
  ContextoListaMenuLateral,
  ContextoMenuLateral,
  SELETOR_ITEM_MENU_LATERAL,
  type TamanhoMenuLateral,
  type ValorMenuLateral,
  type VarianteMenuLateral,
} from './contexto'
import { ariaAtalho } from './ariaAtalho'
import estilos from './MenuLateral.module.css'

export type PropsBuscaMenuLateral = {
  placeholder?: string
  /** combinação que foca a busca; false desliga */
  atalho?: string | false
  rotulo?: string
}

export type PropsMenuLateral = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  children: ReactNode
  rotulo?: string
  valor?: string | null
  valorPadrao?: string | null
  onNavegar?: (valor: string) => void
  recolhido?: boolean
  recolhidoPadrao?: boolean
  onMudarRecolhido?: (recolhido: boolean) => void
  recolhivel?: boolean
  cabecalho?: ReactNode
  busca?: boolean | PropsBuscaMenuLateral
  rodape?: ReactNode
  variante?: VarianteMenuLateral
  tamanho?: TamanhoMenuLateral
  largura?: number
  registrarAtalhos?: boolean
  mensagemVazia?: string
  ref?: Ref<HTMLElement>
}

export function MenuLateral({
  children,
  rotulo = 'Navegação principal',
  valor,
  valorPadrao = null,
  onNavegar,
  recolhido,
  recolhidoPadrao = false,
  onMudarRecolhido,
  recolhivel = true,
  cabecalho,
  busca,
  rodape,
  variante = 'padrao',
  tamanho = 'medio',
  largura = 264,
  registrarAtalhos = true,
  mensagemVazia = 'Nada no menu com',
  className,
  style,
  ref,
  ...props
}: PropsMenuLateral) {
  const casca = useCascaApp()
  const naGaveta = casca?.naGaveta ?? false
  const [ativoInterno, setAtivoInterno] = useState(valorPadrao)
  const [recolhidoInterno, setRecolhidoInterno] = useState(recolhidoPadrao)
  const [textoBusca, setTextoBusca] = useState('')
  const entradaRef = useRef<HTMLInputElement>(null)
  const focarBuscaAoExpandir = useRef(false)
  const idCorpo = useId()

  const ativo = valor !== undefined ? valor : ativoInterno
  const estaRecolhido = naGaveta ? false : (recolhido ?? casca?.recolhido ?? recolhidoInterno)
  const configBusca = busca === true ? {} : busca || null
  const atalhoBusca = configBusca?.atalho === undefined ? '/' : configBusca.atalho
  const buscaEfetiva = estaRecolhido || !configBusca ? '' : textoBusca
  const termo = normalizarTexto(buscaEfetiva.trim())

  function mudarRecolhido(novo: boolean) {
    if (recolhido === undefined) {
      if (casca && !naGaveta) casca.mudarRecolhido(novo)
      else setRecolhidoInterno(novo)
    }
    onMudarRecolhido?.(novo)
  }

  function navegar(novo: string) {
    if (valor === undefined) setAtivoInterno(novo)
    onNavegar?.(novo)
    if (naGaveta) casca?.fecharGaveta()
  }

  function focarBusca() {
    if (!estaRecolhido) {
      entradaRef.current?.focus()
      return
    }
    focarBuscaAoExpandir.current = true
    mudarRecolhido(false)
  }

  useAtalho(atalhoBusca || '/', focarBusca, { ativo: Boolean(configBusca && atalhoBusca && registrarAtalhos) })

  useEffect(() => {
    if (estaRecolhido || !focarBuscaAoExpandir.current) return
    focarBuscaAoExpandir.current = false
    entradaRef.current?.focus()
  }, [estaRecolhido])

  const contexto: ValorMenuLateral = {
    recolhido: estaRecolhido,
    mudarRecolhido,
    valor: ativo,
    navegar,
    termo,
    busca: buscaEfetiva,
    registrarAtalhos,
    naGaveta,
  }

  function itensNavegaveis(raiz: HTMLElement) {
    return Array.from(raiz.querySelectorAll<HTMLElement>(SELETOR_ITEM_MENU_LATERAL)).filter(
      (item) => !item.closest('[inert], [hidden]') && !item.matches(':disabled'),
    )
  }

  // na captura: as setas navegam pelo menu antes que o gatilho de um submenu recolhido as use para abrir
  function aoTeclar(evento: KeyboardEvent<HTMLElement>) {
    const raiz = evento.currentTarget
    const alvo = evento.target as HTMLElement
    if (!raiz.contains(alvo) || evento.altKey || evento.ctrlKey || evento.metaKey) return
    const naBusca = alvo === entradaRef.current
    if (!naBusca && !alvo.matches(SELETOR_ITEM_MENU_LATERAL)) return
    const itens = itensNavegaveis(raiz)
    if (!itens.length) return
    const atual = itens.indexOf(alvo)
    const ir = (indice: number) => itens[(indice + itens.length) % itens.length]?.focus()
    const gatilhoGrupo = alvo.dataset.gatilhoGrupo !== undefined
    const expandido = alvo.getAttribute('aria-expanded') === 'true'
    const abreMenu = alvo.getAttribute('aria-haspopup') === 'menu'

    if (evento.key === 'ArrowDown') ir(naBusca ? 0 : atual + 1)
    else if (naBusca) return
    else if (evento.key === 'ArrowUp') ir(atual - 1)
    else if (evento.key === 'Home') ir(0)
    else if (evento.key === 'End') ir(itens.length - 1)
    else if (evento.key === 'ArrowRight' && gatilhoGrupo) {
      if (expandido && !abreMenu) ir(atual + 1)
      else alvo.click()
    } else if (evento.key === 'ArrowLeft') {
      if (gatilhoGrupo && expandido && !abreMenu) alvo.click()
      else {
        const pai = alvo.closest('[data-regiao-grupo]')?.parentElement?.querySelector<HTMLElement>(':scope > [data-gatilho-grupo]')
        if (!pai) return
        pai.focus()
      }
    } else return
    evento.preventDefault()
    evento.stopPropagation()
  }

  function aoTeclarBusca(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Escape') {
      if (!textoBusca) return
      evento.preventDefault()
      evento.stopPropagation()
      setTextoBusca('')
    } else if (evento.key === 'Enter') {
      const raiz = evento.currentTarget.closest('nav')
      const primeiro = raiz && itensNavegaveis(raiz).find((item) => item !== evento.currentTarget && item.dataset.gatilhoGrupo === undefined)
      if (!primeiro || !termo) return
      evento.preventDefault()
      primeiro.click()
      setTextoBusca('')
    }
  }

  const semResultado = termo !== '' && !algumCasa(children, termo)
  const rotuloBusca = configBusca?.rotulo ?? 'Buscar no menu'

  return (
    <ContextoMenuLateral.Provider value={contexto}>
      <nav
        ref={ref}
        aria-label={rotulo}
        className={juntarClasses(estilos.menu, className)}
        data-variante={variante}
        data-tamanho={tamanho}
        data-recolhido={estaRecolhido || undefined}
        data-gaveta={naGaveta || undefined}
        style={{ '--menu-largura': `${largura}px`, ...style } as CSSProperties}
        onKeyDownCapture={aoTeclar}
        {...props}
      >
        <div className={estilos.painel}>
          {(cabecalho || naGaveta) && (
            <div className={estilos.cabecalho}>
              <div className={estilos.conteudoCabecalho}>{cabecalho}</div>
              {naGaveta && <BotaoIcone rotulo="Fechar menu" icone={<X />} tamanho="pequeno" onClick={() => casca?.fecharGaveta()} />}
            </div>
          )}

          {configBusca &&
            (estaRecolhido ? (
              <div className={estilos.areaBusca}>
                <Dica conteudo={rotuloBusca} atalho={atalhoBusca || undefined} lado="direita">
                  <button type="button" className={estilos.botaoBusca} data-item-menu-lateral="" aria-label={rotuloBusca} onClick={focarBusca}>
                    <Search aria-hidden="true" />
                  </button>
                </Dica>
              </div>
            ) : (
              <div className={estilos.areaBusca}>
                <label className={estilos.busca}>
                  <Search aria-hidden="true" />
                  <input
                    ref={entradaRef}
                    type="search"
                    className={estilos.entradaBusca}
                    placeholder={configBusca.placeholder ?? 'Buscar'}
                    aria-label={rotuloBusca}
                    aria-controls={idCorpo}
                    aria-keyshortcuts={ariaAtalho(atalhoBusca)}
                    autoComplete="off"
                    spellCheck={false}
                    value={textoBusca}
                    onChange={(evento) => setTextoBusca(evento.target.value)}
                    onKeyDown={aoTeclarBusca}
                  />
                  {textoBusca ? (
                    <button
                      type="button"
                      className={estilos.limparBusca}
                      aria-label="Limpar busca"
                      onClick={() => {
                        setTextoBusca('')
                        entradaRef.current?.focus()
                      }}
                    >
                      <X aria-hidden="true" />
                    </button>
                  ) : (
                    atalhoBusca && <Atalho combinacao={atalhoBusca} variante="contorno" className={estilos.atalhoBusca} />
                  )}
                </label>
              </div>
            ))}

          <div id={idCorpo} className={estilos.corpo}>
            <ContextoListaMenuLateral.Provider value>
              <ul className={estilos.lista} role="list">
                {children}
              </ul>
            </ContextoListaMenuLateral.Provider>
            {semResultado && (
              <div className={estilos.vazio} role="status">
                <span>
                  {mensagemVazia} “{buscaEfetiva.trim()}”
                </span>
                <button type="button" className={estilos.limparVazio} onClick={() => setTextoBusca('')}>
                  Limpar busca
                </button>
              </div>
            )}
          </div>

          {rodape && <div className={estilos.rodape}>{rodape}</div>}
        </div>

        {recolhivel && !naGaveta && (
          <Dica conteudo={estaRecolhido ? 'Expandir menu' : 'Recolher menu'} atalho={casca?.atalhoRecolher} lado="direita">
            <button
              type="button"
              className={estilos.alca}
              aria-label={estaRecolhido ? 'Expandir menu' : 'Recolher menu'}
              aria-expanded={!estaRecolhido}
              aria-controls={idCorpo}
              onClick={() => mudarRecolhido(!estaRecolhido)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
          </Dica>
        )}
      </nav>
    </ContextoMenuLateral.Provider>
  )
}
