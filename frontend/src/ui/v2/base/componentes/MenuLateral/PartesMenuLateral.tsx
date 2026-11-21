import { ChevronsUpDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { Cor } from '../../tema'
import { juntarClasses } from '../../utilitarios'
import { Avatar } from '../Avatar'
import { ContainerUsuario } from '../ContainerUsuario'
import { CabecalhoMenu, ItemMenu, MenuSuspenso, RotuloMenu, SeparadorMenu } from '../Menu'
import { BotaoComDica } from './BotaoComDica'
import { useMenuLateral } from './contexto'
import estilos from './MenuLateral.module.css'

export type EspacoTrabalho = {
  valor: string
  nome: string
  descricao?: string
  logo?: ReactNode
  cor?: Cor
}

export type PropsEspacoTrabalhoMenuLateral = {
  espacos: readonly EspacoTrabalho[]
  valor?: string
  valorPadrao?: string
  onMudar?: (valor: string) => void
  /** itens extras no fim do menu, como "Criar espaço" */
  acoes?: ReactNode
  rotuloMenu?: string
  className?: string
}

function LogoEspaco({ espaco, tamanho }: { espaco: EspacoTrabalho; tamanho: number }) {
  return (
    <span className={estilos.logoEspaco} style={{ width: tamanho, height: tamanho }} aria-hidden="true">
      {espaco.logo ?? <Avatar nome={espaco.nome} cor={espaco.cor} forma="arredondado" tamanho={tamanho} decorativo />}
    </span>
  )
}

export function EspacoTrabalhoMenuLateral({
  espacos,
  valor,
  valorPadrao,
  onMudar,
  acoes,
  rotuloMenu = 'Espaços de trabalho',
  className,
}: PropsEspacoTrabalhoMenuLateral) {
  const menu = useMenuLateral()
  const [interno, setInterno] = useState(valorPadrao ?? espacos[0]?.valor)
  const atualValor = valor ?? interno
  const atual = espacos.find((espaco) => espaco.valor === atualValor) ?? espacos[0]
  if (!atual) return null

  const conteudo = (
    <>
      <LogoEspaco espaco={atual} tamanho={32} />
      <span className={estilos.textosEspaco}>
        <span className={estilos.nomeEspaco}>{atual.nome}</span>
        {atual.descricao && <span className={estilos.descricaoEspaco}>{atual.descricao}</span>}
      </span>
    </>
  )

  if (espacos.length < 2 && !acoes) {
    return <div className={juntarClasses(estilos.espaco, className)}>{conteudo}</div>
  }

  return (
    <MenuSuspenso
      rotulo={rotuloMenu}
      lado={menu.recolhido ? 'direita' : 'baixo'}
      alinhamento="inicio"
      largura={260}
      gatilho={
        <BotaoComDica
          dica={atual.nome}
          semDica={!menu.recolhido}
          className={juntarClasses(estilos.espaco, className)}
          data-interativo=""
          aria-label={`${atual.nome}, trocar espaço de trabalho`}
        >
          {conteudo}
          <ChevronsUpDown className={estilos.setaEspaco} aria-hidden="true" />
        </BotaoComDica>
      }
    >
      <RotuloMenu>{rotuloMenu}</RotuloMenu>
      {espacos.map((espaco) => (
        <ItemMenu
          key={espaco.valor}
          icone={<LogoEspaco espaco={espaco} tamanho={26} />}
          descricao={espaco.descricao}
          selecionado={espaco.valor === atual.valor}
          onSelecionar={() => {
            if (valor === undefined) setInterno(espaco.valor)
            onMudar?.(espaco.valor)
          }}
        >
          {espaco.nome}
        </ItemMenu>
      ))}
      {acoes && (
        <>
          <SeparadorMenu />
          {acoes}
        </>
      )}
    </MenuSuspenso>
  )
}

export type PropsUsuarioMenuLateral = {
  nome: string
  descricao?: string
  avatarSrc?: string
  cor?: Cor
  /** itens do menu da conta (ItemMenu, SeparadorMenu) */
  children?: ReactNode
  rotuloMenu?: string
  className?: string
}

export function UsuarioMenuLateral({
  nome,
  descricao,
  avatarSrc,
  cor,
  children,
  rotuloMenu = 'Conta',
  className,
}: PropsUsuarioMenuLateral) {
  const menu = useMenuLateral()

  const conteudo = (
    <>
      <Avatar nome={nome} src={avatarSrc} cor={cor} tamanho={32} decorativo />
      <span className={estilos.textosEspaco}>
        <span className={estilos.nomeUsuario}>{nome}</span>
        {descricao && <span className={estilos.descricaoEspaco}>{descricao}</span>}
      </span>
    </>
  )

  if (!children) {
    return <div className={juntarClasses(estilos.usuario, className)}>{conteudo}</div>
  }

  return (
    <MenuSuspenso
      rotulo={rotuloMenu}
      lado={menu.recolhido ? 'direita' : 'cima'}
      alinhamento={menu.recolhido ? 'fim' : 'inicio'}
      larguraDoGatilho={!menu.recolhido}
      largura={menu.recolhido ? 248 : undefined}
      gatilho={
        <BotaoComDica
          dica={nome}
          semDica={!menu.recolhido}
          className={juntarClasses(estilos.usuario, className)}
          data-interativo=""
          aria-label={`${nome}, menu da conta`}
        >
          {conteudo}
          <ChevronsUpDown className={estilos.setaEspaco} aria-hidden="true" />
        </BotaoComDica>
      }
    >
      {menu.recolhido && (
        <CabecalhoMenu>
          <ContainerUsuario nome={nome} descricao={descricao} avatarSrc={avatarSrc} corAvatar={cor} tamanho="pequeno" />
        </CabecalhoMenu>
      )}
      {children}
    </MenuSuspenso>
  )
}
