import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CalcularFretePage } from '../../pages/CalcularFretePage';
import { fretesApi } from './fretesApi';
import type { ResultadoFrete } from './types';
import { decodificarSimulacao } from './simulacao';
vi.mock('./MapaRota', () => ({ MapaRota: () => <div>Mapa do trajeto</div> }));
const resultado: ResultadoFrete = {
  enderecos: [{ texto: 'Coleta confirmada' }, { texto: 'Entrega confirmada' }], distanciaKm: 200, distanciaRetornoKm: 230,
  trechosKm: [200], trajetoIda: [], trajetoRetorno: [], coeficientes: { tabela: 'B', eixosReferencia: 4, ccd: 5.3538, cc: 533.4 },
  pisoIda: 1604.16, retornoVazio: 1132.86, pisoTotal: 2737.02, pedagio: null, adicionais: 0, totalOperacao: 2737.02,
  norma: 'Portaria SUROC 22/2026', vigencia: '2026-09-30', fonte: 'https://anttlegis.datalegis.inf.br/', avisos: ['Pedágio pendente'],
};
beforeEach(() => {
  window.location.hash = '#/calcular-frete'; localStorage.clear();
  vi.spyOn(fretesApi, 'opcoes').mockResolvedValue({ tiposCarga: [{ id: 5, nome: 'Carga geral' }], hoje: '2026-11-03', primeiraVigencia: '2026-09-30', mapasConfigurados: true });
  vi.spyOn(fretesApi, 'sugerir').mockResolvedValue([]);
  vi.spyOn(fretesApi, 'calcular').mockResolvedValue(resultado);
});
afterEach(() => vi.restoreAllMocks());
async function preencher() {
  await screen.findByRole('option', { name: 'Carga geral' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Coleta' }), { target: { value: 'Coleta de teste' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Entrega' }), { target: { value: 'Entrega de teste' } });
}
it('informa configuração pendente e permite preparar os endereços', async () => {
  vi.mocked(fretesApi.opcoes).mockResolvedValue({ tiposCarga: [{ id: 5, nome: 'Carga geral' }], hoje: '2026-11-03', primeiraVigencia: '2026-09-30', mapasConfigurados: false });
  render(<CalcularFretePage />); await screen.findByText(/O serviço de rotas precisa ser configurado/);
  expect((screen.getByRole('button', { name: 'Calcular frete' }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole('combobox', { name: 'Coleta' }) as HTMLInputElement).disabled).toBe(false);
  expect(fretesApi.calcular).not.toHaveBeenCalled();
});
it('calcula sem km digitado, diferencia pedágio pendente e invalida resultado ao editar', async () => {
  render(<CalcularFretePage />); await preencher();
  fireEvent.click(screen.getByRole('button', { name: 'Calcular frete' }));
  await screen.findByRole('heading', { name: 'Piso mínimo ANTT' });
  expect(fretesApi.calcular).toHaveBeenCalledWith(expect.objectContaining({ origem: { texto: 'Coleta de teste' }, pedagio: null }), expect.any(AbortSignal));
  expect(screen.getAllByText('Pendente').length).toBeGreaterThan(0); expect(screen.getByText('Mapa do trajeto')).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox', { name: 'Entrega' }), { target: { value: 'Outro destino' } });
  expect(screen.queryByRole('heading', { name: 'Piso mínimo ANTT' })).toBeNull();
});
it('limita comparação a quatro e preserva os cenários ao mudar formulário', async () => {
  render(<CalcularFretePage />); await preencher(); fireEvent.click(screen.getByRole('button', { name: 'Calcular frete' }));
  await screen.findByRole('heading', { name: 'Piso mínimo ANTT' });
  for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: `Comparar cenário (${i}/4)` }));
  expect((screen.getByRole('button', { name: 'Comparar cenário (4/4)' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByRole('combobox', { name: 'Entrega' }), { target: { value: 'Outro destino' } });
  expect(screen.getByRole('heading', { name: 'Comparação de cenários' })).toBeTruthy();
});
it('cancela cálculo em voo e ignora resposta tardia', async () => {
  let resolver!: (r: ResultadoFrete) => void;
  vi.mocked(fretesApi.calcular).mockImplementation(() => new Promise(resolve => { resolver = resolve; }));
  render(<CalcularFretePage />); await preencher(); fireEvent.click(screen.getByRole('button', { name: 'Calcular frete' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar cálculo' })); resolver(resultado);
  await waitFor(() => expect((screen.getByRole('button', { name: 'Calcular frete' }) as HTMLButtonElement).disabled).toBe(false));
  expect(screen.queryByRole('heading', { name: 'Piso mínimo ANTT' })).toBeNull();
});
it('link adulterado informa erro sem executar cálculo automaticamente', async () => {
  window.location.hash = '#/calcular-frete?simulacao=invalido'; render(<CalcularFretePage />);
  expect(screen.getByText(/Link de simulação inválido/)).toBeTruthy(); await screen.findByRole('option', { name: 'Carga geral' });
  expect(fretesApi.calcular).not.toHaveBeenCalled();
});
it('imprime a folha com valores e fonte sem perder o formulário ou deixar o modo de impressão ativo', async () => {
  const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {
    expect(document.body.classList.contains('imprimindo-frete')).toBe(true);
    const folha = document.querySelector('article[aria-label="Folha de simulação de frete"]');
    expect(folha?.parentElement).toBe(document.body);
    expect(folha?.textContent).toContain('Coleta confirmada');
    expect(folha?.textContent).toContain('Portaria SUROC 22/2026');
    expect(folha?.textContent).toContain('https://anttlegis.datalegis.inf.br/');
    expect(folha?.textContent).toContain('Pendente');
  });
  render(<CalcularFretePage />); await preencher();
  fireEvent.click(screen.getByRole('button', { name: 'Calcular frete' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Imprimir / salvar PDF' }));
  expect(imprimir).toHaveBeenCalledOnce();
  expect(document.body.classList.contains('imprimindo-frete')).toBe(false);
  expect((screen.getByRole('combobox', { name: 'Coleta' }) as HTMLInputElement).value).toBe('Coleta de teste');
  expect(screen.getByRole('heading', { name: 'Piso mínimo ANTT' })).toBeTruthy();
});
it('copia um link recalculável com endereços e custos, sem incluir o resultado', async () => {
  const escrever = vi.fn().mockResolvedValue(undefined);
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: escrever } });
  try {
    render(<CalcularFretePage />); await preencher();
    fireEvent.change(screen.getByLabelText('Preço do diesel (R$/l)'), { target: { value: '6.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calcular frete' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Copiar link' }));
    await screen.findByText(/Link copiado/);
    const url = new URL(escrever.mock.calls[0][0]);
    const parametro = new URLSearchParams(url.hash.split('?')[1]).get('simulacao')!;
    const simulacao = decodificarSimulacao(parametro);
    expect(simulacao.entrada.origem.texto).toBe('Coleta de teste');
    expect(simulacao.custos.diesel).toBe(6.5);
    expect(JSON.stringify(simulacao)).not.toContain('pisoTotal');
    expect(fretesApi.calcular).toHaveBeenCalledOnce();
  } finally {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else Reflect.deleteProperty(navigator, 'clipboard');
  }
});
