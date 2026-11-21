import { useCallback, useEffect, useId, useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { useControlavel, usePosicaoFlutuante, type AlinhamentoFlutuante, type LadoFlutuante } from '../../hooks'
import { juntarClasses } from '../../utilitarios'
import { Atalho } from '../Atalho'
import { Portal } from '../Portal'
import { Slot } from '../Slot'
import { aquecimento, atribuirRef, juntarIds, type PropsGatilhoDica } from './gatilho'
import estilos from './Dica.module.css'

export type TomDica = 'escuro' | 'claro'
export type VarianteDica = 'padrao' | 'pilula'

export type PropsDica = {
  children: ReactElement<PropsGatilhoDica>
  conteudo: ReactNode
  atalho?: string
  lado?: LadoFlutuante
  alinhamento?: AlinhamentoFlutuante
  tom?: TomDica
  variante?: VarianteDica
  seta?: boolean
  atraso?: number
  larguraMaxima?: number
  desabilitada?: boolean
  /** abertura controlada; sem ela a dica abre sozinha por mouse e foco */
  aberta?: boolean
  onMudarAberta?: (aberta: boolean) => void
  className?: string
}

export function Dica({
  children,
  conteudo,
  atalho,
  lado = 'cima',
  alinhamento = 'centro',
  tom = 'escuro',
  variante = 'padrao',
  seta = true,
  atraso = 450,
  larguraMaxima = 260,
  desabilitada = false,
  aberta: abertaControlada,
  onMudarAberta,
  className,
}: PropsDica) {
  const [aberta, setAberta] = useControlavel(abertaControlada, false, onMudarAberta)
  const gatilhoRef = useRef<HTMLElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const espera = useRef(0)
  const refOriginal = children.props.ref
  const refGatilho = useCallback(
    (elemento: HTMLElement | null) => {
      gatilhoRef.current = elemento
      atribuirRef(refOriginal, elemento)
    },
    [refOriginal],
  )
  const id = useId()
  const visivel = aberta && !desabilitada && conteudo !== null && conteudo !== undefined && conteudo !== ''
  const posicao = usePosicaoFlutuante(gatilhoRef, painelRef, { aberto: visivel, lado, alinhamento, deslocamento: seta ? 10 : 6 })

  function abrir(imediato = false) {
    window.clearTimeout(espera.current)
    if (imediato || Date.now() < aquecimento.ate) setAberta(true)
    else espera.current = window.setTimeout(() => setAberta(true), atraso)
  }

  function fechar() {
    window.clearTimeout(espera.current)
    if (aberta) aquecimento.ate = Date.now() + 600
    setAberta(false)
  }

  useEffect(() => {
    const temporizador = espera
    return () => window.clearTimeout(temporizador.current)
  }, [])

  useEffect(() => {
    if (!visivel) return
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberta(false)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [visivel, setAberta])

  const original = children.props
  const propriedades = {
    ref: refGatilho,
    title: undefined,
    'aria-describedby': visivel ? juntarIds(original['aria-describedby'], id) : original['aria-describedby'],
    onPointerEnter: (evento) => {
      original.onPointerEnter?.(evento)
      if (evento.pointerType !== 'touch') abrir()
    },
    onPointerLeave: (evento) => {
      original.onPointerLeave?.(evento)
      fechar()
    },
    onPointerDown: (evento) => {
      original.onPointerDown?.(evento)
      fechar()
    },
    onFocus: (evento) => {
      original.onFocus?.(evento)
      if (evento.currentTarget.matches(':focus-visible')) abrir(true)
    },
    onBlur: (evento) => {
      original.onBlur?.(evento)
      fechar()
    },
  } satisfies PropsGatilhoDica & Record<string, unknown>

  return (
    <>
      <Slot filho={children} propriedades={propriedades} />
      {visivel && (
        <Portal>
          <div
            ref={painelRef}
            id={id}
            role="tooltip"
            className={juntarClasses(estilos.dica, className)}
            data-tom={tom}
            data-variante={variante}
            data-lado={posicao?.lado ?? lado}
            style={
              {
                top: posicao?.topo ?? 0,
                left: posicao?.esquerda ?? 0,
                opacity: posicao ? undefined : 0,
                maxWidth: larguraMaxima,
                '--seta': `${posicao?.centroAncora ?? 0}px`,
              } as CSSProperties
            }
          >
            <span className={estilos.conteudo}>{conteudo}</span>
            {atalho && <Atalho combinacao={atalho} variante={tom === 'escuro' ? 'escuro' : 'tecla'} />}
            {seta && <span className={estilos.seta} aria-hidden="true" />}
          </div>
        </Portal>
      )}
    </>
  )
}
