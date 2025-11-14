
const API_BASE_URL = 'https://web-production-4f50f.up.railway.app';

function buildUrl(path, params) {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : '/' + path;
  const url = new URL(base + p);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));
  }
  return url.toString();
}

export async function apiGet(path, params) {
  const url = buildUrl(path, params);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('API error: ' + res.status);
  }
  return res.json();
}
