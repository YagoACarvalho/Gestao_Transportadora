import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import type { LadoFlutuante } from '../../hooks'
import { Dica } from '../Dica'

export type PropsBotaoComDica = ButtonHTMLAttributes<HTMLButtonElement> & {
  dica: ReactNode
  atalhoDica?: string
  ladoDica?: LadoFlutuante
  semDica?: boolean
  ref?: Ref<HTMLButtonElement>
}

// gatilho de MenuSuspenso que também mostra uma Dica: as props injetadas pelo menu chegam ao botão
export function BotaoComDica({ dica, atalhoDica, ladoDica = 'direita', semDica = false, type = 'button', ...props }: PropsBotaoComDica) {
  return (
    <Dica conteudo={dica} atalho={atalhoDica} lado={ladoDica} desabilitada={semDica}>
      <button type={type} {...props} />
    </Dica>
  )
}
