import { useEffect, useState } from "react";
import useApi from "../hooks/useApi";

function StatusBadge({ status }) {
  const color = {
    SIN_STOCK: 'bg-red-100 text-red-700',
    CRITICO: 'bg-orange-100 text-orange-700',
    BAJO: 'bg-yellow-100 text-yellow-700',
    OK: 'bg-green-100 text-green-700'
  }[status] || 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${color}`}>{status || 'N/A'}</span>;
}

export default function Insights() {
  const api = useApi();
  const [health, setHealth] = useState([]);
  const [reorder, setReorder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [h, r] = await Promise.all([
          api.get('/insights/stock-health'),
          api.get('/insights/reorder-list')
        ]);
        setHealth(h);
        setReorder(r);
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">Insights de Inventario</h1>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      {loading ? <p>Cargando...</p> : (
        <>
          <section className="card">
            <h2 className="font-semibold mb-3">Semáforo de stock</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2">SKU</th>
                    <th className="text-left px-3 py-2">Producto</th>
                    <th className="text-right px-3 py-2">Stock</th>
                    <th className="text-right px-3 py-2">Cobertura (días)</th>
                    <th className="text-left px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {health.map(x => (
                    <tr key={x.product_id} className="border-t">
                      <td className="px-3 py-2">{x.sku}</td>
                      <td className="px-3 py-2">{x.name}</td>
                      <td className="px-3 py-2 text-right">{x.stock}</td>
                      <td className="px-3 py-2 text-right">{x.days_of_cover ?? '-'}</td>
                      <td className="px-3 py-2"><StatusBadge status={x.stock_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2 className="font-semibold mb-3">Lista de reposición sugerida</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2">SKU</th>
                    <th className="text-left px-3 py-2">Producto</th>
                    <th className="text-right px-3 py-2">Stock</th>
                    <th className="text-right px-3 py-2">Ventas/día</th>
                    <th className="text-right px-3 py-2">Lead time</th>
                    <th className="text-right px-3 py-2">Sugerido</th>
                  </tr>
                </thead>
                <tbody>
                  {reorder.map(x => (
                    <tr key={x.product_id} className="border-t">
                      <td className="px-3 py-2">{x.sku}</td>
                      <td className="px-3 py-2">{x.name}</td>
                      <td className="px-3 py-2 text-right">{x.stock}</td>
                      <td className="px-3 py-2 text-right">{Number(x.avg_daily_sales || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">{x.lead_time_days} d</td>
                      <td className="px-3 py-2 text-right font-semibold">{x.suggested_qty}</td>
                    </tr>
                  ))}
                  {reorder.length === 0 && (
                    <tr><td colSpan="6" className="px-3 py-4 text-center text-gray-500">No hay sugerencias por ahora</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
