// src/hooks/useApi.js
import useAuth from "./useAuth";
import { API_BASE_URL } from "../utils/config";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function useApi() {
  const { token } = useAuth();

  const baseHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const handle = async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          data?.error || data?.message || "No se encontró el recurso (404). Revisa la conexión o vuelve a intentar."
        );
      }
      if (res.status === 401) {
        throw new Error(data?.error || "Sesión expirada. Vuelve a iniciar sesión.");
      }
      if (res.status >= 500) {
        throw new Error(
          data?.error || data?.message || "El servidor no responde. Espera unos segundos y reintenta."
        );
      }
      throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
    }
    return data;
  };

  const request = async (path, options = {}, attempt = 1) => {
    const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...baseHeaders,
          ...(options.headers || {}),
        },
      });
      return await handle(res);
    } catch (err) {
      // Reintento ante cortes de red / cold start de Render (no ante 4xx de negocio)
      const msg = String(err?.message || "");
      const isNetwork =
        err instanceof TypeError ||
        /failed to fetch|network|load failed|aborted/i.test(msg);
      const isServerWake =
        /servidor no responde|502|503|504/i.test(msg);

      if (attempt < 3 && (isNetwork || isServerWake)) {
        await sleep(800 * attempt);
        return request(path, options, attempt + 1);
      }
      if (isNetwork) {
        throw new Error(
          "Sin conexión con el servidor. Si usas Render gratis, puede estar despertando: espera 30–60 s y reintenta."
        );
      }
      throw err;
    }
  };

  const get = (url) => request(url, { method: "GET" });

  const post = (url, body) =>
    request(url, { method: "POST", body: JSON.stringify(body) });

  const put = (url, body) =>
    request(url, { method: "PUT", body: JSON.stringify(body) });

  const del = (url) => request(url, { method: "DELETE" });

  return { get, post, put, del };
}
