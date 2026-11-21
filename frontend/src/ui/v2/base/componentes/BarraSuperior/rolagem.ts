/** ancestral mais próximo que rola na vertical; null quando quem rola é a própria janela */
export function encontrarAreaRolagem(elemento: HTMLElement | null): HTMLElement | null {
  let atual = elemento
  while (atual && atual !== document.body && atual !== document.documentElement) {
    const { overflowY } = getComputedStyle(atual)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return atual
    atual = atual.parentElement
  }
  return null
}
