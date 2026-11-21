import { Menu, Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { useAtalho } from '../../hooks'
import { juntarClasses } from '../../utilitarios'
import { Atalho } from '../Atalho'
import { BotaoIcone } from '../BotaoIcone'
import { useCascaApp } from '../CascaApp/contexto'
import { ariaAtalho } from '../MenuLateral/ariaAtalho'
import { TrilhaNavegacao, type ItemTrilha } from '../TrilhaNavegacao'
import estilos from './BarraSuperior.module.css'
import { encontrarAreaRolagem } from './rolagem'

export type PropsBuscaBarraSuperior = {
  placeholder?: string
  /** combinação que abre ou foca a busca; false desliga */
  atalho?: string | false
  rotulo?: string
  /** com onAbrir a busca vira um gatilho (ex.: abre a PaletaComandos) em vez de um campo */
  onAbrir?: () => void
  valor?: string
  valorPadrao?: string
  onMudar?: (valor: string) => void
  onEnviar?: (valor: string) => void
}

export type TamanhoBarraSuperior = 'medio' | 'grande'
export type BotaoMenuBarraSuperior = 'auto' | 'sempre' | 'nunca'

export type PropsBarraSuperior = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  titulo?: ReactNode
  trilha?: readonly ItemTrilha[]
  inicio?: ReactNode
  busca?: boolean | PropsBuscaBarraSuperior
  acoes?: ReactNode
  /** gruda no topo da área que rola */
  fixa?: boolean
  vidro?: boolean
  bordaAoRolar?: boolean
  onAbrirMenu?: () => void
  botaoMenu?: BotaoMenuBarraSuperior
  tamanho?: TamanhoBarraSuperior
  ref?: Ref<HTMLElement>
}

export function BarraSuperior({
  titulo,
  trilha,
  inicio,
  busca,
  acoes,
  fixa = true,
  vidro = true,
  bordaAoRolar = true,
  onAbrirMenu,
  botaoMenu = 'auto',
  tamanho = 'medio',
  className,
  ref,
  ...props
}: PropsBarraSuperior) {
  const casca = useCascaApp()
  const sentinelaRef = useRef<HTMLSpanElement>(null)
  const entradaRef = useRef<HTMLInputElement>(null)
  const [rolado, setRolado] = useState(false)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [pedidoFoco, setPedidoFoco] = useState(0)
  const config = busca === true ? {} : busca || null
  const [termoInterno, setTermoInterno] = useState(config?.valorPadrao ?? '')
  const termo = config?.valor ?? termoInterno
  const atalho = config?.atalho === undefined ? 'mod+k' : config.atalho
  const gatilho = Boolean(config?.onAbrir)
  const rotuloBusca = config?.rotulo ?? 'Buscar'

  useEffect(() => {
    const sentinela = sentinelaRef.current
    if (!fixa || !bordaAoRolar || !sentinela) return
    const observador = new IntersectionObserver(([entrada]) => setRolado(!entrada.isIntersecting), {
      root: encontrarAreaRolagem(sentinela.parentElement),
    })
    observador.observe(sentinela)
    return () => observador.disconnect()
  }, [fixa, bordaAoRolar])

  useEffect(() => {
    if (pedidoFoco) entradaRef.current?.focus()
  }, [pedidoFoco])

  function abrirBusca() {
    if (config?.onAbrir) {
      config.onAbrir()
      return
    }
    setBuscaAberta(true)
    setPedidoFoco((pedido) => pedido + 1)
  }

  useAtalho(atalho || 'mod+k', abrirBusca, { ativo: Boolean(config && atalho), emCampos: true })

  function mudarTermo(novo: string) {
    if (config?.valor === undefined) setTermoInterno(novo)
    config?.onMudar?.(novo)
  }

  function aoTeclarBusca(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter') config?.onEnviar?.(termo)
    else if (evento.key === 'Escape') {
      evento.preventDefault()
      if (termo) mudarTermo('')
      else {
        setBuscaAberta(false)
        evento.currentTarget.blur()
      }
    }
  }

  const abrirMenu = onAbrirMenu ?? casca?.abrirGaveta
  const mostrarMenu =
    Boolean(abrirMenu) && botaoMenu !== 'nunca' && (botaoMenu === 'sempre' || !casca || casca.celular)
  const menuAutomatico = botaoMenu === 'auto' && !casca
  const atual = trilha?.[trilha.length - 1]

  return (
    <>
      {fixa && <span ref={sentinelaRef} className={estilos.sentinela} aria-hidden="true" />}
      <header
        ref={ref}
        className={juntarClasses(estilos.barra, className)}
        data-fixa={fixa || undefined}
        data-vidro={vidro || undefined}
        data-rolado={rolado || !bordaAoRolar || undefined}
        data-tamanho={tamanho}
        data-busca-aberta={buscaAberta || undefined}
        {...props}
      >
        <div className={estilos.conteudo}>
          <div className={estilos.inicio}>
            {mostrarMenu && (
              <BotaoIcone
                rotulo="Abrir menu"
                icone={<Menu />}
                className={estilos.botaoMenu}
                data-automatico={menuAutomatico || undefined}
                aria-expanded={casca ? casca.gavetaAberta : undefined}
                aria-haspopup="dialog"
                onClick={abrirMenu}
              />
            )}
            {inicio}
            {trilha ? (
              <div className={estilos.titulos}>
                <TrilhaNavegacao itens={trilha} tamanho="pequeno" maximo={3} className={estilos.trilha} />
                {atual && (
                  <span className={estilos.tituloCurto}>{atual.rotulo}</span>
                )}
              </div>
            ) : (
              titulo && (
                <div className={estilos.titulos}>
                  <span className={estilos.titulo}>{titulo}</span>
                </div>
              )
            )}
          </div>

          {config && (
            <div className={estilos.areaBusca} role={gatilho ? undefined : 'search'}>
              {gatilho ? (
                <button type="button" className={estilos.busca} aria-keyshortcuts={ariaAtalho(atalho)} onClick={abrirBusca}>
                  <Search aria-hidden="true" />
                  <span className={estilos.placeholder}>{config.placeholder ?? rotuloBusca}</span>
                  {atalho && <Atalho combinacao={atalho} variante="contorno" className={estilos.atalho} />}
                </button>
              ) : (
                <label className={estilos.busca}>
                  <Search aria-hidden="true" />
                  <input
                    ref={entradaRef}
                    type="search"
                    className={estilos.entrada}
                    placeholder={config.placeholder ?? rotuloBusca}
                    aria-label={rotuloBusca}
                    aria-keyshortcuts={ariaAtalho(atalho)}
                    enterKeyHint="search"
                    autoComplete="off"
                    value={termo}
                    onChange={(evento) => mudarTermo(evento.target.value)}
                    onKeyDown={aoTeclarBusca}
                  />
                  {termo ? (
                    <button type="button" className={estilos.limpar} aria-label="Limpar busca" onClick={() => {
                      mudarTermo('')
                      entradaRef.current?.focus()
                    }}>
                      <X aria-hidden="true" />
                    </button>
                  ) : (
                    atalho && <Atalho combinacao={atalho} variante="contorno" className={estilos.atalho} />
                  )}
                </label>
              )}
              {!gatilho && (
                <button type="button" className={estilos.cancelar} onClick={() => {
                  mudarTermo('')
                  setBuscaAberta(false)
                }}>
                  Cancelar
                </button>
              )}
            </div>
          )}

          <div className={estilos.acoes}>
            {config && <BotaoIcone rotulo={rotuloBusca} icone={<Search />} className={estilos.botaoBusca} onClick={abrirBusca} />}
            {acoes}
          </div>
        </div>
      </header>
    </>
  )
}
