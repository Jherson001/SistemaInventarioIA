import { useEffect, useState } from "react";
import useApi from "../../hooks/useApi";
import DashboardLayout from "../../components/layouts/DashboardLayout";

function statusLabel(status) {
  const map = {
    Agotado: "Sin existencias",
    "Bajo Stock": "Existencias bajas",
    Normal: "Normal",
    SIN_STOCK: "Sin existencias",
    CRITICO: "Crítico",
    BAJO: "Existencias bajas",
    OK: "Normal",
  };
  return map[status] || status || "Sin dato";
}

function StatusBadge({ status }) {
  const label = statusLabel(status);
  const color =
    {
      "Sin existencias": "badge-out",
      Crítico: "badge-out",
      "Existencias bajas": "badge-low",
      Normal: "badge-ok",
    }[label] || "badge";

  return <span className={`badge ${color}`}>{label}</span>;
}

const Spinner = () => (
  <div className="flex flex-col justify-center items-center h-64 space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700" />
    <p className="text-slate-500 font-medium">Cargando análisis de inventario...</p>
  </div>
);

export default function Insights() {
  const api = useApi();
  const [health, setHealth] = useState([]);
  const [reorder, setReorder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fixFormat = (response) => {
    if (Array.isArray(response)) return response;
    const data = response?.data || response;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") return [data];
    return [];
  };

  useEffect(() => {
    (async () => {
      try {
        const [h, r] = await Promise.all([
          api.get("/insights/stock-health"),
          api.get("/insights/reorder-list"),
        ]);
        setHealth(fixFormat(h));
        setReorder(fixFormat(r));
      } catch (e) {
        setErr(e.message || "Error de conexión");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardLayout activeMenu="Análisis">
      <div className="space-y-5">
        <div>
          <h1 className="page-title">Análisis de inventario</h1>
          <p className="page-subtitle">
            Semáforo de existencias y sugerencias de reposición. Si no hay ventas
            registradas, la cobertura en días puede salir en 0.
          </p>
        </div>

        {err && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm">
            {err}
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : (
          <>
            <section className="card">
              <h2 className="font-bold text-slate-800 mb-1">Semáforo de existencias</h2>
              <p className="text-xs text-slate-500 mb-4">
                Estado según cantidad actual frente al mínimo y seguridad del producto.
              </p>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="!text-right">Hay</th>
                      <th className="!text-right">Cobertura (días)</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.length > 0 ? (
                      health.map((x, i) => (
                        <tr key={x.product_id || i}>
                          <td>
                            <div className="font-medium">{x.name}</div>
                            <div className="text-xs text-slate-400">{x.sku}</div>
                          </td>
                          <td className="!text-right font-semibold">{x.stock}</td>
                          <td className="!text-right">
                            {x.days_of_cover == null || Number(x.days_of_cover) === 0
                              ? "—"
                              : x.days_of_cover}
                          </td>
                          <td>
                            <StatusBadge status={x.stock_status} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="!text-center text-slate-500 py-8">
                          No hay datos de existencias
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h2 className="font-bold text-slate-800 mb-1">Lista de reposición sugerida</h2>
              <p className="text-xs text-slate-500 mb-4">
                Cantidad sugerida para pedir. “Días de llegada” es el tiempo estimado
                del proveedor (lead time). Si no está configurado, verás 0.
              </p>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="!text-right">Hay</th>
                      <th className="!text-right">Salidas/día</th>
                      <th className="!text-right">Días de llegada</th>
                      <th className="!text-right">Sugerido pedir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reorder.length > 0 ? (
                      reorder.map((x, i) => (
                        <tr key={x.product_id || i}>
                          <td>
                            <div className="font-medium">{x.name}</div>
                            <div className="text-xs text-slate-400">{x.sku}</div>
                          </td>
                          <td className="!text-right">{x.stock}</td>
                          <td className="!text-right">
                            {Number(x.avg_daily_sales || 0).toFixed(2)}
                          </td>
                          <td className="!text-right">{x.lead_time_days ?? 0}</td>
                          <td className="!text-right font-bold text-teal-800">
                            {x.suggested_qty}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="!text-center text-slate-500 py-8">
                          No hay sugerencias por ahora
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
