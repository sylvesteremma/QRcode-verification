import { httpStatusMessage } from "@/lib/utils";

// const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function apiFetch<T>(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
  },
): Promise<T> {
  const method = options?.method || "GET";
  const headers: Record<string, string> = { ...options?.headers };
  const credentials = options?.credentials ?? "include";

  let body: BodyInit | undefined;
  if (options?.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers,
    credentials,
    body,
  });

  if (!response.ok) {
    let message = httpStatusMessage(response.status);
    try {
      const data = await response.json();
      if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
        message = data.message;
      } else if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
        message = data.error;
      }
    } catch {
    }
    const error = new Error(message);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
