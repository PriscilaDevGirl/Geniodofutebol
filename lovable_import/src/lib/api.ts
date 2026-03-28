function trimTrailingSlash(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function normalizePath(path: string) {
  const trimmed = path.trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function getApiBaseCandidates() {
  const envBase = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");

  if (envBase) {
    return [envBase];
  }

  if (typeof window === "undefined") {
    return [""];
  }

  const { protocol, hostname, port } = window.location;
  const originBase = trimTrailingSlash(window.location.origin);
  const localApiBases = [`${protocol}//${hostname}:8011`, `${protocol}//${hostname}:8000`, `${protocol}//${hostname}:8001`];

  if (port === "8000" || port === "8001" || port === "8011") {
    return [originBase];
  }

  return [...localApiBases, originBase];
}

export async function requestJsonWithFallback<T>(path: string, init?: RequestInit) {
  const candidates = getApiBaseCandidates();
  const normalizedPath = normalizePath(path);
  let lastError: Error | null = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${trimTrailingSlash(baseUrl)}${normalizedPath}`, init);
      if (!response.ok) {
        throw new Error(`Falha ${response.status}`);
      }
      return {
        data: (await response.json()) as T,
        baseUrl,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Falha ao consultar a API");
    }
  }

  throw lastError ?? new Error("Falha ao consultar a API");
}

export async function fetchJsonWithFallback<T>(path: string) {
  return requestJsonWithFallback<T>(path);
}

export async function postJsonWithFallback<T>(path: string, body: unknown) {
  return requestJsonWithFallback<T>(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
