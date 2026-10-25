import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MotoristaForm } from './MotoristaForm';
import type { Motorista } from './types';

describe.each(['cadastro', 'edicao'] as const)('CPF no %s', modo => {
  it.each([
    ['123.456.789-01', '12345678901'],
    [' 123.456.789-01 ', '12345678901'],
    ['12345678901', '12345678901'],
    ['', null],
    ['   ', null],
  ])('envia %j como %j', async (entrada, esperado) => {
    const motorista: Motorista = {
      id: 'teste', nome: 'Motorista de teste', ativo: true,
      cpf: null, numeroCnh: null, categoriaCnh: null,
      dataValidadeCnh: null, telefone: null, dataCadastro: '2026-01-01T00:00:00Z',
    };
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<MotoristaForm motorista={modo === 'edicao' ? motorista : undefined} busy={false} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: 'Motorista de teste' } });
    fireEvent.change(screen.getByLabelText('CPF'), { target: { value: entrada } });
    fireEvent.click(screen.getByRole('button', { name: modo === 'edicao' ? 'Salvar alterações' : 'Cadastrar motorista' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ cpf: esperado })));
  });
});
