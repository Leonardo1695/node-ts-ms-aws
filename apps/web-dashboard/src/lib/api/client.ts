import { getApiConfig } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  fetchImpl?: typeof fetch;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const config = getApiConfig();
  const fetchImpl = options.fetchImpl ?? fetch;
  const { body, headers, fetchImpl: _fetchImpl, ...rest } = options;

  const response = await fetchImpl(`${config.baseUrl}${path}`, {
    ...rest,
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.apiKey,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new ApiError(
      `API request failed (${response.status})`,
      response.status,
      text,
    );
  }

  return text ? (JSON.parse(text) as T) : (undefined as T);
}
