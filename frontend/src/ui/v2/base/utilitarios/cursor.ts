const PROPRIEDADES = [
  'box-sizing',
  'width',
  'height',
  'overflow-x',
  'overflow-y',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-style',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'font-style',
  'font-variant',
  'font-weight',
  'font-stretch',
  'font-size',
  'line-height',
  'font-family',
  'text-align',
  'text-transform',
  'text-indent',
  'letter-spacing',
  'word-spacing',
  'tab-size',
]

// copia o campo num div invisível para descobrir onde o cursor está na tela
export function coordenadasDoCursor(campo: HTMLTextAreaElement | HTMLInputElement, posicao: number) {
  const estilo = getComputedStyle(campo)
  const espelho = document.createElement('div')
  for (const propriedade of PROPRIEDADES) espelho.style.setProperty(propriedade, estilo.getPropertyValue(propriedade))
  espelho.style.position = 'absolute'
  espelho.style.visibility = 'hidden'
  espelho.style.top = '0'
  espelho.style.left = '-9999px'
  espelho.style.whiteSpace = campo instanceof HTMLTextAreaElement ? 'pre-wrap' : 'pre'
  espelho.style.overflowWrap = 'anywhere'
  espelho.textContent = campo.value.slice(0, posicao)
  const marcador = document.createElement('span')
  marcador.textContent = campo.value.slice(posicao) || '.'
  espelho.appendChild(marcador)
  document.body.appendChild(espelho)
  const caixa = campo.getBoundingClientRect()
  const topo = caixa.top + marcador.offsetTop + parseFloat(estilo.borderTopWidth) - campo.scrollTop
  const esquerda = caixa.left + marcador.offsetLeft + parseFloat(estilo.borderLeftWidth) - campo.scrollLeft
  const altura = parseFloat(estilo.lineHeight) || parseFloat(estilo.fontSize) * 1.4
  espelho.remove()
  return { topo, esquerda, altura }
}
