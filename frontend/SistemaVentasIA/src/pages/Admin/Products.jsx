import { useEffect, useMemo, useState } from "react";
import useApi from "../../hooks/useApi";
import useAuth from "../../hooks/useAuth";
import ProductForm from "../../components/ProductForm";
import ConfirmDialog from "../../components/ConfirmDialog";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { downloadCsv } from "../../utils/csv";

function stockBadge(stock, min) {
  const s = Number(stock ?? 0);
  const m = Number(min ?? 0);
  if (s <= 0) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="font-semibold text-slate-900">0</span>
        <span className="badge badge-out">Sin stock</span>
      </div>
    );
  }
  if (s <= m) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="font-semibold text-slate-900">{s}</span>
        <span className="badge badge-low">Bajo</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="font-semibold text-slate-900">{s}</span>
      <span className="badge badge-ok">OK</span>
    </div>
  );
}

export default function Products() {
  const api = useApi();
  const { user } = useAuth();

  const canEdit = useMemo(() => {
    const roles = user?.roles || [];
    return roles.includes("admin") || roles.includes("manager");
  }, [user]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await api.get("/products");
      setRows(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.sku?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.barcode?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const exportProducts = () => {
    downloadCsv(
      `productos_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { key: "sku", label: "SKU" },
        { key: "barcode", label: "Codigo de barras" },
        { key: "name", label: "Producto" },
        { key: "description", label: "Descripcion" },
        { key: "cost", label: "Costo" },
        { key: "price", label: "Precio" },
        { key: "stock", label: "Stock" },
        { key: "min_stock", label: "Stock minimo" },
        { key: "is_active", label: "Activo" },
      ],
      filtered.map((r) => ({
        ...r,
        barcode: r.barcode || "",
        description: r.description || "",
        cost: Number(r.cost || 0).toFixed(2),
        price: Number(r.price || 0).toFixed(2),
        stock: r.stock ?? 0,
        is_active: Number(r.is_active) ? "Si" : "No",
      }))
    );
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (prod) => {
    setEditing(prod);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const submitForm = async (form) => {
    setSaving(true);
    setErr("");
    try {
      const payload = {
        ...form,
        barcode: form.barcode?.trim() ? form.barcode.trim() : null,
      };
      if (editing) await api.put(`/products/${editing.id}`, payload);
      else await api.post("/products", payload);
      await load();
      closeModal();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (prod) => {
    setToDelete(prod);
    setConfirmOpen(true);
  };
  const cancelDelete = () => {
    setConfirmOpen(false);
    setToDelete(null);
  };
  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.del(`/products/${toDelete.id}`);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      cancelDelete();
    }
  };

  return (
    <DashboardLayout activeMenu="Productos">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="page-title">Productos</h1>
            <p className="page-subtitle">Catálogo y stock. Escanea el código al crear o editar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={exportProducts} disabled={!filtered.length}>
              Exportar CSV
            </button>
            {canEdit && (
              <button type="button" onClick={openCreate} className="btn-primary">
                Nuevo producto
              </button>
            )}
          </div>
        </div>

        <div className="card !p-4">
          <input
            className="input"
            placeholder="Buscar por SKU / nombre / código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : (
          <div className="card !p-0 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Barcode</th>
                  <th className="!text-right">Costo</th>
                  <th className="!text-right">Precio</th>
                  <th>Hay</th>
                  <th className="!text-right">Mín.</th>
                  {canEdit && <th className="!text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.sku}</td>
                    <td>{r.name}</td>
                    <td className="text-slate-500">{r.barcode || "—"}</td>
                    <td className="!text-right">S/ {Number(r.cost).toFixed(2)}</td>
                    <td className="!text-right">S/ {Number(r.price).toFixed(2)}</td>
                    <td>{stockBadge(r.stock, r.min_stock)}</td>
                    <td className="!text-right">{r.min_stock}</td>
                    {canEdit && (
                      <td className="!text-right">
                        <div className="inline-flex gap-2">
                          <button type="button" className="btn-primary" onClick={() => openEdit(r)}>
                            Editar
                          </button>
                          <button type="button" className="btn-delete" onClick={() => askDelete(r)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7} className="!text-center text-slate-500 py-8">
                      No hay productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4">
            <div className="card max-w-xl w-full !shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">
                  {editing ? "Editar producto" : "Nuevo producto"}
                </h2>
                <button type="button" onClick={closeModal} className="btn !px-2 !py-1">
                  ✕
                </button>
              </div>
              <ProductForm
                initialData={editing}
                onSubmit={submitForm}
                onCancel={closeModal}
                loading={saving}
              />
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmOpen}
          title="Eliminar producto"
          message={toDelete ? `¿Seguro que deseas eliminar "${toDelete.name}"?` : ""}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          confirmText="Eliminar"
        />
      </div>
    </DashboardLayout>
  );
}
