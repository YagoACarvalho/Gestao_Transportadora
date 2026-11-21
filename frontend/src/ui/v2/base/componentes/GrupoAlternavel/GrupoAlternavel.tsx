import {
  createContext,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { juntarClasses } from '../../utilitarios'
import estilos from './GrupoAlternavel.module.css'

export type VarianteGrupoAlternavel = 'trilho' | 'embutido' | 'solto'
export type TamanhoGrupoAlternavel = 'pequeno' | 'medio' | 'grande'
export type FormaGrupoAlternavel = 'pilula' | 'quadrado'

type PropsBase = Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> & {
  rotulo: string
  variante?: VarianteGrupoAlternavel
  tamanho?: TamanhoGrupoAlternavel
  forma?: FormaGrupoAlternavel
  children: ReactNode
}

type PropsUnico = PropsBase & {
  tipo?: 'unico'
  valor?: string | null
  valorPadrao?: string | null
  onMudar?: (valor: string | null) => void
  obrigatorio?: boolean
}

type PropsMultiplo = PropsBase & {
  tipo: 'multiplo'
  valor?: string[]
  valorPadrao?: string[]
  onMudar?: (valor: string[]) => void
}

export type PropsGrupoAlternavel = PropsUnico | PropsMultiplo

type PropsInternas = PropsBase & {
  tipo?: 'unico' | 'multiplo'
  valor?: string | string[] | null
  valorPadrao?: string | string[] | null
  onMudar?: (valor: never) => void
  obrigatorio?: boolean
}

type ContextoGrupo = {
  selecionados: string[]
  alternar: (valor: string) => void
}

const ContextoAlternavel = createContext<ContextoGrupo | null>(null)

const paraLista = (valor: string | string[] | null | undefined) =>
  valor == null ? [] : Array.isArray(valor) ? valor : [valor]

export function GrupoAlternavel(props: PropsGrupoAlternavel) {
  const {
    tipo = 'unico',
    valor,
    valorPadrao,
    onMudar,
    obrigatorio = false,
    rotulo,
    variante = 'trilho',
    tamanho = 'medio',
    forma = 'pilula',
    className,
    children,
    ...resto
  } = props as PropsInternas
  const [interno, setInterno] = useState(() => paraLista(valorPadrao))
  const controlado = valor !== undefined
  const selecionados = controlado ? paraLista(valor) : interno

  function alternar(item: string) {
    const ativo = selecionados.includes(item)
    if (tipo !== 'multiplo' && ativo && obrigatorio) return
    const proximo =
      tipo === 'multiplo'
        ? ativo
          ? selecionados.filter((atual) => atual !== item)
          : [...selecionados, item]
        : ativo
          ? obrigatorio
            ? selecionados
            : []
          : [item]
    if (!controlado) setInterno(proximo)
    const mudar = onMudar as ((valor: string | string[] | null) => void) | undefined
    mudar?.(tipo === 'multiplo' ? proximo : (proximo[0] ?? null))
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(evento.key)) return
    const botoes = Array.from(evento.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
    const atual = botoes.indexOf(document.activeElement as HTMLButtonElement)
    if (atual === -1) return
    evento.preventDefault()
    const proximo =
      evento.key === 'Home'
        ? 0
        : evento.key === 'End'
          ? botoes.length - 1
          : (atual + (evento.key === 'ArrowRight' ? 1 : -1) + botoes.length) % botoes.length
    botoes[proximo].focus()
  }

  return (
    <ContextoAlternavel.Provider value={{ selecionados, alternar }}>
      <div
        role="group"
        aria-label={rotulo}
        className={juntarClasses(estilos.grupo, className)}
        data-variante={variante}
        data-tamanho={tamanho}
        data-forma={forma}
        onKeyDown={aoTeclar}
        {...resto}
      >
        {children}
      </div>
    </ContextoAlternavel.Provider>
  )
}

export type PropsItemAlternavel = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'children'> & {
  valor: string
  rotulo: string
  icone?: ReactNode
  children?: ReactNode
}

export function ItemAlternavel({ valor, rotulo, icone, children, className, onClick, ...props }: PropsItemAlternavel) {
  const contexto = useContext(ContextoAlternavel)
  if (!contexto) throw new Error('ItemAlternavel precisa estar dentro de um GrupoAlternavel')
  const ativo = contexto.selecionados.includes(valor)

  return (
    <button
      type="button"
      className={juntarClasses(estilos.item, className)}
      data-com-texto={children ? true : undefined}
      aria-pressed={ativo}
      aria-label={children ? undefined : rotulo}
      title={props.title ?? rotulo}
      {...props}
      onClick={(evento) => {
        onClick?.(evento)
        if (!evento.defaultPrevented) contexto.alternar(valor)
      }}
    >
      {icone}
      {children && <span className={estilos.texto}>{children}</span>}
    </button>
  )
}
