const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error(`Could not reach FinGuard API at ${API_BASE}. Check that the backend is running.`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.message || `Request failed (${response.status}).`);
  return data;
}

export function uploadDocument(file) {
  const body = new FormData();
  body.append('file', file);
  return request('/documents/upload', { method: 'POST', body });
}

export function askQuestion(query) {
  return request('/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
}

export function searchDocuments(query, top_k, min_similarity) {
  return request('/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, top_k, min_similarity }) });
}
