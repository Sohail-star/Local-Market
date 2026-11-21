import type { UserAccount, UserCapabilities } from '../types/marketplace';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: { field?: string; message: string }[];
}

async function parseJsonSafe<T>(res: Response): Promise<ApiEnvelope<T>> {
  try {
    return (await res.json()) as ApiEnvelope<T>;
  } catch {
    return {
      success: false,
      message: `Unexpected server response (${res.status}).`,
    };
  }
}

export async function apiRegisterUser(payload: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  province?: string;
  city?: string;
  area?: string;
  avatarUrl?: string;
  capabilities?: UserCapabilities;
}): Promise<UserAccount> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe<{ user: UserAccount }>(res);
  if (!res.ok || !body.success || !body.data?.user) {
    throw new Error(body.message || 'Registration failed.');
  }
  return body.data.user;
}

export async function apiLoginUser(identifier: string, password: string): Promise<UserAccount> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const body = await parseJsonSafe<{ user: UserAccount }>(res);
  if (!res.ok || !body.success || !body.data?.user) {
    throw new Error(body.message || 'Login failed.');
  }
  return body.data.user;
}

export async function apiLoginDemoUser(): Promise<UserAccount> {
  const res = await fetch('/api/auth/demo', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const body = await parseJsonSafe<{ user: UserAccount }>(res);
  if (!res.ok || !body.success || !body.data?.user) {
    throw new Error(body.message || 'Demo sign-in failed.');
  }
  return body.data.user;
}

export async function apiFetchCurrentUser(): Promise<UserAccount | null> {
  const res = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  if (res.status === 401) {
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });
    if (!refreshRes.ok) {
      return null;
    }
    const refreshBody = await parseJsonSafe<{ user: UserAccount }>(refreshRes);
    return refreshBody.data?.user ?? null;
  }
  const body = await parseJsonSafe<{ user: UserAccount }>(res);
  if (!res.ok || !body.success || !body.data?.user) {
    return null;
  }
  return body.data.user;
}

export async function apiLogoutUser(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  }).catch(() => undefined);
}
