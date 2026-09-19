import { api } from './client';

export function listWorkerServices(workerId, { signal } = {}) {
  const query = new URLSearchParams({ id_perfil: String(workerId), activo: 'true' });
  return api(`/servicios?${query}`, { signal });
}

export function createRequest(payload, token) {
  return api('/requests/create', { method: 'POST', body: payload, token });
}

export function listClientRequests(token, { signal } = {}) {
  return api('/requests/client', { token, signal });
}

export function listWorkerRequests(token, { signal } = {}) {
  return api('/requests/worker', { token, signal });
}

export function updateRequestStatus(requestId, estado, token) {
  return api(`/requests/${requestId}/status`, {
    method: 'PATCH', body: { estado }, token,
  });
}

export function createReview(requestId, payload, token) {
  return api(`/requests/${requestId}/review`, {
    method: 'POST', body: payload, token,
  });
}
