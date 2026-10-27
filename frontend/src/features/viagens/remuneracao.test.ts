import { expect, it } from 'vitest';
import { calcularRemuneracao } from './types';

it.each([[2000, 300], [1500.5, 225.08], [0.1, 0.02], [0.03, 0], [0, 0], [null, 0], [9999999999.99, 1500000000]])('calcula previa de %s em centavos sem diferenca no arredondamento', (frete, esperado) => {
  expect(calcularRemuneracao(frete)).toBe(esperado);
});
