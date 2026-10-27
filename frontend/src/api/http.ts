import { apiSession, reportAccessFailure, sessionEvents, trackRequest } from '../auth/session';

export class HttpError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string[]> = {}) { super(message); }
}
const versions = new Map<string, string>();
sessionEvents.addEventListener('change', () => versions.clear());
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/api/') || path.startsWith('//') || path.includes('\\')) throw new Error('Endereço de API inválido.');
  const session = apiSession();
  const method = options.method ?? 'GET';
  const versionPath = method === 'PATCH' && path.endsWith('/situacao-financeira') ? path.slice(0, -'/situacao-financeira'.length) : path;
  const version = versions.get(versionPath);
  const alteraCadastro = method === 'PUT' || method === 'DELETE' || method === 'PATCH';
  if (session.token || alteraCadastro && version) {
    const headers = new Headers(options.headers);
    if (session.token) headers.set('Authorization', `Bearer ${session.token}`);
    if (alteraCadastro && version) headers.set('If-Match', version);
    options = { ...options, headers };
  }
  const controller = session.token ? new AbortController() : null;
  const untrack = controller ? trackRequest(controller) : () => {};
  const abort = () => controller?.abort();
  const originalSignal = options.signal;
  if (controller) {
    if (originalSignal?.aborted) controller.abort();
    originalSignal?.addEventListener('abort', abort, { once: true });
    options = { ...options, signal: controller.signal };
  }
  try {
  let response: Response;
  try { response = await fetch(path, options); }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('Não foi possível acessar o sistema. Verifique a conexão e tente novamente.');
  }
  if (session.generation !== apiSession().generation) throw new DOMException('Sessão encerrada.', 'AbortError');
  if (!response.ok) {
    reportAccessFailure(response.status, session.token);
    let fields: Record<string, string[]> = {};
    if (response.status === 400) {
      try {
        const body: unknown = await response.json();
        if (body && typeof body === 'object' && 'errors' in body && body.errors && typeof body.errors === 'object') {
          fields = Object.fromEntries(Object.entries(body.errors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].every(value => typeof value === 'string')));
        }
      } catch { /* Respostas sem JSON recebem a mensagem contextual. */ }
    }
    throw new HttpError(response.status, response.status === 401 ? 'Sua sessão expirou. Entre novamente.' : response.status === 403 ? 'Seu usuário não está autorizado a acessar este sistema.' : response.status === 400 ? 'Revise os campos informados.' : response.status === 404 ? 'Cadastro não encontrado. Atualize a lista.' : response.status === 409 ? 'Os dados mudaram durante a operação. Feche o painel, atualize a lista e revise o cadastro antes de tentar novamente.' : 'Não foi possível concluir a operação. Tente novamente.', fields);
  }
  if (method === 'GET') {
    const tag = response.headers?.get('ETag');
    if (tag) versions.set(path, tag); else versions.delete(path);
  } else if (alteraCadastro) versions.delete(versionPath);
  if (response.status === 204) return undefined as T;
  try {
    const data = await response.json() as T;
    if (session.generation !== apiSession().generation) throw new DOMException('Sessão encerrada.', 'AbortError');
    return data;
  }
  catch (failure) { if (failure instanceof DOMException && failure.name === 'AbortError') throw failure; throw new Error('O sistema retornou uma resposta inválida. Tente novamente.'); }
  } finally { untrack(); originalSignal?.removeEventListener('abort', abort); }
}
