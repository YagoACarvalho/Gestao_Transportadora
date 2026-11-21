export type TeclaAtalho = { simbolo: string; nome: string }
export type PassoAtalho = { mod: boolean; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean; tecla: string }

const MODIFICADORES = new Set(['mod', 'cmd', 'command', 'meta', 'ctrl', 'control', 'alt', 'option', 'opt', 'shift'])

const APELIDOS: Record<string, string> = {
  return: 'enter',
  escape: 'esc',
  space: 'espaco',
  del: 'delete',
  up: 'cima',
  down: 'baixo',
  left: 'esquerda',
  right: 'direita',
  plus: 'mais',
}

// nome da tecla no atalho -> valor de KeyboardEvent.key
const TECLAS_DO_EVENTO: Record<string, string> = {
  enter: 'Enter',
  esc: 'Escape',
  tab: 'Tab',
  espaco: ' ',
  backspace: 'Backspace',
  delete: 'Delete',
  cima: 'ArrowUp',
  baixo: 'ArrowDown',
  esquerda: 'ArrowLeft',
  direita: 'ArrowRight',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  home: 'Home',
  end: 'End',
  mais: '+',
}

const SIMBOLOS_MAC: Record<string, TeclaAtalho> = {
  mod: { simbolo: '⌘', nome: 'Command' },
  meta: { simbolo: '⌘', nome: 'Command' },
  ctrl: { simbolo: '⌃', nome: 'Control' },
  alt: { simbolo: '⌥', nome: 'Option' },
  shift: { simbolo: '⇧', nome: 'Shift' },
}

const SIMBOLOS_PC: Record<string, TeclaAtalho> = {
  mod: { simbolo: 'Ctrl', nome: 'Control' },
  meta: { simbolo: 'Win', nome: 'Windows' },
  ctrl: { simbolo: 'Ctrl', nome: 'Control' },
  alt: { simbolo: 'Alt', nome: 'Alt' },
  shift: { simbolo: '⇧', nome: 'Shift' },
}

const SIMBOLOS_TECLAS: Record<string, TeclaAtalho> = {
  enter: { simbolo: '↵', nome: 'Enter' },
  esc: { simbolo: 'Esc', nome: 'Esc' },
  tab: { simbolo: '⇥', nome: 'Tab' },
  espaco: { simbolo: 'Espaço', nome: 'Espaço' },
  backspace: { simbolo: '⌫', nome: 'Apagar' },
  delete: { simbolo: '⌦', nome: 'Delete' },
  cima: { simbolo: '↑', nome: 'Seta para cima' },
  baixo: { simbolo: '↓', nome: 'Seta para baixo' },
  esquerda: { simbolo: '←', nome: 'Seta para a esquerda' },
  direita: { simbolo: '→', nome: 'Seta para a direita' },
  pageup: { simbolo: 'PgUp', nome: 'Page Up' },
  pagedown: { simbolo: 'PgDn', nome: 'Page Down' },
  home: { simbolo: 'Home', nome: 'Home' },
  end: { simbolo: 'End', nome: 'End' },
  mais: { simbolo: '+', nome: 'Mais' },
}

export function ehMac() {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
}

const normalizar = (token: string) => {
  const minusculo = token.trim().toLowerCase()
  if (minusculo === 'cmd' || minusculo === 'command') return 'meta'
  if (minusculo === 'control') return 'ctrl'
  if (minusculo === 'option' || minusculo === 'opt') return 'alt'
  return APELIDOS[minusculo] ?? minusculo
}

/** "mod+shift+s" vira um passo; "g d" vira dois passos (aperte g, depois d) */
export function analisarAtalho(combinacao: string): PassoAtalho[] {
  return combinacao
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((passo) => {
      const tokens = passo.split('+').map(normalizar).filter(Boolean)
      const tecla = tokens.find((token) => !MODIFICADORES.has(token)) ?? ''
      return {
        mod: tokens.includes('mod'),
        ctrl: tokens.includes('ctrl'),
        alt: tokens.includes('alt'),
        shift: tokens.includes('shift'),
        meta: tokens.includes('meta'),
        tecla,
      }
    })
}

/** teclas de cada passo, já com o símbolo da plataforma e a ordem escrita no atalho */
export function teclasDoAtalho(combinacao: string, mac = ehMac()): TeclaAtalho[][] {
  const simbolos = mac ? SIMBOLOS_MAC : SIMBOLOS_PC
  return combinacao
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((passo) =>
      passo
        .split('+')
        .map(normalizar)
        .filter(Boolean)
        .map((token) => simbolos[token] ?? SIMBOLOS_TECLAS[token] ?? { simbolo: token.length === 1 ? token.toUpperCase() : token, nome: token.toUpperCase() }),
    )
}

/** texto pronto para title e aria: "⌘⇧S" no Mac, "Ctrl+⇧+S" no Windows */
export function textoDoAtalho(combinacao: string, mac = ehMac()) {
  return teclasDoAtalho(combinacao, mac)
    .map((passo) => passo.map((tecla) => tecla.simbolo).join(mac ? '' : '+'))
    .join(' depois ')
}

export function nomeFaladoDoAtalho(combinacao: string, mac = ehMac()) {
  return teclasDoAtalho(combinacao, mac)
    .map((passo) => passo.map((tecla) => tecla.nome).join(' '))
    .join(', depois ')
}

function teclaConfere(evento: KeyboardEvent, tecla: string) {
  if (/^[a-z]$/.test(tecla)) return evento.code === `Key${tecla.toUpperCase()}` || evento.key.toLowerCase() === tecla
  if (/^[0-9]$/.test(tecla)) return evento.code === `Digit${tecla}` || evento.code === `Numpad${tecla}` || evento.key === tecla
  if (/^f([1-9]|1[0-2])$/.test(tecla)) return evento.key.toLowerCase() === tecla
  return evento.key === (TECLAS_DO_EVENTO[tecla] ?? tecla)
}

export function eventoConfereComPasso(evento: KeyboardEvent, passo: PassoAtalho, mac = ehMac()) {
  const querMeta = passo.meta || (passo.mod && mac)
  const querCtrl = passo.ctrl || (passo.mod && !mac)
  // símbolos como ? e ! dependem de Shift no teclado; não exigimos Shift nesses casos
  const shiftLivre = passo.tecla.length === 1 && !/[a-z0-9]/.test(passo.tecla)
  if (evento.metaKey !== querMeta || evento.ctrlKey !== querCtrl || evento.altKey !== passo.alt) return false
  if (!shiftLivre && evento.shiftKey !== passo.shift) return false
  return teclaConfere(evento, passo.tecla)
}
