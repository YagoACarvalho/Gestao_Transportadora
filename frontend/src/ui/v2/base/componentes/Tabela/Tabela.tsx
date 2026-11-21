import { ArrowDown, ArrowUp, ChevronsUpDown, Ellipsis, EllipsisVertical, EyeOff, X } from 'lucide-react'
import {
  Fragment,
  useMemo,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { useControlavel } from '../../hooks'
import { juntarClasses } from '../../utilitarios'
import { BotaoIcone } from '../BotaoIcone'
import { CaixaMarcacao } from '../CaixaMarcacao'
import { ItemMenu, MenuSuspenso, SeparadorMenu } from '../Menu'
import estilos from './Tabela.module.css'

export type AlinhamentoColuna = 'inicio' | 'centro' | 'fim'
export type MarcadorCelula = 'alterado' | 'conflito' | 'novo'
export type DensidadeTabela = 'compacta' | 'padrao' | 'confortavel'
export type DirecaoOrdenacao = 'asc' | 'desc'
export type OrdenacaoTabela = { coluna: string; direcao: DirecaoOrdenacao } | null
export type TipoSubLinhas = 'historico' | 'filhas'

export type ContextoCelula = {
  historico: boolean
  nivel: number
  selecionada: boolean
  expandida: boolean
}

export type EstadoCelula = {
  marcador?: MarcadorCelula
  riscado?: boolean
  esmaecido?: boolean
  titulo?: string
}

export type ColunaTabela<T> = {
  id: string
  titulo: ReactNode
  icone?: ReactNode
  largura?: number
  alinhamento?: AlinhamentoColuna
  celula: (linha: T, contexto: ContextoCelula) => ReactNode
  valor?: (linha: T) => string | number | Date | null | undefined
  ordenavel?: boolean
  ocultavel?: boolean
  fixa?: boolean
  quebrarLinha?: boolean
}

export type PropsTabela<T> = {
  linhas: readonly T[]
  colunas: readonly ColunaTabela<T>[]
  obterId: (linha: T) => string
  rotulo: string
  selecionavel?: boolean
  selecionados?: string[]
  selecionadosPadrao?: string[]
  onMudarSelecao?: (ids: string[]) => void
  acoesSelecao?: (ids: string[], limpar: () => void) => ReactNode
  subLinhas?: (linha: T) => readonly T[] | undefined
  tipoSubLinhas?: TipoSubLinhas
  mostrarSubLinhas?: boolean
  expandidas?: string[]
  expandidasPadrao?: string[]
  onMudarExpandidas?: (ids: string[]) => void
  rotuloExpandir?: (linha: T) => string
  rotuloSelecao?: (linha: T) => string
  estadoCelula?: (linha: T, coluna: string, contexto: ContextoCelula) => EstadoCelula | undefined
  ordenacao?: OrdenacaoTabela
  ordenacaoPadrao?: OrdenacaoTabela
  onMudarOrdenacao?: (ordenacao: OrdenacaoTabela) => void
  ordenarLocalmente?: boolean
  colunasOcultas?: string[]
  colunasOcultasPadrao?: string[]
  onMudarColunasOcultas?: (ids: string[]) => void
  menuColuna?: boolean
  acoesLinha?: (linha: T) => ReactNode
  rotuloAcoes?: (linha: T) => string
  onClicarLinha?: (linha: T) => void
  linhaAtiva?: string | null
  densidade?: DensidadeTabela
  alturaMaxima?: number | string
  carregando?: boolean
  linhasCarregando?: number
  vazio?: ReactNode
  rodape?: ReactNode
  className?: string
}

const coletor = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' })

function comparar(a: unknown, b: unknown) {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return coletor.compare(String(a), String(b))
}

const vazio = (valor: unknown) => valor === null || valor === undefined || valor === ''

const LARGURA_PADRAO = 160
const LARGURA_ACOES = 52

function Seta() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.8 3.2h6.4L5 7.4z" fill="currentColor" />
    </svg>
  )
}

function Marcar({
  marcado,
  indeterminado = false,
  rotulo,
  onAlternar,
}: {
  marcado: boolean
  indeterminado?: boolean
  rotulo: string
  onAlternar: (intervalo: boolean) => void
}) {
  return (
    <label className={estilos.marcar}>
      <input
        type="checkbox"
        className={estilos.inputOculto}
        checked={marcado}
        aria-label={rotulo}
        ref={(elemento) => {
          if (elemento) elemento.indeterminate = indeterminado
        }}
        onChange={(evento) => onAlternar('shiftKey' in evento.nativeEvent && Boolean(evento.nativeEvent.shiftKey))}
      />
      <CaixaMarcacao forma="quadrado" marcado={marcado} indeterminado={indeterminado} tamanho={17} />
    </label>
  )
}

export function Tabela<T>({
  linhas,
  colunas,
  obterId,
  rotulo,
  selecionavel = false,
  selecionados,
  selecionadosPadrao = [],
  onMudarSelecao,
  acoesSelecao,
  subLinhas,
  tipoSubLinhas = 'historico',
  mostrarSubLinhas = true,
  expandidas,
  expandidasPadrao = [],
  onMudarExpandidas,
  rotuloExpandir,
  rotuloSelecao,
  estadoCelula,
  ordenacao,
  ordenacaoPadrao = null,
  onMudarOrdenacao,
  ordenarLocalmente = true,
  colunasOcultas,
  colunasOcultasPadrao = [],
  onMudarColunasOcultas,
  menuColuna = true,
  acoesLinha,
  rotuloAcoes,
  onClicarLinha,
  linhaAtiva,
  densidade = 'padrao',
  alturaMaxima,
  carregando = false,
  linhasCarregando = 5,
  vazio: conteudoVazio,
  rodape,
  className,
}: PropsTabela<T>) {
  const [selecao, mudarSelecao] = useControlavel(selecionados, selecionadosPadrao, onMudarSelecao)
  const [abertas, mudarAbertas] = useControlavel(expandidas, expandidasPadrao, onMudarExpandidas)
  const [ordem, mudarOrdem] = useControlavel(ordenacao, ordenacaoPadrao, onMudarOrdenacao)
  const [ocultas, mudarOcultas] = useControlavel(colunasOcultas, colunasOcultasPadrao, onMudarColunasOcultas)
  const ultimoMarcado = useRef<string | null>(null)

  const visiveis = colunas.filter((coluna) => !ocultas.includes(coluna.id))
  const comAcoes = Boolean(acoesLinha)
  const larguraTotal =
    visiveis.reduce((soma, coluna) => soma + (coluna.largura ?? LARGURA_PADRAO), 0) + (comAcoes ? LARGURA_ACOES : 0)

  const ordenadas = useMemo(() => {
    if (!ordem || !ordenarLocalmente) return linhas
    const coluna = colunas.find((item) => item.id === ordem.coluna)
    if (!coluna?.valor) return linhas
    const fator = ordem.direcao === 'asc' ? 1 : -1
    return [...linhas].sort((a, b) => {
      const va = coluna.valor?.(a)
      const vb = coluna.valor?.(b)
      // vazios sempre no fim, em qualquer direção
      if (vazio(va) || vazio(vb)) return vazio(va) === vazio(vb) ? 0 : vazio(va) ? 1 : -1
      return comparar(va, vb) * fator
    })
  }, [linhas, colunas, ordem, ordenarLocalmente])

  const ids = ordenadas.map(obterId)
  const selecionadosVisiveis = ids.filter((id) => selecao.includes(id))
  const todos = ids.length > 0 && selecionadosVisiveis.length === ids.length
  const alguns = selecionadosVisiveis.length > 0 && !todos
  const filhasDe = (linha: T) => (mostrarSubLinhas ? subLinhas?.(linha) : undefined)
  const temExpansivel = Boolean(subLinhas) && mostrarSubLinhas && ordenadas.some((linha) => (filhasDe(linha)?.length ?? 0) > 0)
  const temControle = selecionavel || temExpansivel

  function alternarSelecao(id: string, intervalo: boolean) {
    const ancora = ultimoMarcado.current
    ultimoMarcado.current = id
    const marcar = !selecao.includes(id)
    if (intervalo && ancora && ids.includes(ancora)) {
      const [inicio, fim] = [ids.indexOf(ancora), ids.indexOf(id)].sort((a, b) => a - b)
      const faixa = ids.slice(inicio, fim + 1)
      mudarSelecao(marcar ? [...new Set([...selecao, ...faixa])] : selecao.filter((item) => !faixa.includes(item)))
      return
    }
    mudarSelecao(marcar ? [...selecao, id] : selecao.filter((item) => item !== id))
  }

  function alternarTodos() {
    mudarSelecao(todos ? selecao.filter((id) => !ids.includes(id)) : [...new Set([...selecao, ...ids])])
  }

  function alternarExpandida(id: string) {
    mudarAbertas(abertas.includes(id) ? abertas.filter((item) => item !== id) : [...abertas, id])
  }

  function ordenarPor(coluna: string, direcao: DirecaoOrdenacao | null) {
    mudarOrdem(direcao ? { coluna, direcao } : null)
  }

  function aoClicarLinha(evento: MouseEvent<HTMLTableRowElement>, linha: T) {
    if (!onClicarLinha) return
    const alvo = evento.target as HTMLElement
    // ignora cliques em controles e em menus abertos a partir da linha (portal)
    if (!evento.currentTarget.contains(alvo)) return
    if (alvo.closest('button, a, input, label, select, textarea, [role="combobox"], [data-sem-clique]')) return
    onClicarLinha(linha)
  }

  function aoTeclarLinha(evento: KeyboardEvent<HTMLTableRowElement>, linha: T) {
    if (!onClicarLinha || evento.target !== evento.currentTarget) return
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      onClicarLinha(linha)
    }
  }

  function cabecalho(coluna: ColunaTabela<T>, indice: number) {
    const ordenavel = coluna.ordenavel ?? Boolean(coluna.valor)
    const ocultavel = coluna.ocultavel ?? true
    const direcao = ordem?.coluna === coluna.id ? ordem.direcao : null
    const conteudo = (
      <>
        {coluna.icone && (
          <span className={estilos.iconeCabecalho} aria-hidden="true">
            {coluna.icone}
          </span>
        )}
        <span className={estilos.tituloCabecalho}>{coluna.titulo}</span>
        {ordenavel && (
          <span className={estilos.ordem} data-ativa={direcao ? true : undefined} aria-hidden="true">
            {direcao === 'asc' ? <ArrowUp /> : direcao === 'desc' ? <ArrowDown /> : <ChevronsUpDown />}
          </span>
        )}
      </>
    )
    const comMenu = menuColuna && (ordenavel || ocultavel)

    return (
      <th
        key={coluna.id}
        scope="col"
        className={estilos.cabecalho}
        aria-sort={direcao === 'asc' ? 'ascending' : direcao === 'desc' ? 'descending' : undefined}
        data-primeira={indice === 0 || undefined}
        data-fixa={coluna.fixa || undefined}
        data-alinhamento={coluna.alinhamento}
      >
        <div className={estilos.conteudoCabecalho}>
          {indice === 0 && temControle && (
            <span className={estilos.controle}>
              {selecionavel && (
                <Marcar marcado={todos} indeterminado={alguns} rotulo="Selecionar todas as linhas" onAlternar={alternarTodos} />
              )}
            </span>
          )}
          {comMenu ? (
            <MenuSuspenso
              rotulo={typeof coluna.titulo === 'string' ? `Opções de ${coluna.titulo}` : 'Opções da coluna'}
              alinhamento={coluna.alinhamento === 'fim' ? 'fim' : 'inicio'}
              gatilho={
                <button type="button" className={estilos.botaoCabecalho}>
                  {conteudo}
                </button>
              }
            >
              {ordenavel && (
                <>
                  <ItemMenu icone={<ArrowUp />} tipo="radio" marcado={direcao === 'asc'} onSelecionar={() => ordenarPor(coluna.id, 'asc')}>
                    Ordem crescente
                  </ItemMenu>
                  <ItemMenu icone={<ArrowDown />} tipo="radio" marcado={direcao === 'desc'} onSelecionar={() => ordenarPor(coluna.id, 'desc')}>
                    Ordem decrescente
                  </ItemMenu>
                  {direcao && (
                    <ItemMenu icone={<X />} onSelecionar={() => ordenarPor(coluna.id, null)}>
                      Remover ordenação
                    </ItemMenu>
                  )}
                </>
              )}
              {ordenavel && ocultavel && <SeparadorMenu />}
              {ocultavel && (
                <ItemMenu icone={<EyeOff />} onSelecionar={() => mudarOcultas([...ocultas, coluna.id])} disabled={visiveis.length <= 1}>
                  Ocultar coluna
                </ItemMenu>
              )}
            </MenuSuspenso>
          ) : (
            <span className={estilos.rotuloCabecalho}>{conteudo}</span>
          )}
        </div>
      </th>
    )
  }

  function linhaTabela(linha: T, nivel: number, historico: boolean, chave: string) {
    const id = obterId(linha)
    const filhas = nivel === 0 ? filhasDe(linha) : undefined
    const expansivel = (filhas?.length ?? 0) > 0
    const expandida = expansivel && abertas.includes(id)
    const selecionada = nivel === 0 && selecao.includes(id)
    const contexto: ContextoCelula = { historico, nivel, selecionada, expandida }
    const podeMarcar = selecionavel && nivel === 0 && !historico

    return (
      <Fragment key={chave}>
        <tr
          className={estilos.linha}
          data-historico={historico || undefined}
          data-filha={(nivel > 0 && !historico) || undefined}
          data-expansivel={expansivel || undefined}
          data-marcavel={podeMarcar || undefined}
          data-selecionada={selecionada || undefined}
          data-ativa={linhaAtiva === id || undefined}
          data-clicavel={(onClicarLinha && !historico) || undefined}
          aria-selected={selecionavel && nivel === 0 ? selecionada : undefined}
          tabIndex={onClicarLinha && !historico ? 0 : undefined}
          onClick={historico ? undefined : (evento) => aoClicarLinha(evento, linha)}
          onKeyDown={historico ? undefined : (evento) => aoTeclarLinha(evento, linha)}
        >
          {visiveis.map((coluna, indice) => {
            const estado = estadoCelula?.(linha, coluna.id, contexto)
            const conteudo = coluna.celula(linha, contexto)
            return (
              <td
                key={coluna.id}
                className={estilos.celula}
                data-primeira={indice === 0 || undefined}
                data-fixa={coluna.fixa || undefined}
                data-alinhamento={coluna.alinhamento}
                data-quebrar={coluna.quebrarLinha || undefined}
                data-marcador={estado?.marcador}
                data-riscado={estado?.riscado || undefined}
                data-esmaecido={estado?.esmaecido || undefined}
                title={estado?.titulo ?? (typeof conteudo === 'string' ? conteudo : undefined)}
              >
                {indice === 0 ? (
                  <div className={estilos.primeira} style={nivel > 0 && !historico ? ({ '--nivel': nivel } as CSSProperties) : undefined}>
                    {temControle && (
                      <span className={estilos.controle}>
                        {historico ? (
                          <EllipsisVertical className={estilos.trilho} aria-hidden="true" />
                        ) : (
                          <>
                            {expansivel && (
                              <button
                                type="button"
                                className={estilos.seta}
                                aria-expanded={expandida}
                                aria-label={rotuloExpandir?.(linha) ?? (expandida ? 'Recolher linha' : 'Expandir linha')}
                                onClick={() => alternarExpandida(id)}
                              >
                                <Seta />
                              </button>
                            )}
                            {podeMarcar && (
                              <Marcar
                                marcado={selecionada}
                                rotulo={rotuloSelecao?.(linha) ?? `Selecionar ${id}`}
                                onAlternar={(intervalo) => alternarSelecao(id, intervalo)}
                              />
                            )}
                          </>
                        )}
                      </span>
                    )}
                    <div className={estilos.conteudo}>{conteudo}</div>
                  </div>
                ) : (
                  <div className={estilos.conteudo}>{conteudo}</div>
                )}
              </td>
            )
          })}
          {comAcoes && (
            <td className={estilos.celula} data-acoes>
              {!historico && (
                <MenuSuspenso
                  alinhamento="fim"
                  rotulo={rotuloAcoes?.(linha) ?? `Ações de ${id}`}
                  gatilho={<BotaoIcone rotulo={rotuloAcoes?.(linha) ?? `Ações de ${id}`} icone={<Ellipsis />} tamanho="pequeno" />}
                >
                  {acoesLinha?.(linha)}
                </MenuSuspenso>
              )}
            </td>
          )}
        </tr>
        {expandida &&
          filhas?.map((filha, posicao) =>
            linhaTabela(filha, nivel + 1, tipoSubLinhas === 'historico', `${chave}-${posicao}`),
          )}
      </Fragment>
    )
  }

  const totalColunas = visiveis.length + (comAcoes ? 1 : 0)

  return (
    <div
      className={juntarClasses(estilos.moldura, className)}
      data-densidade={densidade}
      data-selecionando={selecao.length > 0 || undefined}
    >
      <div className={estilos.rolagem} style={alturaMaxima !== undefined ? { maxHeight: alturaMaxima } : undefined}>
        <table className={estilos.tabela} aria-label={rotulo} aria-busy={carregando || undefined} style={{ minWidth: larguraTotal }}>
          <colgroup>
            {visiveis.map((coluna) => (
              <col key={coluna.id} style={coluna.largura ? { width: coluna.largura } : undefined} />
            ))}
            {comAcoes && <col style={{ width: LARGURA_ACOES }} />}
          </colgroup>
          <thead>
            <tr>
              {visiveis.map(cabecalho)}
              {comAcoes && (
                <th scope="col" className={estilos.cabecalho} data-acoes>
                  <span className={estilos.oculto}>Ações</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {carregando
              ? Array.from({ length: linhasCarregando }, (_, linha) => (
                  <tr key={`carregando-${linha}`} className={estilos.linha}>
                    {Array.from({ length: totalColunas }, (_, coluna) => (
                      <td key={coluna} className={estilos.celula} data-primeira={coluna === 0 || undefined}>
                        <span className={estilos.esqueleto} style={{ width: `${45 + ((linha * 17 + coluna * 29) % 45)}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              : ordenadas.length === 0
                ? (
                    <tr className={estilos.linha}>
                      <td className={estilos.celula} colSpan={totalColunas}>
                        <div className={estilos.vazio}>{conteudoVazio ?? 'Nenhum registro encontrado.'}</div>
                      </td>
                    </tr>
                  )
                : ordenadas.map((linha) => linhaTabela(linha, 0, false, obterId(linha)))}
          </tbody>
        </table>
      </div>
      {rodape && <div className={estilos.rodape}>{rodape}</div>}
      {acoesSelecao && selecao.length > 0 && (
        <div className={estilos.barraSelecao} role="region" aria-label="Ações para os selecionados">
          <span className={estilos.contagem}>
            <strong>{selecao.length}</strong> {selecao.length === 1 ? 'selecionado' : 'selecionados'}
          </span>
          <span className={estilos.divisorBarra} aria-hidden="true" />
          {acoesSelecao(selecao, () => mudarSelecao([]))}
          <BotaoIcone rotulo="Limpar seleção" icone={<X />} tamanho="pequeno" onClick={() => mudarSelecao([])} />
        </div>
      )}
    </div>
  )
}
