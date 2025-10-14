
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import DashboardLayout from "../../components/layouts/DashboardLayout";

export default function SaleDetail() {
  const { id } = useParams();
  const api = useApi();
  const [sale, setSale] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(`/sales/${id}`);
        setSale(data);
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="max-w-6xl mx-auto p-4">Cargando...</div>;
  if (err) return <div className="max-w-6xl mx-auto p-4 text-red-600">{err}</div>;
  if (!sale) return null;

  return (
    <DashboardLayout activeMenu="Generar Venta">
        <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Venta #{sale.id}</h1>
            <Link className="btn" to="/admin/sales">Volver</Link>
        </div>

        <div className="card grid sm:grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Código: </span>{sale.code}</div>
            <div><span className="text-gray-500">Fecha: </span>{new Date(sale.sold_at).toLocaleString()}</div>
            <div><span className="text-gray-500">Pago: </span>{sale.payment_method}</div>
            <div><span className="text-gray-500">Estado: </span>{sale.status}</div>
            {sale.note && <div className="sm:col-span-2"><span className="text-gray-500">Nota: </span>{sale.note}</div>}
        </div>

        <div className="card">
            <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="text-left px-3 py-2">SKU</th>
                    <th className="text-left px-3 py-2">Producto</th>
                    <th className="text-right px-3 py-2">Cant.</th>
                    <th className="text-right px-3 py-2">P. Unit.</th>
                    <th className="text-right px-3 py-2">Desc.</th>
                    <th className="text-right px-3 py-2">IGV</th>
                    <th className="text-right px-3 py-2">Total</th>
                </tr>
                </thead>
                <tbody>
                {sale.items?.map(it => (
                    <tr key={it.id} className="border-t">
                    <td className="px-3 py-2">{it.sku}</td>
                    <td className="px-3 py-2">{it.name}</td>
                    <td className="px-3 py-2 text-right">{it.quantity}</td>
                    <td className="px-3 py-2 text-right">S/ {Number(it.unit_price).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">S/ {Number(it.discount).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">S/ {Number(it.line_tax).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-semibold">S/ {Number(it.line_total).toFixed(2)}</td>
                    </tr>
                ))}
                </tbody>
                <tfoot>
                <tr className="border-t">
                    <td colSpan="5"></td>
                    <td className="px-3 py-2 text-right font-medium">Subtotal</td>
                    <td className="px-3 py-2 text-right">S/ {Number(sale.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                    <td colSpan="5"></td>
                    <td className="px-3 py-2 text-right font-medium">IGV</td>
                    <td className="px-3 py-2 text-right">S/ {Number(sale.tax_total).toFixed(2)}</td>
                </tr>
                <tr>
                    <td colSpan="5"></td>
                    <td className="px-3 py-2 text-right font-semibold">Total</td>
                    <td className="px-3 py-2 text-right font-semibold">S/ {Number(sale.grand_total).toFixed(2)}</td>
                </tr>
                </tfoot>
            </table>
            </div>
        </div>
        </div>
    </DashboardLayout>
  );
}
