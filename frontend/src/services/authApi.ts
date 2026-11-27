const apiBase = ((import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE || '')
  .trim()
  .replace(/\/+$/, '');

export const AUTH_TOKEN_KEY = 'nexus_auth_token';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  organizationName: string;
  role: 'platform_admin' | 'workspace_admin' | 'analyst' | 'viewer';
  roles: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

export interface RoleDefinition {
  code: string;
  label: string;
  tier: string;
  locked: boolean;
  description: string;
}

export interface AuditLogEntry {
  id: number;
  actorUserId: string;
  actorEmail: string;
  action: string;
  targetUserId?: string | null;
  detail: Record<string, unknown>;
  createdAt?: string | null;
}

export function getAuthToken(): string {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail) && data.detail[0]?.msg
          ? data.detail[0].msg
          : `Request failed (HTTP ${res.status})`;
    throw new Error(detail);
  }
  return data as T;
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const authApi = {
  async status(): Promise<{ hasUsers: boolean; userCount: number }> {
    const res = await fetch(`${apiBase}/api/v1/auth/status`);
    return parseJsonOrThrow(res);
  },

  async register(payload: {
    email: string;
    password: string;
    fullName: string;
    organizationName?: string;
  }): Promise<{ accessToken: string; user: UserProfile }> {
    const res = await fetch(`${apiBase}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonOrThrow<{ accessToken: string; user: UserProfile }>(res);
    setAuthToken(data.accessToken);
    return data;
  },

  async login(email: string, password: string): Promise<{ accessToken: string; user: UserProfile }> {
    const res = await fetch(`${apiBase}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonOrThrow<{ accessToken: string; user: UserProfile }>(res);
    setAuthToken(data.accessToken);
    return data;
  },

  logout(): void {
    setAuthToken(null);
  },

  async me(): Promise<UserProfile> {
    const res = await fetch(`${apiBase}/api/v1/auth/me`, { headers: authHeaders() });
    const data = await parseJsonOrThrow<{ user: UserProfile }>(res);
    return data.user;
  },

  async updateMe(payload: { fullName?: string; organizationName?: string }): Promise<UserProfile> {
    const res = await fetch(`${apiBase}/api/v1/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonOrThrow<{ user: UserProfile }>(res);
    return data.user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${apiBase}/api/users/me/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return parseJsonOrThrow(res);
  },

  async listAdminUsers(search = ''): Promise<{
    users: UserProfile[];
    total: number;
    filtered: number;
    roleCatalog: RoleDefinition[];
  }> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${apiBase}/api/admin/users${qs}`, { headers: authHeaders() });
    return parseJsonOrThrow(res);
  },

  async createAdminUser(payload: {
    email: string;
    fullName: string;
    organizationName?: string;
    role: string;
    temporaryPassword: string;
  }): Promise<UserProfile> {
    const res = await fetch(`${apiBase}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonOrThrow<{ user: UserProfile }>(res);
    return data.user;
  },

  async updateAdminUser(
    userId: string,
    payload: { fullName?: string; organizationName?: string; role?: string; isActive?: boolean }
  ): Promise<UserProfile> {
    const res = await fetch(`${apiBase}/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonOrThrow<{ user: UserProfile }>(res);
    return data.user;
  },

  async resetAdminUserPassword(userId: string, temporaryPassword: string): Promise<{ message: string }> {
    const res = await fetch(
      `${apiBase}/api/admin/users/${encodeURIComponent(userId)}/reset-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ temporaryPassword }),
      }
    );
    return parseJsonOrThrow(res);
  },

  async listAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await fetch(`${apiBase}/api/admin/audit-logs`, { headers: authHeaders() });
    const data = await parseJsonOrThrow<{ logs: AuditLogEntry[] }>(res);
    return data.logs || [];
  },
};
