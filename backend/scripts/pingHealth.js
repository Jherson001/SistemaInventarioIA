# Script simple para despertar / vigilar el backend.
# Uso: node scripts/pingHealth.js
# Opcional: HEALTH_URL=https://tu-backend.onrender.com/health

const url = process.env.HEALTH_URL || 'https://sistema-inventario-backend-9im6.onrender.com/health';

(async () => {
  try {
    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();
    console.log(res.status, text);
    if (!res.ok) process.exit(1);
  } catch (e) {
    console.error('Ping falló:', e.message);
    process.exit(1);
  }
})();
