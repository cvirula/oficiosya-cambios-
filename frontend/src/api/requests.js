import { api } from './client';

export function createRequest(payload, token) {
  return api('/requests/create', { method: 'POST', body: payload, token });
}
