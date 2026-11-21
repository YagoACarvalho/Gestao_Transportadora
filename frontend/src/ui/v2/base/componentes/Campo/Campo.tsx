import { Info } from 'lucide-react'
import { useId, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react'
import { juntarClasses } from '../../utilitarios'
import { RotuloCampo } from '../RotuloCampo'
import { ContextoDoCampo, type ContextoCampo } from './contexto'
import estilos from './Campo.module.css'

export type PropsCampo = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children: ReactNode
  rotulo?: ReactNode
  opcional?: boolean | string
  obrigatorio?: boolean
  ajuda?: ReactNode
  erro?: ReactNode
  dica?: string
  acaoRotulo?: ReactNode
  desabilitado?: boolean
  idControle?: string
}

export function Campo({
  children,
  rotulo,
  opcional,
  obrigatorio = false,
  ajuda,
  erro,
  dica,
  acaoRotulo,
  desabilitado = false,
  idControle,
  className,
  ...props
}: PropsCampo) {
  const idBase = useId()
  const id = idControle ?? `${idBase}-controle`
  const idMensagem = `${idBase}-mensagem`
  const [erroInterno, setErroInterno] = useState<string>()
  const [contador, setContador] = useState<ReactNode>()
  const erroFinal = erro ?? erroInterno
  const mensagem = erroFinal ?? ajuda

  const contexto = useMemo<ContextoCampo>(
    () => ({
      id,
      idMensagem,
      desabilitado,
      obrigatorio,
      invalido: Boolean(erroFinal),
      temMensagem: Boolean(mensagem),
      definirErroInterno: setErroInterno,
      definirContador: setContador,
    }),
    [id, idMensagem, desabilitado, obrigatorio, erroFinal, mensagem],
  )

  return (
    <div
      className={juntarClasses(estilos.campo, className)}
      data-invalido={erroFinal ? true : undefined}
      data-desabilitado={desabilitado || undefined}
      {...props}
    >
      {(rotulo || acaoRotulo) && (
        <div className={estilos.topo}>
          {rotulo && (
            <RotuloCampo htmlFor={id} opcional={opcional} obrigatorio={obrigatorio}>
              {rotulo}
              {dica && (
                <span className={estilos.dica} title={dica} aria-label={dica} role="img">
                  <Info aria-hidden="true" />
                </span>
              )}
            </RotuloCampo>
          )}
          {acaoRotulo && <span className={estilos.acaoRotulo}>{acaoRotulo}</span>}
        </div>
      )}
      <ContextoDoCampo.Provider value={contexto}>{children}</ContextoDoCampo.Provider>
      {(mensagem || contador) && (
        <div className={estilos.rodape}>
          {mensagem ? (
            <span
              id={idMensagem}
              className={estilos.mensagem}
              data-erro={erroFinal ? true : undefined}
              role={erroFinal ? 'alert' : undefined}
            >
              {mensagem}
            </span>
          ) : (
            <span />
          )}
          {contador && <span className={estilos.contador}>{contador}</span>}
        </div>
      )}
    </div>
  )
}
