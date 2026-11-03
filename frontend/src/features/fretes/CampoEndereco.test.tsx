import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CampoEndereco } from './CampoEndereco';
import { fretesApi } from './fretesApi';
import type { Endereco } from './types';

afterEach(() => vi.restoreAllMocks());
function Formulario() {
  const [endereco, setEndereco] = useState<Endereco>({ texto: '' });
  return <><CampoEndereco label="Coleta" value={endereco} onChange={setEndereco} disabled={false} /><output>{endereco.ponto ? 'Ponto selecionado' : 'Sem ponto selecionado'}</output></>;
}
it('seleciona a última sugestão com seta para cima e invalida o ponto quando o texto muda', async () => {
  vi.spyOn(fretesApi, 'sugerir').mockResolvedValue([
    { texto: 'Primeiro endereço', ponto: { lat: -23.55, lon: -46.63 } },
    { texto: 'Segundo endereço', ponto: { lat: -23.56, lon: -46.64 } },
  ]);
  render(<Formulario />);
  const input = screen.getByRole('combobox', { name: 'Coleta' });
  fireEvent.focus(input); fireEvent.change(input, { target: { value: 'Rua de teste' } });
  await screen.findByRole('option', { name: 'Segundo endereço' });
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(screen.getByRole('option', { name: 'Segundo endereço' }).getAttribute('aria-selected')).toBe('true');
  fireEvent.keyDown(input, { key: 'Enter' });
  expect((input as HTMLInputElement).value).toBe('Segundo endereço');
  expect(screen.getByText('Ponto selecionado')).toBeTruthy();
  expect(screen.queryByRole('listbox')).toBeNull();
  fireEvent.change(input, { target: { value: 'Novo endereço' } });
  expect(screen.getByText('Sem ponto selecionado')).toBeTruthy();
});
