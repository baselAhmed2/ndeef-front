type QueryValue = string | number | boolean | null | undefined;

function appendQueryParams(url: URL, query?: Record<string, QueryValue>) {
  if (!query) return;

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }
}

export function getRoutePath(
  basePath: string,
  id?: string | number | null,
  _legacyParamKey?: string,
  query?: Record<string, QueryValue>,
) {
  const normalizedBase = basePath.startsWith("/") ? basePath : `/${basePath}`;
  const pathWithId =
    id !== null && id !== undefined && String(id).trim()
      ? `${normalizedBase}/${encodeURIComponent(String(id))}`
      : normalizedBase;

  const url = new URL(pathWithId, "http://nazeef.local");
  appendQueryParams(url, query);

  return `${url.pathname}${url.search}${url.hash}`;
}
