import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layouts/DashboardLayout";
import { API_BASE_URL } from "../utils/config";
import { downloadCsv } from "../utils/csv";

export default function LowRotationPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [minScore, setMinScore] = useState(0.6);
  const [limit, setLimit] = useState(100);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [minScore, limit]);

  async function fetchData() {
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/dashboard/low-rotation?min_score=${minScore}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 401) {
        navigate("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Error al cargar");
      setRows(data.rows || []);
    } catch (e) {
      setErr(e.message || "Error de conexión");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function markFeedback(productId, isCorrect, note = "") {
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/dashboard/low-rotation/${productId}/feedback`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_correct: isCorrect, note }),
        }
      );

      if (res.ok) fetchData();
      else alert("Error al guardar feedback");
    } catch (e) {
      console.error(e);
    }
  }

  function exportCSV() {
    if (!rows.length) return;

    downloadCsv(
      `baja_rotacion_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { key: "product_id", label: "ID Producto" },
        { key: "product_sku", label: "SKU" },
        { key: "product_name", label: "Producto" },
        { key: "score", label: "Score" },
        { key: "label", label: "Etiqueta" },
        { key: "reason", label: "Motivo" },
        { key: "days_since_last_sale", label: "Dias sin venta" },
        { key: "days_of_inventory", label: "Dias inventario" },
        { key: "weekly_90", label: "Unidades semanales (90d)" },
      ],
      rows.map((r) => ({
        ...r,
        score: r.score != null ? Number(r.score).toFixed(3) : "",
        product_sku: r.product_sku ?? "",
        product_name: r.product_name ?? "",
        label: r.label ?? "",
        reason: r.reason ?? "",
        days_since_last_sale: r.days_since_last_sale ?? "",
        days_of_inventory: r.days_of_inventory ?? "",
        weekly_90: r.weekly_90 ?? "",
      }))
    );
  }

  return (
    <DashboardLayout activeMenu="Baja rotación">
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <h1 className="page-title">Baja rotación</h1>
            <p className="page-subtitle">
              Productos que se mueven poco — útil para promociones o reposición.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm text-slate-600">Score mínimo</label>
            <input
              type="number"
              step="0.05"
              min={0}
              max={1}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="input !w-24"
            />
            <button type="button" onClick={fetchData} className="btn-primary">
              Refrescar
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="btn-accent"
              disabled={!rows.length}
            >
              Exportar CSV
            </button>
          </div>
        </div>

        {err && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm">
            {err}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Cargando…</p>
        ) : (
          <div className="card !p-0 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Score</th>
                  <th>Etiqueta</th>
                  <th>Motivo</th>
                  <th>Días sin venta</th>
                  <th>Días inventario</th>
                  <th>u/sem (90d)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={`${r.product_id}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td className="font-medium">{r.product_sku ?? "—"}</td>
                    <td>{r.product_name || "—"}</td>
                    <td className="font-semibold">{Number(r.score).toFixed(3)}</td>
                    <td>
                      <span className="badge badge-low uppercase">{r.label || "—"}</span>
                    </td>
                    <td className="text-slate-600">{r.reason || "—"}</td>
                    <td>{r.days_since_last_sale ?? "—"}</td>
                    <td>{r.days_of_inventory ?? "—"}</td>
                    <td>{r.weekly_90 ?? "—"}</td>
                    <td>
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          className="btn !py-1 !px-2 text-xs"
                          onClick={() => navigate(`/admin/products`)}
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          className="btn-primary !py-1 !px-2 text-xs"
                          onClick={() => {
                            if (confirm("¿Marcar como revisado (OK)?"))
                              markFeedback(r.product_id, true);
                          }}
                        >
                          OK
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="!text-center text-slate-500 py-8">
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
