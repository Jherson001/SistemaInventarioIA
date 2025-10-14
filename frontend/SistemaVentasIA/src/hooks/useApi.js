// src/hooks/useApi.js
import useAuth from "./useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function useApi() {
  const { token } = useAuth();

  const baseHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const handle = async (res) => {
    // Siempre intenta parsear JSON, pero sin desestructurar
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        data?.error || data?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data; // <- devuelve el objeto tal cual (p.ej. {rows,total})
  };

  const get = async (url) =>
    handle(await fetch(`${API_BASE_URL}${url}`, { headers: baseHeaders }));

  const post = async (url, body) =>
    handle(await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify(body),
    }));

  const put = async (url, body) =>
    handle(await fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: baseHeaders,
      body: JSON.stringify(body),
    }));

  const del = async (url) =>
    handle(await fetch(`${API_BASE_URL}${url}`, {
      method: "DELETE",
      headers: baseHeaders,
    }));

  return { get, post, put, del };
}
