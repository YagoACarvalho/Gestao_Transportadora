import { ehMac } from '../../utilitarios'

const NOMES: Record<string, string> = { mod: '', ctrl: 'Control', control: 'Control', alt: 'Alt', option: 'Alt', shift: 'Shift', meta: 'Meta', cmd: 'Meta' }

/** "mod+k" vira "Meta+K" ou "Control+K"; sequências ("g p") não têm forma em aria-keyshortcuts */
export function ariaAtalho(combinacao: string | false | undefined) {
  if (!combinacao || /\s/.test(combinacao.trim())) return undefined
  return combinacao
    .split('+')
    .map((parte) => {
      const token = parte.trim().toLowerCase()
      if (token === 'mod') return ehMac() ? 'Meta' : 'Control'
      return NOMES[token] ?? (token.length === 1 ? token.toUpperCase() : parte.trim())
    })
    .join('+')
}
