import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
// JSDOM não mede layouts; a responsividade é verificada também no navegador.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
// jsdom nao implementa dialog modal. Os testes de fluxo usam esta adaptacao;
// contencao/retorno de foco nativos precisam de verificacao em navegador real.
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
