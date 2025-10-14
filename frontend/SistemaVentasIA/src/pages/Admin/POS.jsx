import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../../hooks/useApi";
import useAuth from "../../hooks/useAuth";
import ProductPicker from "../../components/ProductPicker";
import Cart from "../../components/Cart";
import DashboardLayout from "../../components/layouts/DashboardLayout";

const methods = ["CASH","CARD","YAPE","PLIN","TRANSFER"];

export default function POS() {
  const api = useApi();
  const nav = useNavigate();
  const { user } = useAuth();

  const canSell = useMemo(() => {
    const roles = user?.roles || [];
    return roles.some(r => ["cashier","manager","admin"].includes(r));
  }, [user]);

  const [items, setItems] = useState([]);
  const [payment, setPayment] = useState("CASH");
  const [note, setNote] = useState("Venta mostrador");
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState("");

  const addItem = (p) => {
    // si ya existe en carrito, aumenta cantidad
    const idx = items.findIndex(x => x.product_id === p.product_id);
    if (idx >= 0) {
      const next = items.slice();
      next[idx].quantity += 1;
      setItems(next);
    } else {
      setItems(prev => [...prev, p]);
    }
  };

  const submit = async () => {
    setErr("");
    if (!canSell) { setErr("No tienes permisos para vender."); return; }
    if (items.length === 0) { setErr("Agrega al menos un ítem."); return; }

    // Preparar payload para backend
    const payload = {
      customer_id: null,
      payment_method: payment,
      note,
      currency: "PEN",
      items: items.map(it => ({
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        discount: it.discount || 0,
        tax_rate_applied: it.tax_rate_applied ?? 0.18
      }))
    };

    try {
      setPosting(true);
      const sale = await api.post("/sales", payload);
      // Navegar a detalle
      nav(`/admin/sales/${sale.id}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <DashboardLayout activeMenu="Generar Venta">
        <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">POS — Nueva venta</h1>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <ProductPicker onAdd={addItem} />

        <Cart items={items} setItems={setItems} />

        <div className="card">
            <div className="grid sm:grid-cols-3 gap-3">
            <div>
                <label className="text-sm">Medio de pago</label>
                <select className="input" value={payment} onChange={e=>setPayment(e.target.value)}>
                {methods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div className="sm:col-span-2">
                <label className="text-sm">Nota</label>
                <input className="input" value={note} onChange={e=>setNote(e.target.value)} />
            </div>
            </div>

            <div className="flex justify-end mt-4">
            <button disabled={posting} className="btn btn-primary" onClick={submit}>
                {posting ? "Procesando..." : "Confirmar venta"}
            </button>
            </div>
        </div>
        </div>
    </DashboardLayout>
  );
}
