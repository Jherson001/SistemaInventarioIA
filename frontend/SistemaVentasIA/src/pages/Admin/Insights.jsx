import { useEffect, useState } from "react";
import useApi from "../../hooks/useApi";
import DashboardLayout from "../../components/layouts/DashboardLayout"; 

function StatusBadge({ status }) {
  const color = {
    'Agotado': 'bg-red-100 text-red-700',
    'Bajo Stock': 'bg-yellow-100 text-yellow-700',
    'Normal': 'bg-green-100 text-green-700',
    'SIN_STOCK': 'bg-red-100 text-red-700',
    'CRITICO': 'bg-orange-100 text-orange-700',
    'BAJO': 'bg-yellow-100 text-yellow-700',
    'OK': 'bg-green-100 text-green-700'
  }[status] || 'bg-gray-100 text-gray-700';
  
  return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${color}`}>{status || 'N/A'}</span>;
}

/* ⭐ SE AGREGA ESTE SPINNER EXACTAMENTE COMO LO ENVIASTE */
const Spinner = () => (
  <div className="flex flex-col justify-center items-center h-64 space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="text-gray-500 font-medium animate-pulse">Analizando datos con IA...</p>
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
    if (data && typeof data === 'object') return [data];
    return [];
  };

  useEffect(() => {
    (async () => {
      try {
        const [h, r] = await Promise.all([
          api.get('/insights/stock-health'),
          api.get('/insights/reorder-list')
        ]);
        setHealth(fixFormat(h));
        setReorder(fixFormat(r));
      } catch (e) { 
        console.error("Error cargando insights:", e);
        setErr(e.message || "Error de conexión"); 
      }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <DashboardLayout activeMenu="/admin/insights">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <h1 className="text-xl font-semibold">Predicciones de Inventario</h1>
        
        {err && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
            ❌ {err}
          </div>
        )}

        {/* ⭐ AQUI USO EL SPINNER NUEVO */}
        {loading ? (
          <Spinner />
        ) : (
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
                    {health.length > 0 ? health.map((x, i) => (
                      <tr key={x.product_id || i} className="border-t">
                        <td className="px-3 py-2">{x.sku}</td>
                        <td className="px-3 py-2">{x.name}</td>
                        <td className="px-3 py-2 text-right">{x.stock}</td>
                        <td className="px-3 py-2 text-right">{x.days_of_cover ?? '-'}</td>
                        <td className="px-3 py-2"><StatusBadge status={x.stock_status} /></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="px-3 py-4 text-center text-gray-500">No hay datos de stock</td></tr>
                    )}
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
                    {reorder.length > 0 ? reorder.map((x, i) => (
                      <tr key={x.product_id || i} className="border-t">
                        <td className="px-3 py-2">{x.sku}</td>
                        <td className="px-3 py-2">{x.name}</td>
                        <td className="px-3 py-2 text-right">{x.stock}</td>
                        <td className="px-3 py-2 text-right">{Number(x.avg_daily_sales || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{x.lead_time_days} d</td>
                        <td className="px-3 py-2 text-right font-semibold">{x.suggested_qty}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="px-3 py-4 text-center text-gray-500">No hay sugerencias por ahora</td></tr>
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
