import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { useAtalho } from '../../hooks'
import { combinarRefs, juntarClasses } from '../../utilitarios'
import { Modal } from '../Modal'
import { ContextoCascaApp, gravarRecolhidoPersistido, lerRecolhidoPersistido, type ValorCascaApp } from './contexto'
import estilos from './CascaApp.module.css'

export type VarianteCascaApp = 'padrao' | 'moldura' | 'reta'

export type PropsCascaApp = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children: ReactNode
  menu?: ReactNode
  barra?: ReactNode
  /** faixa que atravessa a casca inteira, acima do menu e da coluna (ex.: BarraPaginas) */
  topo?: ReactNode
  variante?: VarianteCascaApp
  /** ocupa a altura do pai em vez da tela inteira */
  contida?: boolean
  recolhido?: boolean
  recolhidoPadrao?: boolean
  onMudarRecolhido?: (recolhido: boolean) => void
  /** chave do localStorage que guarda o menu recolhido entre visitas */
  chavePersistencia?: string
  atalhoRecolher?: string
  /** abaixo desta largura (da casca, não da tela) o menu vira gaveta */
  larguraCelular?: number
  larguraConteudo?: number
  rotuloGaveta?: string
  rotuloPular?: string
  ref?: Ref<HTMLDivElement>
}

export function CascaApp({
  children,
  menu,
  barra,
  topo,
  variante = 'padrao',
  contida = false,
  recolhido,
  recolhidoPadrao = false,
  onMudarRecolhido,
  chavePersistencia,
  atalhoRecolher,
  larguraCelular = 768,
  larguraConteudo,
  rotuloGaveta = 'Menu de navegação',
  rotuloPular = 'Pular para o conteúdo',
  className,
  style,
  ref,
  ...props
}: PropsCascaApp) {
  const raizRef = useRef<HTMLDivElement>(null)
  const conteudoRef = useRef<HTMLDivElement>(null)
  const refRaiz = useCallback((no: HTMLDivElement | null) => combinarRefs(raizRef, ref)(no), [ref])
  const [recolhidoInterno, setRecolhidoInterno] = useState(() => lerRecolhidoPersistido(chavePersistencia) ?? recolhidoPadrao)
  const [celular, setCelular] = useState(() => typeof window !== 'undefined' && window.innerWidth < larguraCelular)
  const [gavetaAberta, setGavetaAberta] = useState(false)
  const idConteudo = useId()
  const estaRecolhido = recolhido ?? recolhidoInterno
  // contida costuma morar dentro de outra página, que já tem o seu <main>
  const Conteudo = contida ? 'div' : 'main'

  if (!celular && gavetaAberta) setGavetaAberta(false)

  function mudarRecolhido(novo: boolean) {
    if (recolhido === undefined) setRecolhidoInterno(novo)
    if (recolhido === undefined) gravarRecolhidoPersistido(chavePersistencia, novo)
    onMudarRecolhido?.(novo)
  }

  useEffect(() => {
    const raiz = raizRef.current
    if (!raiz) return
    const observador = new ResizeObserver(([entrada]) => setCelular(entrada.contentRect.width < larguraCelular))
    observador.observe(raiz)
    return () => observador.disconnect()
  }, [larguraCelular])

  useAtalho(
    atalhoRecolher ?? '',
    () => {
      if (celular) setGavetaAberta(!gavetaAberta)
      else mudarRecolhido(!estaRecolhido)
    },
    { ativo: Boolean(atalhoRecolher && menu) },
  )

  const base: Omit<ValorCascaApp, 'naGaveta'> = {
    recolhido: estaRecolhido,
    mudarRecolhido,
    celular,
    gavetaAberta,
    abrirGaveta: () => setGavetaAberta(true),
    fecharGaveta: () => setGavetaAberta(false),
    atalhoRecolher,
  }

  return (
    <ContextoCascaApp.Provider value={{ ...base, naGaveta: false }}>
      <div
        ref={refRaiz}
        className={juntarClasses(estilos.casca, className)}
        data-variante={variante}
        data-contida={contida || undefined}
        data-celular={celular || undefined}
        data-recolhido={estaRecolhido || undefined}
        data-com-topo={topo ? '' : undefined}
        style={{ ...(larguraConteudo ? { '--casca-largura-conteudo': `${larguraConteudo}px` } : null), ...style } as CSSProperties}
        {...props}
      >
        <a
          href={`#${idConteudo}`}
          className={estilos.pular}
          onClick={(evento) => {
            evento.preventDefault()
            conteudoRef.current?.focus()
          }}
        >
          {rotuloPular}
        </a>
        {topo && <div className={estilos.topo}>{topo}</div>}
        <div className={estilos.corpo}>
          {menu && !celular && <div className={estilos.areaMenu}>{menu}</div>}
          <div className={estilos.coluna} data-coluna-casca="">
            {barra}
            <Conteudo ref={conteudoRef} id={idConteudo} tabIndex={-1} className={estilos.conteudo}>
              {children}
            </Conteudo>
          </div>
        </div>
      </div>
      {menu && celular && (
        <Modal aberto={gavetaAberta} onFechar={() => setGavetaAberta(false)} posicao="esquerda" tamanho={300} rotulo={rotuloGaveta} focoInicial="painel" className={estilos.gaveta}>
          <ContextoCascaApp.Provider value={{ ...base, naGaveta: true }}>{menu}</ContextoCascaApp.Provider>
        </Modal>
      )}
    </ContextoCascaApp.Provider>
  )
}
