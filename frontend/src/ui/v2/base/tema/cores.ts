export const CORES = ['azul', 'rosa', 'roxo', 'laranja', 'vermelho', 'verde', 'amarelo', 'cinza'] as const

export type Cor = (typeof CORES)[number]
