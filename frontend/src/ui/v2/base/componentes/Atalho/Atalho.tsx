import { Fragment } from 'react'
import { usePlataformaMac } from '../../hooks'
import { juntarClasses, teclasDoAtalho, type TeclaAtalho } from '../../utilitarios'
import estilos from './Atalho.module.css'

export type VarianteAtalho = 'tecla' | 'contorno' | 'unico' | 'texto' | 'escuro'
export type TamanhoAtalho = 'pequeno' | 'medio' | 'grande'

export type PropsAtalho = {
  teclas?: string | readonly string[]
  combinacao?: string
  variante?: VarianteAtalho
  tamanho?: TamanhoAtalho
  separador?: string
  className?: string
}

export function Atalho({ teclas, combinacao, variante = 'tecla', tamanho = 'pequeno', separador, className }: PropsAtalho) {
  const mac = usePlataformaMac()
  const passos: TeclaAtalho[][] = combinacao
    ? teclasDoAtalho(combinacao, mac)
    : [(typeof teclas === 'string' ? [teclas] : (teclas ?? [])).map((tecla) => ({ simbolo: tecla, nome: tecla }))]
  const juntar = (passo: TeclaAtalho[]) => passo.map((tecla) => tecla.simbolo).join(mac || !combinacao ? '' : '+')
  const falado = passos.map((passo) => passo.map((tecla) => tecla.nome).join(' ')).join(', depois ')

  if (variante === 'texto') {
    return (
      <span className={juntarClasses(estilos.texto, className)} data-tamanho={tamanho}>
        {combinacao ? passos.map(juntar).join(' depois ') : passos[0].map((tecla) => tecla.simbolo).join('+')}
      </span>
    )
  }

  return (
    <span className={juntarClasses(estilos.teclas, className)} data-variante={variante} data-tamanho={tamanho}>
      <span className={estilos.oculto}>{falado}</span>
      {passos.map((passo, indicePasso) => (
        <Fragment key={indicePasso}>
          {indicePasso > 0 && (
            <span className={estilos.depois} aria-hidden="true">
              depois
            </span>
          )}
          {variante === 'unico' ? (
            <kbd className={estilos.tecla} aria-hidden="true">
              {juntar(passo)}
            </kbd>
          ) : (
            passo.map((tecla, indice) => (
              <Fragment key={indice}>
                {separador && indice > 0 && (
                  <span className={estilos.separador} aria-hidden="true">
                    {separador}
                  </span>
                )}
                <kbd className={estilos.tecla} data-simbolo={tecla.simbolo.length === 1 || undefined} aria-hidden="true">
                  {tecla.simbolo}
                </kbd>
              </Fragment>
            ))
          )}
        </Fragment>
      ))}
    </span>
  )
}
