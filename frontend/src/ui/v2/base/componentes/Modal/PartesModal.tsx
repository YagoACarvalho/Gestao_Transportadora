import { X } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { juntarClasses } from '../../utilitarios'
import { BotaoIcone } from '../BotaoIcone'
import { useModal } from './contexto'
import estilos from './Modal.module.css'

export type TomIconeModal = 'neutro' | 'primario' | 'perigo' | 'sucesso' | 'aviso'

export type PropsCabecalhoModal = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  titulo: ReactNode
  descricao?: ReactNode
  icone?: ReactNode
  tomIcone?: TomIconeModal
  trilha?: ReactNode
  acoes?: ReactNode
  fechar?: boolean
  divisor?: boolean
  fundo?: 'padrao' | 'suave' | 'gradiente'
  alinhamento?: 'inicio' | 'centro'
  tamanhoTitulo?: 'medio' | 'grande'
  abas?: ReactNode
}

export function CabecalhoModal({
  titulo,
  descricao,
  icone,
  tomIcone = 'neutro',
  trilha,
  acoes,
  fechar = true,
  divisor = false,
  fundo = 'padrao',
  alinhamento = 'inicio',
  tamanhoTitulo = 'medio',
  abas,
  className,
  children,
  ...props
}: PropsCabecalhoModal) {
  const { idTitulo, idDescricao, fechar: fecharModal } = useModal()
  return (
    <header
      className={juntarClasses(estilos.cabecalho, className)}
      data-divisor={divisor || undefined}
      data-fundo={fundo === 'padrao' ? undefined : fundo}
      data-alinhamento={alinhamento}
      data-tamanho-titulo={tamanhoTitulo}
      {...props}
    >
      <div className={estilos.topoCabecalho}>
        {icone && (
          <span className={estilos.iconeCabecalho} data-tom={tomIcone} aria-hidden="true">
            {icone}
          </span>
        )}
        <div className={estilos.textosCabecalho}>
          {trilha && <div className={estilos.trilhaCabecalho}>{trilha}</div>}
          <h2 id={idTitulo} className={estilos.titulo}>
            {titulo}
          </h2>
          {descricao && (
            <div id={idDescricao} className={estilos.descricao}>
              {descricao}
            </div>
          )}
        </div>
        {(acoes || fechar) && (
          <div className={estilos.acoesCabecalho}>
            {acoes}
            {fechar && <BotaoIcone rotulo="Fechar" icone={<X />} tamanho="medio" onClick={() => fecharModal('botao')} />}
          </div>
        )}
      </div>
      {children}
      {abas && <div className={estilos.cabecalhoAbas}>{abas}</div>}
    </header>
  )
}

export type PropsCorpoModal = HTMLAttributes<HTMLDivElement> & {
  espacamento?: 'padrao' | 'compacto' | 'nenhum'
}

export function CorpoModal({ espacamento = 'padrao', className, ...props }: PropsCorpoModal) {
  return <div data-corpo-modal="" data-espacamento={espacamento} className={juntarClasses(estilos.corpo, className)} {...props} />
}

export type PropsRodapeModal = HTMLAttributes<HTMLDivElement> & {
  inicio?: ReactNode
  divisor?: boolean
  variante?: 'padrao' | 'suave'
  alinhamento?: 'fim' | 'largura-total'
}

export function RodapeModal({
  inicio,
  divisor = true,
  variante = 'padrao',
  alinhamento = 'fim',
  className,
  children,
  ...props
}: PropsRodapeModal) {
  return (
    <footer
      className={juntarClasses(estilos.rodape, className)}
      data-divisor={(divisor && variante === 'padrao') || undefined}
      data-variante={variante}
      data-alinhamento={alinhamento}
      {...props}
    >
      {inicio && <div className={estilos.inicioRodape}>{inicio}</div>}
      <div className={estilos.acoesRodape}>{children}</div>
    </footer>
  )
}

export type PropsSecaoModal = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  titulo?: ReactNode
  descricao?: ReactNode
  acao?: ReactNode
  variante?: 'titulo' | 'rotulo'
  divisor?: boolean
}

export function SecaoModal({ titulo, descricao, acao, variante = 'titulo', divisor = false, className, children, ...props }: PropsSecaoModal) {
  return (
    <section className={juntarClasses(estilos.secao, className)} data-variante={variante} data-divisor={divisor || undefined} {...props}>
      {(titulo || acao) && (
        <div className={estilos.topoSecao}>
          {titulo && <h3 className={estilos.tituloSecao}>{titulo}</h3>}
          {acao}
        </div>
      )}
      {descricao && <p className={estilos.descricaoSecao}>{descricao}</p>}
      {children}
    </section>
  )
}

export type ItemLateralModal = {
  valor: string
  rotulo: ReactNode
  icone?: ReactNode
  fim?: ReactNode
  desabilitado?: boolean
}

export type PropsLateralModal = {
  titulo: ReactNode
  icone?: ReactNode
  acaoTitulo?: ReactNode
  descricao?: ReactNode
  itens: readonly ItemLateralModal[]
  valor: string
  onMudar: (valor: string) => void
  rodape?: ReactNode
  rotulo?: string
}

export function LateralModal({ titulo, icone, acaoTitulo, descricao, itens, valor, onMudar, rodape, rotulo = 'Etapas' }: PropsLateralModal) {
  return (
    <>
      <div className={estilos.cabecalhoLateral}>
        {icone && <span className={estilos.iconeLateral}>{icone}</span>}
        <p className={estilos.tituloLateral}>{titulo}</p>
        {acaoTitulo}
      </div>
      {descricao && <p className={estilos.descricaoLateral}>{descricao}</p>}
      <nav aria-label={rotulo} className={estilos.navLateral}>
        {itens.map((item) => (
          <button
            key={item.valor}
            type="button"
            className={estilos.itemLateral}
            aria-current={item.valor === valor ? 'step' : undefined}
            disabled={item.desabilitado}
            onClick={() => onMudar(item.valor)}
          >
            {item.icone && (
              <span className={estilos.iconeItemLateral} aria-hidden="true">
                {item.icone}
              </span>
            )}
            <span>{item.rotulo}</span>
            {item.fim}
          </button>
        ))}
      </nav>
      {rodape && <div className={estilos.rodapeLateral}>{rodape}</div>}
    </>
  )
}
