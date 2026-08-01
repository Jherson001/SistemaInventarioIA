// src/utils/config.js
function normalizeApiBase(raw) {
  let base = (raw || "https://sistema-inventario-backend-9im6.onrender.com/api").trim();
  // quita slash final
  base = base.replace(/\/+$/, "");
  // si alguien puso solo el host de Render, agrega /api
  if (!/\/api$/i.test(base)) {
    base = `${base}/api`;
  }
  return base;
}

export const API_BASE_URL = normalizeApiBase(import.meta.env.VITE_API_URL);
