import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Ajusta los puntos "../" según donde tengas este archivo guardado
import DashboardLayout from "../components/layouts/DashboardLayout"; 

export default function LowRotationPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0.6);
  const [limit, setLimit] = useState(100);
  
  // Usamos VITE_API_URL que es la que tienes configurada en Render
  const apiBase = import.meta.env.VITE_API_URL; 
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [minScore, limit]);

  async function fetchData() {
    setLoading(true);
    try {
      // CAMBIO: Se agregó /dashboard/ a la ruta para corregir el error 404
      const res = await fetch(`${apiBase}/dashboard/low-rotation?min_score=${minScore}&limit=${limit}`);
      const data = await res.json();
      setRows(data.rows || []);
    } catch (e) {
      console.error("fetch low rotation:", e);
      alert("Error al cargar datos. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!rows.length) return;
    const headers = ["product_id","sku","name","score","label","reason","days_since_last_sale","days_of_inventory","weekly_90","flagged_at"];
    const csvRows = [
      headers.join(","),
      ...rows.map(r => [
        r.product_id,
        JSON.stringify(r.product_sku || ""),
        JSON.stringify(r.product_name || ""),
        r.score,
        r.label,
        JSON.stringify(r.reason || ""),
        r.days_since_last_sale ?? "",
        r.days_of_inventory ?? "",
        r.weekly_90 ?? "",
        r.flagged_at ?? ""
      ].join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `low_rotation_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function markFeedback(productId, isCorrect, note = "") {
    try {
      // CAMBIO: Se agregó /dashboard/ aquí también para mantener la consistencia
      const res = await fetch(`${apiBase}/dashboard/low-rotation/${productId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_correct: isCorrect, note })
      });
      const data = await res.json();
      if (data.ok) {
        fetchData(); // refresca lista
      } else {
        alert("Error al guardar feedback");
      }
    } catch (e) {
      console.error(e);
      alert("Error al enviar feedback");
    }
  }

  return (
    <DashboardLayout activeMenu="/admin/low-rotation">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Productos de baja rotación</h1>
          <div className="flex gap-2 items-center">
            <label className="text-sm">Score mínimo</label>
            <input
              type="number" step="0.05" min={0} max={1}
              value={minScore}
              onChange={(e)=>setMinScore(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24"
            />
            <button onClick={fetchData} className="px-3 py-1 bg-blue-600 text-white rounded">Refrescar</button>
            <button onClick={exportCSV} className="px-3 py-1 bg-green-600 text-white rounded">Exportar CSV</button>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500">Cargando…</div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-left">Score</th>
                  <th className="px-3 py-2 text-left">Etiqueta</th>
                  <th className="px-3 py-2 text-left">Motivo</th>
                  <th className="px-3 py-2 text-left">Días sin venta</th>
                  <th className="px-3 py-2 text-left">Días inventario</th>
                  <th className="px-3 py-2 text-left">u/sem (90d)</th>
                  <th className="px-3 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.product_id} className="border-t">
                    <td className="px-3 py-2">{idx+1}</td>
                    <td className="px-3 py-2">{r.product_sku ?? "-"}</td>
                    <td className="px-3 py-2">{r.product_name ?? r.product_id}</td>
                    <td className="px-3 py-2 font-medium">{Number(r.score).toFixed(3)}</td>
                    <td className={r.label === "low_rotation" ? "px-3 py-2 text-red-600" : "px-3 py-2 text-green-600"}>
                      {r.label}
                    </td>
                    <td className="px-3 py-2">{r.reason}</td>
                    <td className="px-3 py-2">{r.days_since_last_sale}</td>
                    <td className="px-3 py-2">{r.days_of_inventory ?? "-"}</td>
                    <td className="px-3 py-2">{r.weekly_90 ?? "-"}</td>
                    <td className="px-3 py-2 flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/products`)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => {
                          const promo = prompt("Describe la promo/recomendación corta:");
                          if (promo) {
                            markFeedback(r.product_id, false, "Sugerencia promo: " + promo);
                          }
                        }}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        Promo
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Marcar predicción como CORRECTA?")) markFeedback(r.product_id, true, "Admin confirmó");
                        }}
                        className="px-2 py-1 bg-green-100 rounded text-sm"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => {
                          const note = prompt("¿Por qué es incorrecto?");
                          if (note) markFeedback(r.product_id, false, note);
                        }}
                        className="px-2 py-1 bg-red-100 rounded text-sm"
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-500">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}