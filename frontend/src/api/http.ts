export class HttpError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string[]> = {}) { super(message); }
}
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(path, options); }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('Não foi possível acessar o sistema. Verifique a conexão e tente novamente.');
  }
  if (!response.ok) {
    let fields: Record<string, string[]> = {};
    if (response.status === 400) {
      try {
        const body: unknown = await response.json();
        if (body && typeof body === 'object' && 'errors' in body && body.errors && typeof body.errors === 'object') {
          fields = Object.fromEntries(Object.entries(body.errors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].every(value => typeof value === 'string')));
        }
      } catch { /* Respostas sem JSON recebem a mensagem contextual. */ }
    }
    throw new HttpError(response.status, response.status === 400 ? 'Revise os campos informados.' : response.status === 404 ? 'Cadastro não encontrado. Atualize a lista.' : 'Não foi possível concluir a operação. Tente novamente.', fields);
  }
  if (response.status === 204) return undefined as T;
  try { return await response.json() as T; }
  catch { throw new Error('O sistema retornou uma resposta inválida. Tente novamente.'); }
}
