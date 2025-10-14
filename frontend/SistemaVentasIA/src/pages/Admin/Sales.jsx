import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import DashboardLayout from "../../components/layouts/DashboardLayout";

export default function Sales() {
  const api = useApi();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const q = new URLSearchParams();
      if (from) q.set("date_from", from + " 00:00:00");
      if (to) q.set("date_to", to + " 23:59:59");
      const data = await api.get(`/sales${q.toString() ? `?${q}` : ""}`);
      setRows(data);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <DashboardLayout activeMenu="Ventas">
        <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold">Ventas</h1>
            <Link to="/admin/pos" className="btn btn-primary">Nueva venta</Link>
        </div>

        <div className="card mb-4 grid sm:grid-cols-4 gap-3">
            <div>
            <label className="text-sm">Desde</label>
            <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)} />
            </div>
            <div>
            <label className="text-sm">Hasta</label>
            <input type="date" className="input" value={to} onChange={e=>setTo(e.target.value)} />
            </div>
            <div className="sm:col-span-2 flex items-end">
            <button className="btn btn-primary ml-auto" onClick={load}>Filtrar</button>
            </div>
        </div>

        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
        {loading ? <p>Cargando...</p> : (
            <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="text-left px-3 py-2">Código</th>
                    <th className="text-left px-3 py-2">Fecha</th>
                    <th className="text-left px-3 py-2">Pago</th>
                    <th className="text-right px-3 py-2">Subtotal</th>
                    <th className="text-right px-3 py-2">IGV</th>
                    <th className="text-right px-3 py-2">Total</th>
                    <th className="text-right px-3 py-2"></th>
                </tr>
                </thead>
                <tbody>
                {rows.map(s => (
                    <tr key={s.id} className="border-t">
                    <td className="px-3 py-2">{s.code}</td>
                    <td className="px-3 py-2">{new Date(s.sold_at).toLocaleString()}</td>
                    <td className="px-3 py-2">{s.payment_method}</td>
                    <td className="px-3 py-2 text-right">S/ {Number(s.subtotal).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">S/ {Number(s.tax_total).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-semibold">S/ {Number(s.grand_total).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                        <Link className="btn" to={`/admin/sales/${s.id}`}>Detalle</Link>
                    </td>
                    </tr>
                ))}
                {rows.length === 0 && (
                    <tr><td colSpan="7" className="px-3 py-4 text-center text-gray-500">No hay ventas</td></tr>
                )}
                </tbody>
            </table>
            </div>
        )}
        </div>
    </DashboardLayout>
  );
}
