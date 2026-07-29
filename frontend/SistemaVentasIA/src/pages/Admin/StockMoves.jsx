import { useEffect, useMemo, useState } from "react";
import useApi from "../../hooks/useApi";
import useAuth from "../../hooks/useAuth";
import StockMoveModal from "./StockMoveModal";
import DashboardLayout from "../../components/layouts/DashboardLayout";

const TYPE_META = {
  IN: { label: "Entrada", hint: "Compra / ingreso", className: "badge-ok" },
  OUT: { label: "Salida", hint: "Venta / merma", className: "badge-out" },
  ADJUST: { label: "Ajuste", hint: "Corrección manual", className: "badge-low" },
};

function typeBadge(type) {
  const meta = TYPE_META[type] || { label: type, className: "badge" };
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

function formatQty(m) {
  const n = Number(m.quantity || 0);
  if (m.move_type === "OUT") return `−${Math.abs(n)}`;
  if (m.move_type === "ADJUST") return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
  return `+${Math.abs(n)}`;
}

function qtyClass(m) {
  const n = Number(m.quantity || 0);
  if (m.move_type === "OUT" || (m.move_type === "ADJUST" && n < 0)) return "text-red-700 font-semibold";
  return "text-teal-700 font-semibold";
}

function stockStatus(stock, min) {
  const s = Number(stock ?? 0);
  const m = Number(min ?? 0);
  if (s <= 0) return { label: "Sin existencias", className: "badge-out" };
  if (s <= m) return { label: "Existencias bajas", className: "badge-low" };
  return { label: "Existencias OK", className: "badge-ok" };
}

function shortDate(value) {
  try {
    return new Date(value).toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value || "—";
  }
}

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
  const [filterText, setFilterText] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterProd, setFilterProd] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("IN");
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  const loadProducts = async () => {
    const data = await api.get("/products");
    setProducts(data);
    return data;
  };

  const loadMoves = async (product_id) => {
    const qs = product_id ? `?product_id=${product_id}` : "";
    const data = await api.get(`/stock-moves${qs}`);
    setMoves(Array.isArray(data) ? data : []);
  };

  const loadAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const prods = await loadProducts();
      await loadMoves(filterProd?.id);
      if (filterProd?.id) {
        const fresh = prods.find((p) => p.id === filterProd.id);
        if (fresh) setFilterProd(fresh);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const applyFilters = useMemo(() => {
    const t = filterText.trim().toLowerCase();
    return moves.filter((m) => {
      if (filterType && m.move_type !== filterType) return false;
      if (t) {
        const hay = `${m.sku || ""} ${m.name || ""} ${m.reference || ""} ${m.note || ""}`
          .toLowerCase()
          .includes(t);
        if (!hay) return false;
      }
      return true;
    });
  }, [moves, filterText, filterType]);

  const summary = useMemo(() => {
    let entradas = 0;
    let salidas = 0;
    let ajustes = 0;
    for (const m of applyFilters) {
      const n = Math.abs(Number(m.quantity || 0));
      if (m.move_type === "IN") entradas += n;
      else if (m.move_type === "OUT") salidas += n;
      else ajustes += 1;
    }
    return { entradas, salidas, ajustes, total: applyFilters.length };
  }, [applyFilters]);

  const openNew = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const createMove = async (payload) => {
    try {
      setSaving(true);
      setErr("");
      await api.post("/stock-moves", payload);
      const prods = await loadProducts();
      await loadMoves(filterProd?.id);
      if (filterProd?.id) {
        const fresh = prods.find((p) => p.id === filterProd.id);
        if (fresh) setFilterProd(fresh);
      }
      setModalOpen(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const productMatches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products.slice(0, 8);
    return products
      .filter(
        (p) =>
          p.sku?.toLowerCase().includes(s) ||
          p.name?.toLowerCase().includes(s) ||
          p.barcode?.toLowerCase().includes(s)
      )
      .slice(0, 8);
  }, [q, products]);

  const pickFilterProduct = async (p) => {
    setFilterProd(p);
    setQ(p.name || p.sku || "");
    setLoading(true);
    try {
      await loadMoves(p?.id);
    } finally {
      setLoading(false);
    }
  };

  const clearProductFilter = async () => {
    setFilterProd(null);
    setQ("");
    setLoading(true);
    try {
      await loadMoves(null);
    } finally {
      setLoading(false);
    }
  };

  const status = filterProd
    ? stockStatus(filterProd.stock, filterProd.min_stock)
    : null;

  return (
    <DashboardLayout activeMenu="Movimientos">
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <h1 className="page-title">Movimientos de stock</h1>
            <p className="page-subtitle">
              Historial de lo que entra, sale o se corrige en la bodega.
            </p>
          </div>
          {canCreate && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => openNew("IN")}>
                + Entrada
              </button>
              <button type="button" className="btn-accent" onClick={() => openNew("OUT")}>
                − Salida
              </button>
              <button type="button" className="btn" onClick={() => openNew("ADJUST")}>
                Ajuste
              </button>
            </div>
          )}
        </div>

        {/* Leyenda simple */}
        <div className="card !py-3 flex flex-wrap gap-4 text-sm text-slate-600">
          <span>
            <span className="badge badge-ok mr-1">Entrada</span> compra / ingreso
          </span>
          <span>
            <span className="badge badge-out mr-1">Salida</span> venta / merma / uso
          </span>
          <span>
            <span className="badge badge-low mr-1">Ajuste</span> corrección de conteo
          </span>
        </div>

        {/* Filtros */}
        <div className="card space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Buscar producto</label>
              <input
                className="input"
                placeholder="Escribe nombre, SKU o código de barras..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {!filterProd && (
                <div className="mt-2 max-h-44 overflow-y-auto border border-[var(--color-line)] rounded-lg">
                  {productMatches.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      className="w-full text-left px-3 py-2 text-sm border-b hover:bg-teal-50 flex justify-between gap-2"
                      onClick={() => pickFilterProduct(p)}
                    >
                      <span>
                        <strong>{p.name}</strong>
                        <span className="text-slate-400 ml-2">{p.sku}</span>
                      </span>
                      <span className="text-slate-500 shrink-0">Hay {p.stock ?? 0}</span>
                    </button>
                  ))}
                  {productMatches.length === 0 && (
                    <p className="px-3 py-2 text-slate-500 text-sm">Sin resultados</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Tipo de movimiento</label>
                <select
                  className="input"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="IN">Solo entradas</option>
                  <option value="OUT">Solo salidas</option>
                  <option value="ADJUST">Solo ajustes</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Buscar en historial</label>
                <input
                  className="input"
                  placeholder="Referencia o nota..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen del producto elegido */}
        {filterProd && (
          <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-50 to-teal-50/40">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Producto seleccionado
              </p>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">{filterProd.name}</h2>
              <p className="text-sm text-slate-500">
                SKU: {filterProd.sku}
                {filterProd.barcode ? ` · Código: ${filterProd.barcode}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-500">Cantidad actual</p>
                <p className="text-2xl font-bold text-slate-900">{filterProd.stock ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Mínimo</p>
                <p className="text-2xl font-bold text-slate-700">{filterProd.min_stock ?? 0}</p>
              </div>
              <span className={`badge ${status.className} !text-sm !px-3 !py-1`}>
                {status.label}
              </span>
              <button type="button" className="btn" onClick={clearProductFilter}>
                Ver todos
              </button>
            </div>
          </div>
        )}

        {/* Contadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card !py-3">
            <p className="text-xs text-slate-500">Movimientos</p>
            <p className="text-xl font-bold">{summary.total}</p>
          </div>
          <div className="card !py-3">
            <p className="text-xs text-slate-500">Unidades entraron</p>
            <p className="text-xl font-bold text-teal-700">+{summary.entradas}</p>
          </div>
          <div className="card !py-3">
            <p className="text-xs text-slate-500">Unidades salieron</p>
            <p className="text-xl font-bold text-red-700">−{summary.salidas}</p>
          </div>
          <div className="card !py-3">
            <p className="text-xs text-slate-500">Ajustes</p>
            <p className="text-xl font-bold text-amber-700">{summary.ajustes}</p>
          </div>
        </div>

        {err && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">
            {err}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Cargando movimientos...</p>
        ) : (
          <div className="card !p-0 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  {!filterProd && <th>Producto</th>}
                  <th>Tipo</th>
                  <th className="!text-right">Cantidad</th>
                  <th>Referencia</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {applyFilters.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap text-slate-600">{shortDate(m.moved_at)}</td>
                    {!filterProd && (
                      <td>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-slate-400">{m.sku}</div>
                      </td>
                    )}
                    <td>{typeBadge(m.move_type)}</td>
                    <td className={`!text-right ${qtyClass(m)}`}>{formatQty(m)}</td>
                    <td className="text-slate-600">{m.reference || "—"}</td>
                    <td className="text-slate-500">{m.note || "—"}</td>
                  </tr>
                ))}
                {applyFilters.length === 0 && (
                  <tr>
                    <td
                      colSpan={filterProd ? 5 : 6}
                      className="!text-center text-slate-500 py-10"
                    >
                      No hay movimientos con estos filtros.
                      <div className="mt-2 text-sm">
                        Usa <strong>Entrada</strong> o <strong>Salida</strong> para registrar el
                        primero.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <StockMoveModal
          open={modalOpen}
          products={products}
          defaultType={modalType}
          onCancel={() => setModalOpen(false)}
          onConfirm={createMove}
          loading={saving}
        />
      </div>
    </DashboardLayout>
  );
}
