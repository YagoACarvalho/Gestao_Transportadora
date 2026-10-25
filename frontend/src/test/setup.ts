import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
// jsdom nao implementa dialog modal. Os testes de fluxo usam esta adaptacao;
// contencao/retorno de foco nativos precisam de verificacao em navegador real.
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
