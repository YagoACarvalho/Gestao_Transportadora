import { ArrowUpRight, ChevronDown, ChevronRight } from 'lucide-react'
import {
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { useAtalho } from '../../hooks'
import { combinarRefs, juntarClasses } from '../../utilitarios'
import { Atalho } from '../Atalho'
import { Destaque } from '../Destaque'
import { Dica } from '../Dica'
import { ItemMenu, MenuSuspenso, RotuloMenu, SubMenu } from '../Menu'
import { ariaAtalho } from './ariaAtalho'
import { BotaoComDica } from './BotaoComDica'
import {
  algumCasa,
  casaTermo,
  contemValor,
  ContextoGrupoMenuLateral,
  ContextoListaMenuLateral,
  formatarContador,
  textoBuscaDe,
  useMenuLateral,
} from './contexto'
import estilos from './MenuLateral.module.css'

export type PropsSecaoMenuLateral = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  titulo?: ReactNode
  acao?: ReactNode
  recolhivel?: boolean
  abertaPadrao?: boolean
}

export function SecaoMenuLateral({
  titulo,
  acao,
  recolhivel = false,
  abertaPadrao = true,
  className,
  children,
  ...props
}: PropsSecaoMenuLateral) {
  const menu = useMenuLateral()
  const emLista = useContext(ContextoListaMenuLateral)
  const [aberta, setAberta] = useState(abertaPadrao)
  const id = useId()
  const visivel = algumCasa(children, menu.termo)
  const mostrarItens = aberta || menu.recolhido || menu.termo !== ''
  const Linha = emLista ? 'li' : 'div'

  return (
    <Linha className={juntarClasses(estilos.secao, className)} hidden={!visivel} {...props}>
      {titulo && (
        <div className={estilos.topoSecao}>
          {recolhivel ? (
            <button
              type="button"
              id={`${id}-titulo`}
              className={estilos.tituloSecao}
              data-recolhivel=""
              aria-expanded={mostrarItens}
              aria-controls={`${id}-itens`}
              tabIndex={menu.recolhido ? -1 : undefined}
              onClick={() => setAberta(!aberta)}
            >
              <span className={estilos.textoTituloSecao}>{titulo}</span>
              <ChevronDown className={estilos.setaSecao} aria-hidden="true" />
            </button>
          ) : (
            <span id={`${id}-titulo`} className={estilos.tituloSecao}>
              <span className={estilos.textoTituloSecao}>{titulo}</span>
            </span>
          )}
          {acao && <span className={estilos.acaoSecao}>{acao}</span>}
        </div>
      )}
      <div id={`${id}-itens`} className={estilos.regiao} data-aberto={mostrarItens || undefined} inert={!mostrarItens}>
        <div className={estilos.regiaoInterna}>
          <ContextoListaMenuLateral.Provider value>
            <ul className={estilos.lista} role="list" aria-labelledby={titulo ? `${id}-titulo` : undefined}>
              {children}
            </ul>
          </ContextoListaMenuLateral.Provider>
        </div>
      </div>
    </Linha>
  )
}

export type PropsItemMenuLateral = Omit<HTMLAttributes<HTMLElement>, 'children' | 'onClick'> & {
  children: ReactNode
  valor?: string
  icone?: ReactNode
  href?: string
  alvo?: string
  ativo?: boolean
  contador?: number
  selo?: ReactNode
  atalho?: string
  externo?: boolean
  desabilitado?: boolean
  textoBusca?: string
  onClick?: (evento: MouseEvent<HTMLElement>) => void
  onSelecionar?: () => void
  ref?: Ref<HTMLElement>
}

export function ItemMenuLateral({
  children,
  valor,
  icone,
  href,
  alvo,
  ativo,
  contador,
  selo,
  atalho,
  externo = false,
  desabilitado = false,
  textoBusca,
  onClick,
  onSelecionar,
  className,
  ref,
  ...props
}: PropsItemMenuLateral) {
  const menu = useMenuLateral()
  const grupo = useContext(ContextoGrupoMenuLateral)
  const emLista = useContext(ContextoListaMenuLateral)
  const elementoRef = useRef<HTMLElement>(null)
  const refElemento = useCallback((no: HTMLElement | null) => combinarRefs(elementoRef, ref)(no), [ref])
  const texto = textoBuscaDe({ textoBusca, children })
  const estaAtivo = ativo ?? (valor !== undefined && valor === menu.valor)
  const visivel = grupo.casouGrupo || casaTermo(texto, menu.termo)
  const temContador = contador !== undefined && contador > 0

  function selecionar() {
    onSelecionar?.()
    if (valor !== undefined) menu.navegar(valor)
  }

  useAtalho(
    atalho ?? '',
    () => {
      const elemento = elementoRef.current
      if (elemento?.isConnected) elemento.click()
      else selecionar()
    },
    { ativo: Boolean(atalho) && menu.registrarAtalhos && !desabilitado && grupo.modo !== 'flutuante' },
  )

  if (grupo.modo === 'oculto') return null

  if (grupo.modo === 'flutuante') {
    return (
      <ItemMenu
        icone={icone}
        href={href}
        alvo={alvo}
        tom={estaAtivo ? 'primario' : 'neutro'}
        meta={temContador ? formatarContador(contador) : undefined}
        externo={externo}
        disabled={desabilitado}
        textoBusca={texto || undefined}
        aria-current={estaAtivo ? 'page' : undefined}
        onSelecionar={selecionar}
      >
        {children}
      </ItemMenu>
    )
  }

  const Linha = emLista ? 'li' : 'div'
  const comum = {
    ref: refElemento,
    className: juntarClasses(estilos.item, className),
    'data-item-menu-lateral': '',
    'data-nivel': grupo.nivel || undefined,
    'data-ativo': estaAtivo || undefined,
    'aria-current': estaAtivo ? ('page' as const) : undefined,
    'aria-keyshortcuts': ariaAtalho(atalho),
    onClick: (evento: MouseEvent<HTMLElement>) => {
      onClick?.(evento)
      if (evento.defaultPrevented || desabilitado) return
      selecionar()
    },
    ...props,
  }

  const conteudo = (
    <>
      {icone && (
        <span className={estilos.icone} aria-hidden="true">
          {icone}
          {temContador && <span className={estilos.pontoContador} />}
        </span>
      )}
      <span className={estilos.rotulo}>
        {typeof children === 'string' ? <Destaque texto={children} termo={menu.busca} /> : children}
      </span>
      {selo && <span className={estilos.selo}>{selo}</span>}
      {temContador && <span className={estilos.contador}>{formatarContador(contador)}</span>}
      {atalho && <Atalho combinacao={atalho} className={estilos.atalho} />}
      {externo && <ArrowUpRight className={estilos.externo} aria-hidden="true" />}
    </>
  )

  return (
    <Linha className={estilos.linha} hidden={!visivel}>
      <Dica conteudo={texto || children} atalho={atalho} lado="direita" desabilitada={!menu.recolhido}>
        {href ? (
          <a
            {...comum}
            href={desabilitado ? undefined : href}
            target={alvo}
            rel={alvo === '_blank' ? 'noreferrer' : undefined}
            aria-disabled={desabilitado || undefined}
          >
            {conteudo}
          </a>
        ) : (
          <button type="button" {...comum} disabled={desabilitado}>
            {conteudo}
          </button>
        )}
      </Dica>
    </Linha>
  )
}

export type PropsGrupoMenuLateral = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  rotulo: string
  children: ReactNode
  valor?: string
  icone?: ReactNode
  contador?: number
  selo?: ReactNode
  aberto?: boolean
  abertoPadrao?: boolean
  onMudarAberto?: (aberto: boolean) => void
  desabilitado?: boolean
  textoBusca?: string
}

export function GrupoMenuLateral({
  rotulo,
  children,
  icone,
  contador,
  selo,
  aberto,
  abertoPadrao,
  onMudarAberto,
  desabilitado = false,
  textoBusca,
  valor,
  className,
  ...props
}: PropsGrupoMenuLateral) {
  const menu = useMenuLateral()
  const pai = useContext(ContextoGrupoMenuLateral)
  const emLista = useContext(ContextoListaMenuLateral)
  const id = useId()
  const contemAtivo = contemValor(children, menu.valor)
  const [abertoInterno, setAbertoInterno] = useState(abertoPadrao ?? contemAtivo)
  const [contemAntes, setContemAntes] = useState(contemAtivo)
  // o grupo se abre sozinho quando a navegação chega a um item dele
  if (contemAtivo !== contemAntes) {
    setContemAntes(contemAtivo)
    if (contemAtivo) setAbertoInterno(true)
  }
  const estaAberto = aberto ?? abertoInterno
  const texto = textoBusca ?? rotulo
  const casouGrupo = pai.casouGrupo || (menu.termo !== '' && casaTermo(texto, menu.termo))
  const visivel = menu.termo === '' || casouGrupo || algumCasa(children, menu.termo)
  const abertoVisivel = menu.termo ? visivel : estaAberto
  const temContador = contador !== undefined && contador > 0
  const Linha = emLista ? 'li' : 'div'

  function alternar() {
    const novo = !estaAberto
    if (aberto === undefined) setAbertoInterno(novo)
    onMudarAberto?.(novo)
  }

  if (pai.modo === 'oculto') {
    return <ContextoGrupoMenuLateral.Provider value={{ ...pai, nivel: pai.nivel + 1 }}>{children}</ContextoGrupoMenuLateral.Provider>
  }

  if (pai.modo === 'flutuante') {
    return (
      <SubMenu rotulo={rotulo} icone={icone} meta={temContador ? formatarContador(contador) : undefined} desabilitado={desabilitado}>
        <ContextoGrupoMenuLateral.Provider value={{ modo: 'flutuante', nivel: pai.nivel + 1, casouGrupo: false }}>
          {children}
        </ContextoGrupoMenuLateral.Provider>
      </SubMenu>
    )
  }

  const icones = icone && (
    <span className={estilos.icone} aria-hidden="true">
      {icone}
      {temContador && <span className={estilos.pontoContador} />}
    </span>
  )

  if (menu.recolhido && pai.nivel === 0) {
    return (
      <Linha className={juntarClasses(estilos.linha, className)} data-valor={valor} {...props}>
        <MenuSuspenso
          lado="direita"
          alinhamento="inicio"
          deslocamento={12}
          largura={248}
          rotulo={rotulo}
          gatilho={
            <BotaoComDica
              dica={rotulo}
              className={estilos.item}
              data-item-menu-lateral=""
              data-gatilho-grupo=""
              data-contem-ativo={contemAtivo || undefined}
              aria-label={rotulo}
              disabled={desabilitado}
            >
              {icones}
              <span className={estilos.rotulo}>{rotulo}</span>
            </BotaoComDica>
          }
        >
          <RotuloMenu>{rotulo}</RotuloMenu>
          <ContextoGrupoMenuLateral.Provider value={{ modo: 'flutuante', nivel: 1, casouGrupo: false }}>
            {children}
          </ContextoGrupoMenuLateral.Provider>
        </MenuSuspenso>
        <ContextoGrupoMenuLateral.Provider value={{ modo: 'oculto', nivel: 1, casouGrupo: false }}>{children}</ContextoGrupoMenuLateral.Provider>
      </Linha>
    )
  }

  return (
    <Linha
      className={juntarClasses(estilos.linha, estilos.grupo, className)}
      data-valor={valor}
      data-aberto={abertoVisivel || undefined}
      hidden={!visivel}
      {...props}
    >
      <button
        type="button"
        className={estilos.item}
        data-item-menu-lateral=""
        data-gatilho-grupo=""
        data-nivel={pai.nivel || undefined}
        data-contem-ativo={contemAtivo || undefined}
        aria-expanded={abertoVisivel}
        aria-controls={`${id}-regiao`}
        disabled={desabilitado}
        onClick={alternar}
      >
        {icones}
        <span className={estilos.rotulo}>
          <Destaque texto={rotulo} termo={menu.busca} />
        </span>
        {selo && <span className={estilos.selo}>{selo}</span>}
        {temContador && !abertoVisivel && <span className={estilos.contador}>{formatarContador(contador)}</span>}
        <ChevronRight className={estilos.seta} aria-hidden="true" />
      </button>
      <div id={`${id}-regiao`} className={estilos.regiao} data-regiao-grupo="" data-aberto={abertoVisivel || undefined} inert={!abertoVisivel}>
        <div className={estilos.regiaoInterna}>
          <ContextoListaMenuLateral.Provider value>
            <ul className={estilos.sublista} role="list" aria-label={rotulo}>
              <ContextoGrupoMenuLateral.Provider value={{ modo: 'lista', nivel: pai.nivel + 1, casouGrupo }}>
                {children}
              </ContextoGrupoMenuLateral.Provider>
            </ul>
          </ContextoListaMenuLateral.Provider>
        </div>
      </div>
    </Linha>
  )
}
