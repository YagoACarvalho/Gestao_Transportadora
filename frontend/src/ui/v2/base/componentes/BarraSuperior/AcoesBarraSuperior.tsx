import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react'
import { useAtalho } from '../../hooks'
import type { Cor } from '../../tema'
import { combinarRefs, juntarClasses } from '../../utilitarios'
import { Avatar } from '../Avatar'
import { ContainerUsuario } from '../ContainerUsuario'
import { CabecalhoMenu, MenuSuspenso } from '../Menu'
import { BotaoComDica } from '../MenuLateral/BotaoComDica'
import { PainelFlutuante } from '../PainelFlutuante'
import { Sinalizador } from '../Sinalizador'
import estilos from './BarraSuperior.module.css'

export type PropsAcaoBarraSuperior = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icone: ReactNode
  rotulo: string
  contador?: number
  ponto?: boolean
  tomSinal?: Cor | 'primaria'
  /** combinação que dispara a ação e aparece na dica */
  atalho?: string
  /** conteúdo de um painel flutuante aberto pelo botão (notificações, ajuda) */
  painel?: ConteudoPainelAcao
  larguraPainel?: number
  /** itens de um MenuSuspenso aberto pelo botão */
  menu?: ReactNode
  pressionado?: boolean
  ref?: Ref<HTMLButtonElement>
}

export type ConteudoPainelAcao = ReactNode | ((fechar: () => void) => ReactNode)

function ConteudoPainel({ painel, fechar }: { painel: ConteudoPainelAcao; fechar: () => void }) {
  return <>{typeof painel === 'function' ? painel(fechar) : painel}</>
}

export function AcaoBarraSuperior({
  icone,
  rotulo,
  contador,
  ponto = false,
  tomSinal = 'vermelho',
  atalho,
  painel,
  larguraPainel = 360,
  menu,
  pressionado,
  className,
  onClick,
  ref,
  ...props
}: PropsAcaoBarraSuperior) {
  const [aberto, setAberto] = useState(false)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const refBotao = useCallback((no: HTMLButtonElement | null) => combinarRefs(botaoRef, ref)(no), [ref])
  const id = useId()
  const rotuloCompleto = contador ? `${rotulo}, ${contador} novas` : rotulo

  useEffect(() => {
    if (aberto) painelRef.current?.focus({ preventScroll: true })
  }, [aberto])

  useAtalho(atalho ?? '', () => botaoRef.current?.click(), { ativo: Boolean(atalho) })

  function fechar() {
    setAberto(false)
    botaoRef.current?.focus()
  }

  const comum = {
    dica: rotulo,
    atalhoDica: atalho,
    ladoDica: 'baixo' as const,
    className: juntarClasses(estilos.acao, className),
    'aria-label': rotuloCompleto,
    'aria-pressed': pressionado,
    ...props,
  }

  const botao = menu ? (
    <MenuSuspenso alinhamento="fim" rotulo={rotulo} gatilho={<BotaoComDica ref={refBotao} {...comum} onClick={onClick}>{icone}</BotaoComDica>}>
      {menu}
    </MenuSuspenso>
  ) : (
    <BotaoComDica
      ref={refBotao}
      {...comum}
      semDica={aberto}
      aria-haspopup={painel ? 'dialog' : undefined}
      aria-expanded={painel ? aberto : undefined}
      aria-controls={painel && aberto ? id : undefined}
      data-aberto={aberto || undefined}
      onClick={(evento) => {
        onClick?.(evento)
        if (!evento.defaultPrevented && painel) setAberto(!aberto)
      }}
    >
      {icone}
    </BotaoComDica>
  )

  return (
    <>
      <Sinalizador conteudo={contador} ponto={ponto} tom={tomSinal} sobreposicao="circulo" className={estilos.sinal}>
        {botao}
      </Sinalizador>
      {painel && (
        <PainelFlutuante
          aberto={aberto}
          ancora={botaoRef}
          alinhamento="fim"
          largura={larguraPainel}
          onFechar={(motivo) => {
            if (motivo === 'escape') fechar()
            else setAberto(false)
          }}
        >
          <div ref={painelRef} id={id} role="dialog" aria-label={rotulo} tabIndex={-1} className={estilos.painelAcao}>
            <ConteudoPainel painel={painel} fechar={fechar} />
          </div>
        </PainelFlutuante>
      )}
    </>
  )
}

export type PropsUsuarioBarraSuperior = {
  nome: string
  descricao?: string
  avatarSrc?: string
  cor?: Cor
  mostrarNome?: boolean
  /** itens do menu da conta (ItemMenu, SeparadorMenu) */
  children: ReactNode
  rotuloMenu?: string
  className?: string
}

export function UsuarioBarraSuperior({
  nome,
  descricao,
  avatarSrc,
  cor,
  mostrarNome = false,
  children,
  rotuloMenu = 'Conta',
  className,
}: PropsUsuarioBarraSuperior) {
  return (
    <MenuSuspenso
      alinhamento="fim"
      largura={264}
      rotulo={rotuloMenu}
      gatilho={
        <BotaoComDica
          dica={nome}
          ladoDica="baixo"
          semDica
          className={juntarClasses(estilos.usuario, className)}
          data-com-nome={mostrarNome || undefined}
          aria-label={`${nome}, menu da conta`}
        >
          <Avatar nome={nome} src={avatarSrc} cor={cor} tamanho={30} decorativo />
          {mostrarNome && <span className={estilos.nomeUsuario}>{nome}</span>}
          <ChevronDown className={estilos.setaUsuario} aria-hidden="true" />
        </BotaoComDica>
      }
    >
      <CabecalhoMenu>
        <ContainerUsuario nome={nome} descricao={descricao} avatarSrc={avatarSrc} corAvatar={cor} tamanho="pequeno" />
      </CabecalhoMenu>
      {children}
    </MenuSuspenso>
  )
}

export function SeparadorBarraSuperior({ className }: { className?: string }) {
  return <span role="separator" aria-orientation="vertical" className={juntarClasses(estilos.separador, className)} />
}
