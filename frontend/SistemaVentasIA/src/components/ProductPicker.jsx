import { useEffect, useMemo, useState } from "react";
import useApi from "../hooks/useApi";
import DashboardLayout from "./layouts/DashboardLayout";

export default function ProductPicker({ onAdd }) {
  const api = useApi();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get("/products");
        setRows(data);
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows.slice(0, 20);
    return rows.filter(r =>
      r.sku?.toLowerCase().includes(s) ||
      r.name?.toLowerCase().includes(s) ||
      r.barcode?.toLowerCase().includes(s)
    ).slice(0, 20);
  }, [rows, q]);

  const add = (p) => {
    onAdd({
      product_id: p.id,
      sku: p.sku,
      name: p.name,
      stock: p.stock ?? 0,
      unit_price: Number(p.price || 0),
      unit_cost: Number(p.cost || 0),
      quantity: 1,
      discount: 0,
      tax_rate_applied: 0.18
    });
  };

  return (
    <div className="card">
    <div className="flex items-center gap-3">
        <input
        className="input w-full"
        placeholder="Buscar por SKU / nombre / código de barras..."
        value={q}
        onChange={e=>setQ(e.target.value)}
        />
    </div>

    {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
    {loading ? <p className="mt-3">Cargando...</p> : (
        <div className="mt-3 max-h-64 overflow-y-auto">
        <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
            <tr>
                <th className="text-left px-3 py-2">SKU</th>
                <th className="text-left px-3 py-2">Nombre</th>
                <th className="text-right px-3 py-2">Precio</th>
                <th className="text-right px-3 py-2">Stock</th>
                <th className="text-right px-3 py-2"></th>
            </tr>
            </thead>
            <tbody>
            {filtered.map(p => (
                <tr key={p.id} className="border-t">
                <td className="px-3 py-2">{p.sku}</td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2 text-right">S/ {Number(p.price).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{p.stock ?? 0}</td>
                <td className="px-3 py-2 text-right">
                    <button className="btn btn-primary" onClick={()=>add(p)}>Agregar</button>
                </td>
                </tr>
            ))}
            {filtered.length === 0 && (
                <tr><td colSpan="5" className="px-3 py-3 text-center text-gray-500">Sin resultados</td></tr>
            )}
            </tbody>
        </table>
        </div>
    )}
    </div>
  );
}
