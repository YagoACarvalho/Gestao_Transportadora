import { ArrowUpRight } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { useControlavel, usePosicaoFlutuante, type AlinhamentoFlutuante, type LadoFlutuante } from '../../hooks'
import { juntarClasses } from '../../utilitarios'
import { Portal } from '../Portal'
import { Slot } from '../Slot'
import type { TomDica } from './Dica'
import { atribuirRef, type PropsGatilhoDica } from './gatilho'
import estilos from './Dica.module.css'

export type AcaoDica = {
  rotulo: ReactNode
  onClick?: () => void
  href?: string
  externo?: boolean
  meta?: ReactNode
}

export type PropsDicaDetalhada = {
  children: ReactElement<PropsGatilhoDica>
  titulo: ReactNode
  descricao?: ReactNode
  midia?: ReactNode
  acao?: AcaoDica
  rodape?: ReactNode
  tom?: TomDica
  lado?: LadoFlutuante
  alinhamento?: AlinhamentoFlutuante
  largura?: number
  atraso?: number
  aberta?: boolean
  onMudarAberta?: (aberta: boolean) => void
  className?: string
}

export function DicaDetalhada({
  children,
  titulo,
  descricao,
  midia,
  acao,
  rodape,
  tom = 'escuro',
  lado = 'baixo',
  alinhamento = 'centro',
  largura = 280,
  atraso = 300,
  aberta,
  onMudarAberta,
  className,
}: PropsDicaDetalhada) {
  const [visivel, mudarVisivel] = useControlavel(aberta, false, onMudarAberta)
  const [fixada, setFixada] = useState(false)
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
  const posicao = usePosicaoFlutuante(gatilhoRef, painelRef, { aberto: visivel, lado, alinhamento, deslocamento: 12 })

  function abrirDepois() {
    window.clearTimeout(espera.current)
    espera.current = window.setTimeout(() => mudarVisivel(true), visivel ? 0 : atraso)
  }

  // pequena folga para o ponteiro atravessar do gatilho até o balão
  function fecharDepois() {
    window.clearTimeout(espera.current)
    if (fixada) return
    espera.current = window.setTimeout(() => mudarVisivel(false), 180)
  }

  function fechar(devolverFoco = false) {
    window.clearTimeout(espera.current)
    setFixada(false)
    mudarVisivel(false)
    if (devolverFoco) gatilhoRef.current?.focus()
  }

  useEffect(() => {
    const temporizador = espera
    return () => window.clearTimeout(temporizador.current)
  }, [])

  useEffect(() => {
    if (!visivel) return
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return
      window.clearTimeout(espera.current)
      setFixada(false)
      mudarVisivel(false)
      gatilhoRef.current?.focus()
    }
    const aoTocarFora = (evento: PointerEvent) => {
      const alvo = evento.target as Node
      if (painelRef.current?.contains(alvo) || gatilhoRef.current?.contains(alvo)) return
      window.clearTimeout(espera.current)
      setFixada(false)
      mudarVisivel(false)
    }
    document.addEventListener('keydown', aoTeclar)
    document.addEventListener('pointerdown', aoTocarFora)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.removeEventListener('pointerdown', aoTocarFora)
    }
  }, [visivel, mudarVisivel])

  const original = children.props
  const propriedades = {
    ref: refGatilho,
    title: undefined,
    'aria-expanded': visivel,
    'aria-controls': visivel ? id : undefined,
    'aria-haspopup': 'dialog',
    onPointerEnter: (evento) => {
      original.onPointerEnter?.(evento)
      if (evento.pointerType !== 'touch') abrirDepois()
    },
    onPointerLeave: (evento) => {
      original.onPointerLeave?.(evento)
      fecharDepois()
    },
    onClick: (evento) => {
      original.onClick?.(evento)
      if (fixada) {
        fechar()
        return
      }
      window.clearTimeout(espera.current)
      setFixada(true)
      mudarVisivel(true)
      // aberto pelo teclado: o foco entra no balão
      if (evento.detail === 0) window.setTimeout(() => painelRef.current?.focus(), 0)
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
            role="dialog"
            aria-labelledby={`${id}-titulo`}
            tabIndex={-1}
            className={juntarClasses(estilos.detalhada, className)}
            data-tom={tom}
            data-lado={posicao?.lado ?? lado}
            style={
              {
                top: posicao?.topo ?? 0,
                left: posicao?.esquerda ?? 0,
                width: largura,
                opacity: posicao ? undefined : 0,
                '--seta': `${posicao?.centroAncora ?? 0}px`,
              } as CSSProperties
            }
            onPointerEnter={() => window.clearTimeout(espera.current)}
            onPointerLeave={fecharDepois}
          >
            <p id={`${id}-titulo`} className={estilos.titulo}>
              {titulo}
            </p>
            {midia && <div className={estilos.midia}>{midia}</div>}
            {descricao && <div className={estilos.descricao}>{descricao}</div>}
            {acao &&
              (acao.href ? (
                <a
                  className={estilos.acao}
                  href={acao.href}
                  target={acao.externo ? '_blank' : undefined}
                  rel={acao.externo ? 'noreferrer' : undefined}
                  onClick={acao.onClick}
                >
                  <span>{acao.rotulo}</span>
                  {acao.meta && <span className={estilos.meta}>{acao.meta}</span>}
                  {acao.externo && <ArrowUpRight className={estilos.externo} aria-hidden="true" />}
                </a>
              ) : (
                <button
                  type="button"
                  className={estilos.acao}
                  onClick={() => {
                    acao.onClick?.()
                    fechar(true)
                  }}
                >
                  <span>{acao.rotulo}</span>
                  {acao.meta && <span className={estilos.meta}>{acao.meta}</span>}
                </button>
              ))}
            {rodape}
            <span className={estilos.seta} aria-hidden="true" />
          </div>
        </Portal>
      )}
    </>
  )
}
