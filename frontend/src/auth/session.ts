// Tokens não são registrados. Trocar usuário/encerrar sessão invalida requisições em voo.
let token: string | null = null;
let userId: string | null = null;
let generation = 0;
const requests = new Set<AbortController>();
export const sessionEvents = new EventTarget();
export function setApiSession(next: { access_token: string; user: { id: string } } | null) {
  if (next?.user.id !== userId || !next) {
    generation++; requests.forEach(controller => controller.abort()); requests.clear();
    sessionEvents.dispatchEvent(new Event('change'));
  }
  token = next?.access_token ?? null; userId = next?.user.id ?? null;
}
export const apiSession = () => ({ token, generation });
export const trackRequest = (controller: AbortController) => { requests.add(controller); return () => requests.delete(controller); };
export function reportAccessFailure(status: number, usedToken: string | null) {
  if (usedToken && usedToken === token && (status === 401 || status === 403))
    sessionEvents.dispatchEvent(new CustomEvent('access-failure', { detail: status }));
}
