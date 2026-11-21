import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'
import {
  usePosicaoFlutuante,
  type AlinhamentoFlutuante,
  type AncoraFlutuante,
  type LadoFlutuante,
} from '../../hooks'
import { combinarRefs, juntarClasses } from '../../utilitarios'
import { Portal } from '../Portal'
import estilos from './PainelFlutuante.module.css'

export type MotivoFechamento = 'fora' | 'escape'

type ContextoCamada = {
  registrar: (elemento: HTMLElement) => () => void
}

// cada painel registra os filhos (submenus em portal) para que um clique neles não conte como clique fora
const ContextoCamadaFlutuante = createContext<ContextoCamada | null>(null)

export type PropsPainelFlutuante = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  aberto: boolean
  ancora: RefObject<AncoraFlutuante | null>
  children: ReactNode
  onFechar?: (motivo: MotivoFechamento) => void
  lado?: LadoFlutuante
  alinhamento?: AlinhamentoFlutuante
  deslocamento?: number
  largura?: number | string | 'ancora'
  larguraMinima?: number | 'ancora'
  alturaMaxima?: number
  ref?: Ref<HTMLDivElement>
}

export function PainelFlutuante({
  aberto,
  ancora,
  children,
  onFechar,
  lado = 'baixo',
  alinhamento = 'inicio',
  deslocamento = 8,
  largura,
  larguraMinima,
  alturaMaxima,
  className,
  style,
  onKeyDown,
  ref,
  ...props
}: PropsPainelFlutuante) {
  const painelRef = useRef<HTMLDivElement>(null)
  const descendentes = useRef(new Set<HTMLElement>())
  const pai = useContext(ContextoCamadaFlutuante)
  const posicao = usePosicaoFlutuante(ancora, painelRef, { aberto, lado, alinhamento, deslocamento })

  const camada = useMemo<ContextoCamada>(
    () => ({
      registrar(elemento) {
        descendentes.current.add(elemento)
        const desfazerNoPai = pai?.registrar(elemento)
        return () => {
          descendentes.current.delete(elemento)
          desfazerNoPai?.()
        }
      },
    }),
    [pai],
  )

  useLayoutEffect(() => {
    const elemento = painelRef.current
    if (!aberto || !elemento || !pai) return
    return pai.registrar(elemento)
  }, [aberto, pai])

  const verificarClique = useEffectEvent((evento: PointerEvent) => {
    const alvo = evento.target as Node
    const elementoAncora = ancora.current
    if (painelRef.current?.contains(alvo)) return
    if (elementoAncora instanceof Node && elementoAncora.contains(alvo)) return
    for (const descendente of descendentes.current) if (descendente.contains(alvo)) return
    onFechar?.('fora')
  })

  useEffect(() => {
    if (!aberto) return
    const ouvir = (evento: PointerEvent) => verificarClique(evento)
    document.addEventListener('pointerdown', ouvir)
    return () => document.removeEventListener('pointerdown', ouvir)
  }, [aberto])

  if (!aberto) return null

  const limiteAltura = Math.min(alturaMaxima ?? Infinity, posicao?.alturaDisponivel ?? Infinity)
  const estiloPosicao: CSSProperties = {
    top: posicao?.topo ?? 0,
    left: posicao?.esquerda ?? 0,
    opacity: posicao ? undefined : 0,
    pointerEvents: posicao ? undefined : 'none',
    width: largura === 'ancora' ? posicao?.larguraAncora : largura,
    minWidth: larguraMinima === 'ancora' ? posicao?.larguraAncora : larguraMinima,
    maxHeight: Number.isFinite(limiteAltura) ? limiteAltura : undefined,
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(evento)
    if (evento.defaultPrevented || evento.key !== 'Escape') return
    evento.preventDefault()
    evento.stopPropagation()
    onFechar?.('escape')
  }

  return (
    <Portal>
      <ContextoCamadaFlutuante.Provider value={camada}>
        <div
          ref={combinarRefs(painelRef, ref)}
          className={juntarClasses(estilos.painel, className)}
          data-lado={posicao?.lado ?? lado}
          data-camada-flutuante=""
          style={{ ...estiloPosicao, ...style }}
          onKeyDown={aoTeclar}
          {...props}
        >
          {children}
        </div>
      </ContextoCamadaFlutuante.Provider>
    </Portal>
  )
}
