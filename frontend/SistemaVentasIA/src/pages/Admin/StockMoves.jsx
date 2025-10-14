import { useEffect, useMemo, useState } from "react";
import useApi from "../../hooks/useApi";
import useAuth from "../../hooks/useAuth";
import StockMoveModal from "./StockMoveModal";
import DashboardLayout from "../../components/layouts/DashboardLayout";

export default function StockMoves() {
  const api = useApi();
  const { user } = useAuth();
  const canCreate = useMemo(() => {
    const roles = user?.roles || [];
    return roles.includes("admin") || roles.includes("manager");
  }, [user]);

  const [products, setProducts] = useState([]);
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filtros
  const [filterText, setFilterText] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterProd, setFilterProd] = useState(null);

  // modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("IN");
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    const data = await api.get("/products"); // debe traer stock (JOIN vw_stock_current)
    setProducts(data);
  };

  const loadMoves = async (product_id) => {
    const qs = product_id ? `?product_id=${product_id}` : "";
    const data = await api.get(`/stock-moves${qs}`);
    setMoves(data);
  };

  const loadAll = async () => {
    setLoading(true); setErr("");
    try {
      await loadProducts();
      await loadMoves(filterProd?.id);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []); // init

  const applyFilters = useMemo(() => {
    const t = filterText.trim().toLowerCase();
    return moves.filter(m => {
      if (filterType && m.move_type !== filterType) return false;
      if (t) {
        const hay =
          `${m.sku || ''} ${m.name || ''} ${m.reference || ''} ${m.note || ''}`.toLowerCase().includes(t);
        if (!hay) return false;
      }
      return true;
    });
  }, [moves, filterText, filterType]);

  const openNew = (type) => {
    setModalType(type);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const createMove = async (payload) => {
    try {
      setSaving(true);
      await api.post("/stock-moves", payload);
      // reload productos (para stock) y movimientos
      await loadProducts();
      await loadMoves(filterProd?.id);
      closeModal();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // selector simple de producto para filtrar movimientos
  const [q, setQ] = useState("");
  const productMatches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products.slice(0, 20);
    return products.filter(p =>
      p.sku?.toLowerCase().includes(s) ||
      p.name?.toLowerCase().includes(s) ||
      p.barcode?.toLowerCase().includes(s)
    ).slice(0, 20);
  }, [q, products]);

  const pickFilterProduct = async (p) => {
    setFilterProd(p);
    await loadMoves(p?.id);
  };

  return (
    <DashboardLayout>
        <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Movimientos de stock</h1>
            {canCreate && (
            <div className="flex gap-2">
                <button className="btn btn-primary" onClick={()=>openNew("IN")}>Nueva entrada</button>
                <button className="btn btn-primary" onClick={()=>openNew("ADJUST")}>Nuevo ajuste</button>
            </div>
            )}
        </div>

        {/* Filtros */}
        <div className="card grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
            <label className="text-sm">Producto (filtro)</label>
            <input className="input" placeholder="Buscar por SKU / nombre / código de barras..."
                    value={q} onChange={e=>setQ(e.target.value)} />
            <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                <table className="min-w-full text-sm">
                <tbody>
                    {productMatches.map(p => (
                    <tr key={p.id}
                        className={`border-b cursor-pointer hover:bg-gray-50 ${filterProd?.id===p.id ? 'bg-blue-50' : ''}`}
                        onClick={()=>pickFilterProduct(p)}>
                        <td className="px-3 py-2">{p.sku}</td>
                        <td className="px-3 py-2">{p.name}</td>
                        <td className="px-3 py-2 text-right">Stock: {p.stock ?? 0}</td>
                    </tr>
                    ))}
                    {productMatches.length === 0 && (
                    <tr><td className="px-3 py-2 text-gray-500">Sin resultados</td></tr>
                    )}
                </tbody>
                </table>
            </div>
            {filterProd && (
                <p className="text-xs text-gray-600 mt-1">
                Filtrando por: <strong>{filterProd.sku}</strong> — {filterProd.name}
                <button className="ml-2 text-blue-600 underline"
                        onClick={()=>{ setFilterProd(null); setQ(""); loadMoves(null); }}>
                    Limpiar
                </button>
                </p>
            )}
            </div>

            <div>
            <label className="text-sm">Tipo</label>
            <select className="input" value={filterType} onChange={e=>setFilterType(e.target.value)}>
                <option value="">Todos</option>
                <option value="IN">IN (Entrada)</option>
                <option value="ADJUST">ADJUST (Ajuste)</option>
                <option value="OUT" disabled>OUT (Venta)</option>
            </select>
            </div>

            <div>
            <label className="text-sm">Texto</label>
            <input className="input" placeholder="Referencia/nota/SKU..." value={filterText} onChange={e=>setFilterText(e.target.value)} />
            </div>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}
        {loading ? <p>Cargando...</p> : (
            <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="text-left px-3 py-2">Fecha</th>
                    <th className="text-left px-3 py-2">SKU</th>
                    <th className="text-left px-3 py-2">Producto</th>
                    <th className="text-left px-3 py-2">Tipo</th>
                    <th className="text-right px-3 py-2">Cantidad</th>
                    <th className="text-left px-3 py-2">Referencia</th>
                    <th className="text-left px-3 py-2">Usuario</th>
                    <th className="text-left px-3 py-2">Nota</th>
                </tr>
                </thead>
                <tbody>
                {applyFilters.map(m => (
                    <tr key={m.id} className="border-t">
                    <td className="px-3 py-2">{new Date(m.moved_at).toLocaleString()}</td>
                    <td className="px-3 py-2">{m.sku}</td>
                    <td className="px-3 py-2">{m.name}</td>
                    <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                        m.move_type === 'IN' ? 'bg-green-100 text-green-700' :
                        m.move_type === 'OUT' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                        }`}>
                        {m.move_type}
                        </span>
                    </td>
                    <td className={`px-3 py-2 text-right ${m.move_type==='OUT' || (m.move_type==='ADJUST' && m.quantity < 0) ? 'text-red-700' : 'text-green-700'}`}>
                        {m.quantity}
                    </td>
                    <td className="px-3 py-2">{m.reference || '-'}</td>
                    <td className="px-3 py-2">{m.user_id ? `#${m.user_id}` : '-'}</td>
                    <td className="px-3 py-2">{m.note || '-'}</td>
                    </tr>
                ))}
                {applyFilters.length === 0 && (
                    <tr><td colSpan="8" className="px-3 py-4 text-center text-gray-500">No hay movimientos</td></tr>
                )}
                </tbody>
            </table>
            </div>
        )}

        <StockMoveModal
            open={modalOpen}
            products={products}
            defaultType={modalType}
            onCancel={()=>setModalOpen(false)}
            onConfirm={createMove}
            loading={saving}
        />
        </div>
    </DashboardLayout>
  );
}
