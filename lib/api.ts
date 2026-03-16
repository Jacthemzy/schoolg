const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
  });
  return handleResponse<T>(res);
}

export async function apiPost<TInput, TOutput>(path: string, body: TInput): Promise<TOutput> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    credentials: "include",
  });
  return handleResponse<TOutput>(res);
}

export async function apiDelete<TOutput>(path: string): Promise<TOutput> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse<TOutput>(res);
}

