import { describe, expect, it, vi } from 'vitest';
import { HttpError, request } from '../../api/http';
import { motoristasApi } from './motoristasApi';
import { filtrarMotoristas, formatarDataCivil } from './types';
import type { Motorista } from './types';
const motorista: Motorista = { id: 'teste', nome: 'Motorista de teste', ativo: false, cpf: 'cpf-teste', numeroCnh: 'cnh-teste', categoriaCnh: null, dataValidadeCnh: '2030-01-02', telefone: null, dataCadastro: '2026-01-01T00:00:00Z' };
describe('contratos de motoristas', () => {
  it('trata resposta de sucesso invalida sem exibir o corpo recebido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>indisponivel</html>')));
    await expect(request('/api/Motoristas')).rejects.toThrow('O sistema retornou uma resposta inválida.');
  });
  it('envia Ativo explicitamente e preserva data civil no PUT; aceita 204', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 })); vi.stubGlobal('fetch', fetchMock);
    await expect(motoristasApi.atualizar(motorista.id, motorista)).resolves.toBeUndefined();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/Motoristas/teste');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toMatchObject({ ativo: false, dataValidadeCnh: '2030-01-02' });
  });
  it('consulta inativos e usa DELETE sem corpo', async () => {
    const mock = vi.fn().mockResolvedValueOnce(new Response('[]')).mockResolvedValueOnce(new Response(null, { status: 204 })); vi.stubGlobal('fetch', mock);
    await motoristasApi.listar(true); await motoristasApi.desativar('teste');
    expect(mock.mock.calls[0][0]).toBe('/api/Motoristas?incluirInativos=true');
    expect(mock.mock.calls[1][1]).toEqual({ method: 'DELETE' });
  });
  it('expoe erros de validacao e trata respostas sem JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ errors: { Nome: ['Informe o nome.'] } }), { status: 400 })).mockResolvedValueOnce(new Response('erro interno', { status: 500 })));
    await expect(request('/api/Motoristas')).rejects.toMatchObject({ status: 400, fields: { Nome: ['Informe o nome.'] } });
    await expect(request('/api/Motoristas')).rejects.toBeInstanceOf(HttpError);
  });
  it('distingue 404, rede e cancelamento', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 })).mockRejectedValueOnce(new TypeError('offline')).mockRejectedValueOnce(new DOMException('cancelado', 'AbortError')));
    await expect(request('/api/Motoristas')).rejects.toMatchObject({ status: 404 });
    await expect(request('/api/Motoristas')).rejects.toThrow('Verifique a conexão');
    await expect(request('/api/Motoristas')).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('combina busca local com situacao e nao altera data por fuso', () => {
    const ativos = { ...motorista, id: 'ativo', ativo: true };
    expect(filtrarMotoristas([motorista, ativos], 'CNH-TESTE', 'inativos')).toEqual([motorista]);
    expect(filtrarMotoristas([motorista, ativos], 'cpf-teste', 'ativos')).toEqual([ativos]);
    expect(filtrarMotoristas([motorista], 'ausente', 'todos')).toEqual([]);
    expect(formatarDataCivil('2030-01-02')).toBe('02/01/2030');
    expect(formatarDataCivil(null)).toBe('Não informada');
  });
});
