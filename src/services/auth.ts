export interface SiraUser {
  id: string;
  email: string;
  displayName: string;
}

export interface SiraSession {
  accessToken: string;
  expiresAt: number;
  user: SiraUser;
}

export interface SiraProgressSnapshot {
  discoveredPlaceIds: string[];
  completedChallenges: string[];
  totalPoints: number;
  favoritePlaceIds: string[];
  journeys?: Record<string, { revealedStopNumbers: number[]; completedAt?: string }>;
  kidsMapGame?: { completedStageIds: string[]; stagePoints: number; entryFeePaid?: boolean };
}

type ApiError = Error & { code?: string; status?: number };

async function request<T>(path: string, body?: unknown, accessToken?: string): Promise<T> {
  const response = await fetch(`/api/auth${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null as T;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || 'تعذر الاتصال حاليًا. حاول مرة أخرى.') as ApiError;
    error.code = payload?.code;
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

let sessionRestore: Promise<SiraSession | null> | null = null;

export const restoreSiraSession = () => {
  if (!sessionRestore) {
    sessionRestore = request<SiraSession | null>('/session').finally(() => { sessionRestore = null; });
  }
  return sessionRestore;
};
export const signInToSira = (email: string, password: string) => request<SiraSession>('/login', { email, password });
export const createSiraAccount = (displayName: string, email: string, password: string) => request<SiraSession | { requiresVerification: true; email: string }>('/signup', { displayName, email, password });
export const verifySiraOtp = (email: string, token: string, type: 'signup' | 'recovery') => request<SiraSession>('/verify', { email, token, type });
export const resendSiraSignupOtp = (email: string) => request<{ message: string }>('/resend', { email });
export const requestSiraPasswordRecovery = (email: string) => request<{ message: string }>('/recovery', { email });
export const updateSiraPassword = (password: string, accessToken: string) => request<{ message: string }>('/password', { password }, accessToken);
export const signOutFromSira = (accessToken?: string) => request<null>('/logout', undefined, accessToken);
export const loadSiraProgress = async (accessToken: string) => {
  const response = await request<{ progress: SiraProgressSnapshot | null }>('/progress/load', undefined, accessToken);
  return response.progress;
};
export const syncSiraProgress = (progress: SiraProgressSnapshot, accessToken: string) => request<{ progress: SiraProgressSnapshot }>('/progress/sync', { progress }, accessToken).then((response) => response.progress);
export const saveSiraProgress = (progress: SiraProgressSnapshot, accessToken: string) => request<{ progress: SiraProgressSnapshot }>('/progress/save', { progress }, accessToken).then((response) => response.progress);
