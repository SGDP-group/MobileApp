const BASE_URL = process.env.EXPO_PUBLIC_FOCUS_TRACKING_BASE_URL;
const IS_DEV = process.env.EXPO_PUBLIC_API_LOG_LEVEL === 'development' ||
               process.env.EXPO_PUBLIC_API_LOG_LEVEL === 'debug';

if (!BASE_URL) {
  console.warn(
    '[apiClient] EXPO_PUBLIC_FOCUS_TRACKING_BASE_URL is not set. ' +
    'API calls will fail. Check your .env file.',
  );
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const method = options.method ?? 'GET';

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (IS_DEV) {
    console.log(`[API] ${method} ${url}`, options.body ? JSON.parse(options.body as string) : '');
  }

  const response = await fetch(url, config);

  if (IS_DEV) {
    console.log(`[API] ${response.status} ${method} ${url}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, `${method} ${path} → ${response.status}: ${errorText}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClientAnalytics = {
  get: <T>(path: string) =>
    request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T = void>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
