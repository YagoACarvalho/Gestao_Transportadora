import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Avatar, Button, Card, CollectionSummary, Input, Select, Tabs } from './index';

it('nao apresenta menu sem acao e botoes nao submetem formularios por padrao', () => {
  render(<Card title="Custos"><Button>Consultar</Button></Card>);
  expect(screen.queryByRole('button', { name: /Opções/ })).toBeNull();
  expect(screen.getByRole('button', { name: 'Consultar' }).getAttribute('type')).toBe('button');
});

it('apresenta filtros como grupo de botoes com selecao acessivel', () => {
  const alterar = vi.fn();
  render(<Tabs label="Período" value="mes" onChange={alterar} options={[{ label: 'Mês', value: 'mes' }, { label: 'Ano', value: 'ano' }]} />);
  expect(screen.getByRole('group', { name: 'Período' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Mês' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Ano' })); expect(alterar).toHaveBeenCalledWith('ano');
});

it('usa iniciais sem imagem inexistente', () => {
  render(<Avatar name="Nome Teste" />);
  expect(screen.getByRole('img', { name: 'Nome Teste' }).textContent).toBe('NT');
});

it('campos Leange preservam rotulos e alteracao nativa', () => {
  const change = vi.fn();
  render(<><label htmlFor="nome">Nome</label><Input id="nome" required aria-invalid="true" onChange={change} /><label htmlFor="opcao">Opção</label><Select id="opcao"><option value="a">A</option><option value="b">B</option></Select></>);
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Teste' } });
  expect(change).toHaveBeenCalled(); expect(screen.getByLabelText('Nome').getAttribute('aria-invalid')).toBe('true');
  fireEvent.change(screen.getByLabelText('Opção'), { target: { value: 'b' } });
  expect((screen.getByLabelText('Opção') as HTMLSelectElement).value).toBe('b');
});

it('nao apresenta contagens como zero enquanto a consulta carrega ou falha', () => {
  const items = [{ title: 'Registros', value: 0, description: 'Consulta atual' }];
  const { rerender } = render(<CollectionSummary loading error="" items={items} />);
  expect(screen.queryByText('0')).toBeNull();
  expect(screen.getByText('Carregando registros…')).toBeTruthy();
  rerender(<CollectionSummary loading={false} error="Sem conexão" items={items} />);
  expect(screen.queryByText('0')).toBeNull();
  expect(screen.getByText('Dados indisponíveis')).toBeTruthy();
  rerender(<CollectionSummary loading={false} error="" items={items} />);
  expect(screen.getByText('0')).toBeTruthy();
  expect(screen.getByText('Consulta atual')).toBeTruthy();
});
