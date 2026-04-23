// src/api/client.js

const DEFAULT_API_BASE_URL = 'https://web-production-4f50f.up.railway.app';

// Expo'da .env için:
// EXPO_PUBLIC_API_BASE_URL=https://senin-backend.com
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  ''
);

function buildUrl(path, params) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(API_BASE_URL + cleanPath);

  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  let body = null;

  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  if (!res.ok) {
    console.log('[api] error response', {
      status: res.status,
      statusText: res.statusText,
      body,
    });
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

export async function apiGet(path, params) {
  const url = buildUrl(path, params);

  console.log('[apiGet] GET', url);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    return await handleResponse(res);
  } catch (err) {
    console.log('[apiGet] Request failed', {
      path,
      params,
      message: err.message,
    });
    throw err;
  }
}