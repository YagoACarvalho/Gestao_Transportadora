import { Check, ChevronRight, Copy, Ellipsis } from 'lucide-react'
import { Fragment, useState, type HTMLAttributes, type ReactNode } from 'react'
import { juntarClasses } from '../../utilitarios'
import { ItemMenu, MenuSuspenso } from '../Menu'
import estilos from './TrilhaNavegacao.module.css'

export type ItemTrilha = {
  rotulo: ReactNode
  href?: string
  onClick?: () => void
  icone?: ReactNode
  textoMenu?: string
}

export type PropsTrilhaNavegacao = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  itens: readonly ItemTrilha[]
  separador?: 'seta' | 'barra' | ReactNode
  maximo?: number
  copiar?: string
  tamanho?: 'pequeno' | 'medio' | 'grande'
  rotulo?: string
}

export function TrilhaNavegacao({
  itens,
  separador = 'seta',
  maximo,
  copiar,
  tamanho = 'medio',
  rotulo = 'Trilha de navegação',
  className,
  ...props
}: PropsTrilhaNavegacao) {
  const [copiado, setCopiado] = useState(false)
  const recolher = maximo !== undefined && itens.length > maximo && maximo >= 2
  const escondidos = recolher ? itens.slice(1, itens.length - (maximo - 1)) : []
  const visiveis = recolher ? [itens[0], null, ...itens.slice(itens.length - (maximo - 1))] : itens

  const marcaSeparador =
    separador === 'seta' ? <ChevronRight /> : separador === 'barra' ? <span className={estilos.barra}>/</span> : separador

  async function copiarTexto() {
    if (!copiar) return
    try {
      await navigator.clipboard.writeText(copiar)
    } catch {
      return
    }
    setCopiado(true)
    window.setTimeout(() => setCopiado(false), 1600)
  }

  return (
    <nav aria-label={rotulo} className={juntarClasses(estilos.trilha, className)} data-tamanho={tamanho} {...props}>
      <ol className={estilos.lista}>
        {visiveis.map((item, indice) => {
          const ultimo = indice === visiveis.length - 1
          return (
            <Fragment key={indice}>
              {indice > 0 && (
                <li className={estilos.separador} aria-hidden="true">
                  {marcaSeparador}
                </li>
              )}
              <li className={estilos.item}>
                {item === null ? (
                  <MenuSuspenso
                    rotulo="Níveis ocultos"
                    gatilho={
                      <button type="button" className={estilos.reticencias} aria-label={`Mostrar ${escondidos.length} níveis ocultos`}>
                        <Ellipsis />
                      </button>
                    }
                  >
                    {escondidos.map((oculto, posicao) => (
                      <ItemMenu key={posicao} icone={oculto.icone} href={oculto.href} onSelecionar={oculto.onClick}>
                        {oculto.textoMenu ?? oculto.rotulo}
                      </ItemMenu>
                    ))}
                  </MenuSuspenso>
                ) : ultimo ? (
                  <span className={estilos.atual} aria-current="page">
                    {item.icone && <span className={estilos.icone}>{item.icone}</span>}
                    <span className={estilos.texto}>{item.rotulo}</span>
                  </span>
                ) : item.href || item.onClick ? (
                  <a
                    className={estilos.link}
                    href={item.href ?? '#'}
                    onClick={
                      item.onClick
                        ? (evento) => {
                            if (!item.href) evento.preventDefault()
                            item.onClick?.()
                          }
                        : undefined
                    }
                  >
                    {item.icone && <span className={estilos.icone}>{item.icone}</span>}
                    <span className={estilos.texto}>{item.rotulo}</span>
                  </a>
                ) : (
                  <span className={estilos.link} data-estatico>
                    {item.icone && <span className={estilos.icone}>{item.icone}</span>}
                    <span className={estilos.texto}>{item.rotulo}</span>
                  </span>
                )}
              </li>
            </Fragment>
          )
        })}
        {copiar && (
          <li className={estilos.item}>
            <button type="button" className={estilos.copiar} onClick={copiarTexto} aria-label={copiado ? 'Copiado' : 'Copiar caminho'} data-copiado={copiado || undefined}>
              {copiado ? <Check /> : <Copy />}
            </button>
          </li>
        )}
      </ol>
    </nav>
  )
}
