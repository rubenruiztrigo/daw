import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// ─── PREFETCH: Start posts query before React mounts ─────────────────────────
// The Supabase query runs in parallel with React initialization.
// By the time App.tsx mounts and useEffects fire, the data is already arriving.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const PROJECT_ID = SUPABASE_URL.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || 'default';
const AUTH_STORAGE_KEY = `sb-${PROJECT_ID}-auth-token`;

function getPrefetchHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.access_token;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return headers;
}

// Fire-and-forget: start the posts fetch immediately (only when authenticated)
const authorCols = 'id,name,last_name,avatar,username,position,is_organization';
const postCols = `id,created_at,content,author_id,event_id,linked_event_id,image_url,doc_url,doc_name,tags,is_pinned,pinned_at,show_link_preview,link_preview_url,likes_count,comments_count,reposts_count,author:profiles!author_id(${authorCols})`;
const prefetchUrl = `${SUPABASE_URL}/rest/v1/posts?select=${encodeURIComponent(postCols)}&order=created_at.desc&limit=10`;

const prefetchHeaders = getPrefetchHeaders();
const hasAuthToken = !!(prefetchHeaders as Record<string, string>)['Authorization'];

// Only prefetch posts when the user is authenticated — without a JWT, Supabase RLS returns
// an empty array that would be consumed by fetchFeed and show "No hay publicaciones".
if (hasAuthToken) {
  (window as any).__prefetchPostsPromise = fetch(prefetchUrl, { headers: prefetchHeaders })
    .then(r => r.ok ? r.json() : null)
    .catch(() => null);
}

// Prefetch news alongside posts (fire-and-forget, no auth required)
const newsCols = `id,created_at,content,author_id,image_url,tags,titulo,is_pinned,pinned_at,show_link_preview,link_preview_url,likes_count,comments_count,up_votes_count,down_votes_count,reposts_count,author:profiles!author_id(${authorCols})`;
const newsPrefetchUrl = `${SUPABASE_URL}/rest/v1/news?select=${encodeURIComponent(newsCols)}&order=created_at.desc&limit=10`;
(window as any).__prefetchNewsPromise = fetch(newsPrefetchUrl, { headers: prefetchHeaders })
  .then(r => r.ok ? r.json() : null)
  .catch(() => null);

// Prefetch del chat sidebar desactivado: la RPC get_chat_sidebar está
// rota en servidor (referencia a columna inexistente) y provoca un 400
// ruidoso en la pestaña Network. fetchChats en App.tsx usa un fallback
// directo a messages + profiles, así que el sidebar sigue cargando.
// ─────────────────────────────────────────────────────────────────────────────

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
