export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8180').replace(/\/$/, '');

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | Record<string, unknown>;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const body = options.body instanceof FormData ? options.body : serializeJsonBody(options.body, headers);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body,
    headers,
    credentials: 'include',
  });

  const payload = await parsePayload(response);
  if (!response.ok) {
    throw new ApiError(resolveErrorMessage(payload, response.statusText), response.status, payload);
  }

  return payload as T;
}

function serializeJsonBody(body: ApiOptions['body'], headers: Headers): BodyInit | undefined {
  if (!body) return undefined;
  if (typeof body === 'string' || body instanceof Blob || body instanceof ArrayBuffer || body instanceof URLSearchParams) {
    return body;
  }

  headers.set('Content-Type', 'application/json');
  return JSON.stringify(body);
}

async function parsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function resolveErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return fallback || 'Falha ao comunicar com a API';
}
