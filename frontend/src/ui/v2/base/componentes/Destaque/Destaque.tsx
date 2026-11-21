import { Fragment } from 'react'
import { encontrarTrechos } from '../../utilitarios'
import estilos from './Destaque.module.css'

export type PropsDestaque = {
  texto: string
  termo?: string
}

export function Destaque({ texto, termo = '' }: PropsDestaque) {
  return encontrarTrechos(texto, termo).map((trecho, indice) =>
    trecho.destaque ? (
      <mark key={indice} className={estilos.marca}>
        {trecho.texto}
      </mark>
    ) : (
      <Fragment key={indice}>{trecho.texto}</Fragment>
    ),
  )
}
