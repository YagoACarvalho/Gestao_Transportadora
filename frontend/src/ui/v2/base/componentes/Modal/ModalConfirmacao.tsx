import { Info, TriangleAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Botao } from '../Botao'
import { Entrada } from '../Entrada'
import { useModal } from './contexto'
import { Modal } from './Modal'
import { CorpoModal, RodapeModal } from './PartesModal'
import estilos from './Modal.module.css'

export type TomConfirmacao = 'perigo' | 'primario' | 'neutro'

export type PropsModalConfirmacao = {
  aberto: boolean
  onFechar: () => void
  titulo: ReactNode
  descricao?: ReactNode
  tom?: TomConfirmacao
  icone?: ReactNode
  rotuloConfirmar?: string
  rotuloCancelar?: string
  onConfirmar: () => void | Promise<void>
  textoConfirmacao?: string
  children?: ReactNode
}

function Topo({ titulo, descricao, tom, icone }: Pick<PropsModalConfirmacao, 'titulo' | 'descricao' | 'tom' | 'icone'>) {
  const { idTitulo, idDescricao } = useModal()
  return (
    <div className={estilos.confirmacao}>
      <span className={estilos.iconeCabecalho} data-tom={tom === 'neutro' ? undefined : tom} aria-hidden="true">
        {icone ?? (tom === 'perigo' ? <TriangleAlert /> : <Info />)}
      </span>
      <h2 id={idTitulo} className={estilos.titulo}>
        {titulo}
      </h2>
      {descricao && (
        <div id={idDescricao} className={estilos.descricao}>
          {descricao}
        </div>
      )}
    </div>
  )
}

export function ModalConfirmacao({
  aberto,
  onFechar,
  titulo,
  descricao,
  tom = 'perigo',
  icone,
  rotuloConfirmar = 'Confirmar',
  rotuloCancelar = 'Cancelar',
  onConfirmar,
  textoConfirmacao,
  children,
}: PropsModalConfirmacao) {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string>()
  const [digitado, setDigitado] = useState('')
  const [abertoAntes, setAbertoAntes] = useState(aberto)

  // cada abertura começa limpa
  if (aberto !== abertoAntes) {
    setAbertoAntes(aberto)
    if (aberto) {
      setErro(undefined)
      setDigitado('')
    }
  }

  const bloqueado = Boolean(textoConfirmacao) && digitado.trim() !== textoConfirmacao

  async function confirmar() {
    if (bloqueado) return
    setCarregando(true)
    setErro(undefined)
    try {
      await onConfirmar()
      onFechar()
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível concluir. Tente de novo.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={() => {
        if (!carregando) onFechar()
      }}
      tamanho="pequeno"
      fecharAoClicarFora={!carregando}
    >
      <Topo titulo={titulo} descricao={descricao} tom={tom} icone={icone} />
      {(children || textoConfirmacao || erro) && (
        <CorpoModal espacamento="compacto">
          {children}
          {textoConfirmacao && (
            <Entrada
              rotulo={
                <>
                  Digite <strong>{textoConfirmacao}</strong> para confirmar
                </>
              }
              valor={digitado}
              onMudarValor={setDigitado}
              autoComplete="off"
              spellCheck={false}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter') void confirmar()
              }}
            />
          )}
          {erro && (
            <p className={estilos.erroConfirmacao} role="alert">
              {erro}
            </p>
          )}
        </CorpoModal>
      )}
      <RodapeModal divisor={false}>
        <Botao variante="contorno" onClick={onFechar} disabled={carregando}>
          {rotuloCancelar}
        </Botao>
        <Botao
          variante="solido"
          tom={tom === 'perigo' ? 'perigo' : tom === 'primario' ? 'primario' : 'neutro'}
          carregando={carregando}
          disabled={bloqueado}
          onClick={confirmar}
          data-autofocus={textoConfirmacao ? undefined : ''}
        >
          {rotuloConfirmar}
        </Botao>
      </RodapeModal>
    </Modal>
  )
}
