/**
 * API client - uses token from localStorage for authenticated requests.
 */
const API_BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('nexus-token');
}

export function setToken(token: string): void {
  localStorage.setItem('nexus-token', token);
}

export function clearToken(): void {
  localStorage.removeItem('nexus-token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || String(err) || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface WorkspaceOut {
  id: number;
  name: string;
  workspace_type: string;
  organization_id: number;
}

export interface OrganizationOut {
  id: number;
  name: string;
}
