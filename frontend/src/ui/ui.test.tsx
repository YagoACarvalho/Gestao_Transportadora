import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Avatar, BarChartCard, Button, Card, GaugeChart, ProgressCard, Tabs } from './index';

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

it('limita progresso e medidor e usa iniciais sem imagem inexistente', () => {
  render(<><ProgressCard title="Progresso" value="Completo" percent={150} /><GaugeChart value={-10} label="Volume" segments={0} /><Avatar name="Nome Teste" /></>);
  expect(screen.getByRole('progressbar', { name: 'Progresso' }).getAttribute('aria-valuenow')).toBe('100');
  expect(screen.getByRole('img', { name: 'Volume: 0%' })).toBeTruthy();
  expect(screen.getByRole('img', { name: 'Nome Teste' }).textContent).toBe('NT');
});

it('explica grafico vazio e fornece valores textuais para barras negativas', () => {
  render(<><BarChartCard title="Vazio" data={[]} /><BarChartCard title="Valores" data={[{ label: 'Janeiro', value: -25 }]} /></>);
  expect(screen.getByText('Nenhum valor disponível.')).toBeTruthy();
  fireEvent.click(screen.getByText('Ver valores do gráfico'));
  expect(screen.getByText('-25')).toBeTruthy();
});
