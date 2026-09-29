const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type ApiError = { detail?: string };

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = (await response.json().catch(() => null)) as
    | (T & ApiError)
    | null;
  if (!response.ok)
    throw new Error(
      body && "detail" in body ? body.detail : "Something went wrong",
    );
  return body as T;
}
