export function formatarDuracao(segundos: number) {
  const total = Math.max(0, Math.floor(Number.isFinite(segundos) ? segundos : 0))
  const horas = Math.floor(total / 3600)
  const minutos = Math.floor((total % 3600) / 60)
  const resto = String(total % 60).padStart(2, '0')
  return horas ? `${horas}:${String(minutos).padStart(2, '0')}:${resto}` : `${minutos}:${resto}`
}

export function reduzirAmostras(valores: ArrayLike<number>, quantidade: number) {
  if (!valores.length || quantidade <= 0) return []
  const bloco = valores.length / quantidade
  const picos: number[] = []
  for (let i = 0; i < quantidade; i++) {
    const inicio = Math.floor(i * bloco)
    const fim = Math.min(valores.length, Math.max(inicio + 1, Math.floor((i + 1) * bloco)))
    let pico = 0
    for (let j = inicio; j < fim; j++) pico = Math.max(pico, Math.abs(valores[j]))
    picos.push(pico)
  }
  const maximo = Math.max(...picos, 0.0001)
  return picos.map((pico) => pico / maximo)
}
