import { TriangleAlert } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { juntarClasses } from '../../utilitarios'
import { Botao } from '../Botao'
import { ContextoPortal, Portal } from '../Portal'
import { ContextoModal, type MotivoFechar } from './contexto'
import estilos from './Modal.module.css'

export type TamanhoModal = 'pequeno' | 'medio' | 'grande' | 'enorme' | 'cheio'
export type PosicaoModal = 'centro' | 'direita' | 'esquerda' | 'topo'
export type VarianteModal = 'padrao' | 'moldura'

export type ProtecaoSaida = {
  titulo?: string
  descricao?: string
  rotuloDescartar?: string
  rotuloContinuar?: string
}

export type PropsModal = {
  aberto: boolean
  onFechar: (motivo: MotivoFechar) => void
  children: ReactNode
  tamanho?: TamanhoModal | number
  posicao?: PosicaoModal
  variante?: VarianteModal
  lateral?: ReactNode
  nota?: ReactNode
  fecharAoClicarFora?: boolean
  fecharComEsc?: boolean
  protegerSaida?: boolean | ProtecaoSaida
  focoInicial?: 'campo' | 'painel'
  rotulo?: string
  className?: string
}

const FOCO_EXPLICITO = '[data-autofocus], [autofocus]'
const PRIMEIRO_CAMPO =
  '[data-corpo-modal] :is(input:not([type="hidden"]):not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly]), select:not(:disabled))'

// várias camadas de modal travam a rolagem uma única vez
const trava = { contagem: 0 }

function travarRolagem() {
  const raiz = document.documentElement
  if (trava.contagem === 0) {
    raiz.style.setProperty('--aleph-barra-rolagem', `${window.innerWidth - raiz.clientWidth}px`)
    raiz.setAttribute('data-aleph-modal', '')
  }
  trava.contagem += 1
  return () => {
    trava.contagem -= 1
    if (trava.contagem === 0) {
      raiz.removeAttribute('data-aleph-modal')
      raiz.style.removeProperty('--aleph-barra-rolagem')
    }
  }
}

export function Modal({
  aberto,
  onFechar,
  children,
  tamanho = 'medio',
  posicao = 'centro',
  variante = 'padrao',
  lateral,
  nota,
  fecharAoClicarFora = true,
  fecharComEsc = true,
  protegerSaida = false,
  focoInicial = 'campo',
  rotulo,
  className,
}: PropsModal) {
  const [montado, setMontado] = useState(aberto)
  const [saida, setSaida] = useState<MotivoFechar | null>(null)
  const [dialogo, setDialogo] = useState<HTMLDialogElement | null>(null)
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const cliqueFora = useRef(false)
  const escNaCamada = useRef(false)
  const idBase = useId()
  // ref estável: o diálogo vira destino dos portais (menus abertos dentro do modal)
  const refDialogo = useCallback((elemento: HTMLDialogElement | null) => {
    dialogoRef.current = elemento
    setDialogo(elemento)
  }, [])
  const idTitulo = `${idBase}-titulo`
  const idDescricao = `${idBase}-descricao`

  if (aberto && !montado) setMontado(true)
  if (!aberto && saida) setSaida(null)
  const saindo = montado && !aberto

  // visualização foca o painel: o leitor de tela anuncia o título sem pular para um campo lá embaixo
  const focarInicio = useEffectEvent((elemento: HTMLDialogElement) => {
    const alvo =
      elemento.querySelector<HTMLElement>(FOCO_EXPLICITO) ??
      (focoInicial === 'campo' ? elemento.querySelector<HTMLElement>(PRIMEIRO_CAMPO) : null) ??
      painelRef.current
    alvo?.focus({ preventScroll: true })
  })

  useLayoutEffect(() => {
    const elemento = dialogoRef.current
    if (!montado || !elemento) return
    const anterior = document.activeElement as HTMLElement | null
    if (!elemento.open) elemento.showModal()
    focarInicio(elemento)
    const destravar = travarRolagem()
    return () => {
      destravar()
      if (elemento.open) elemento.close()
      anterior?.focus?.({ preventScroll: true })
    }
  }, [montado])

  // aria-labelledby e aria-describedby só existem enquanto o título e a descrição estão no diálogo
  useLayoutEffect(() => {
    const elemento = dialogo
    if (!montado || !elemento) return
    function sincronizar(alvo: HTMLDialogElement) {
      const presente = (id: string) => {
        const encontrado = alvo.ownerDocument.getElementById(id)
        return Boolean(encontrado && alvo.contains(encontrado))
      }
      if (!rotulo && presente(idTitulo)) alvo.setAttribute('aria-labelledby', idTitulo)
      else alvo.removeAttribute('aria-labelledby')
      if (presente(idDescricao)) alvo.setAttribute('aria-describedby', idDescricao)
      else alvo.removeAttribute('aria-describedby')
    }
    sincronizar(elemento)
    const observador = new MutationObserver(() => sincronizar(elemento))
    observador.observe(elemento, { childList: true, subtree: true })
    return () => observador.disconnect()
  }, [montado, dialogo, rotulo, idTitulo, idDescricao])

  // garante a desmontagem mesmo se a animação de saída não rodar (aba oculta)
  useEffect(() => {
    if (aberto || !montado) return
    const espera = window.setTimeout(() => setMontado(false), 320)
    return () => window.clearTimeout(espera)
  }, [aberto, montado])

  function tentarFechar(motivo: MotivoFechar = 'botao') {
    if (protegerSaida && motivo !== 'acao') {
      setSaida(motivo)
      return
    }
    onFechar(motivo)
  }

  if (!montado) return null

  const protecao = typeof protegerSaida === 'object' ? protegerSaida : {}
  const largura = typeof tamanho === 'number' ? ({ '--modal-largura': `${tamanho}px` } as CSSProperties) : undefined

  const conteudo = lateral ? (
    <div className={estilos.comLateral}>
      <aside className={estilos.lateral}>{lateral}</aside>
      <div className={estilos.principal}>{children}</div>
    </div>
  ) : (
    children
  )

  return (
    <Portal>
      <dialog
        ref={refDialogo}
        className={estilos.dialogo}
        data-posicao={posicao}
        data-saindo={saindo || undefined}
        aria-label={rotulo}
        onKeyDownCapture={(evento) => {
          // o Esc que fecha um menu aberto não deve fechar o modal junto
          if (evento.key === 'Escape') escNaCamada.current = Boolean(dialogoRef.current?.querySelector('[data-camada-flutuante]'))
        }}
        onCancel={(evento) => {
          evento.preventDefault()
          if (escNaCamada.current) {
            escNaCamada.current = false
            return
          }
          if (saida) setSaida(null)
          else if (fecharComEsc) tentarFechar('esc')
        }}
        onClose={() => {
          if (aberto) onFechar('esc')
        }}
      >
        <ContextoPortal.Provider value={dialogo}>
          <ContextoModal.Provider value={{ idTitulo, idDescricao, fechar: tentarFechar }}>
            <div
              className={estilos.camada}
              onPointerDown={(evento) => {
                cliqueFora.current = evento.target === evento.currentTarget
              }}
              onClick={(evento) => {
                if (evento.target !== evento.currentTarget || !cliqueFora.current) return
                cliqueFora.current = false
                if (fecharAoClicarFora) tentarFechar('fora')
                else painelRef.current?.animate(
                  [{ transform: 'scale(1)' }, { transform: 'scale(1.015)' }, { transform: 'scale(1)' }],
                  { duration: 220, easing: 'ease-out' },
                )
              }}
            >
              <div
                ref={painelRef}
                tabIndex={-1}
                className={juntarClasses(estilos.painel, className)}
                data-tamanho={typeof tamanho === 'number' ? 'livre' : tamanho}
                data-variante={variante}
                data-com-lateral={lateral ? true : undefined}
                style={largura}
                onAnimationEnd={(evento) => {
                  if (saindo && evento.target === evento.currentTarget) setMontado(false)
                }}
              >
                {variante === 'moldura' ? (
                  <>
                    <div className={estilos.cartao}>{conteudo}</div>
                    {nota && <div className={estilos.nota}>{nota}</div>}
                  </>
                ) : (
                  conteudo
                )}
                {saida && (
                  <div className={estilos.protecao}>
                    <div className={estilos.caixaProtecao} role="alertdialog" aria-labelledby={`${idBase}-saida`} aria-describedby={`${idBase}-saida-descricao`}>
                      <span className={estilos.iconeProtecao} aria-hidden="true">
                        <TriangleAlert />
                      </span>
                      <div>
                        <p id={`${idBase}-saida`} className={estilos.tituloProtecao}>
                          {protecao.titulo ?? 'Descartar alterações?'}
                        </p>
                        <p id={`${idBase}-saida-descricao`} className={estilos.descricaoProtecao}>
                          {protecao.descricao ?? 'O que você preencheu ainda não foi salvo e será perdido.'}
                        </p>
                      </div>
                      <div className={estilos.acoesProtecao}>
                        <Botao variante="contorno" tamanho="pequeno" onClick={() => setSaida(null)} autoFocus>
                          {protecao.rotuloContinuar ?? 'Continuar editando'}
                        </Botao>
                        <Botao
                          variante="solido"
                          tom="perigo"
                          tamanho="pequeno"
                          onClick={() => {
                            const motivo = saida
                            setSaida(null)
                            onFechar(motivo)
                          }}
                        >
                          {protecao.rotuloDescartar ?? 'Descartar'}
                        </Botao>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ContextoModal.Provider>
        </ContextoPortal.Provider>
      </dialog>
    </Portal>
  )
}
