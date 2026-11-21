export type EspacoLayout = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
export type RaioLayout = 'nenhum' | 'pequeno' | 'medio' | 'grande' | 'extra' | 'total'

export function valorEspaco(espaco: EspacoLayout) {
  return espaco === 0 ? '0px' : espaco <= 6 ? `var(--aleph-espaco-${espaco})` : `calc(var(--aleph-espaco-1) * ${espaco})`
}

export const VALOR_RAIO: Record<RaioLayout, string> = {
  nenhum: '0px',
  pequeno: 'var(--aleph-raio-p)',
  medio: 'var(--aleph-raio-m)',
  grande: 'var(--aleph-raio-g)',
  extra: 'var(--aleph-raio-xg)',
  total: 'var(--aleph-raio-total)',
}
