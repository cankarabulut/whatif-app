// src/api/client.js

const DEFAULT_API_BASE_URL = 'https://web-production-4f50f.up.railway.app';

// Expo'da .env için:
// EXPO_PUBLIC_API_BASE_URL=https://senin-backend.com
const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(
    /\/+$/,
    ''
  );

function buildUrl(path, params) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(API_BASE_URL + cleanPath);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    // JSON olmayan response durumunda null döneriz
    return null;
  }
}

async function handleResponse(res) {
  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const error = new Error(
      `API error ${res.status} ${res.statusText || ''}`.trim()
    );
    error.status = res.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function apiGet(path, params) {
  const url = buildUrl(path, params);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    return await handleResponse(res);
  } catch (err) {
    console.log('[apiGet] Request failed', { path, params, message: err.message });
    throw err;
  }
}
