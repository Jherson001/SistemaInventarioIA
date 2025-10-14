import { useEffect, useMemo, useState } from "react";
import useApi from "../../hooks/useApi";
import useAuth from "../../hooks/useAuth";
import ProductForm from "../../components/ProductForm";
import ConfirmDialog from "../../components/ConfirmDialog";
import DashboardLayout from "../../components/layouts/DashboardLayout";

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

  // UI state
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // product or null

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const data = await api.get("/products");
      setRows(data);
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.sku?.toLowerCase().includes(q) ||
      r.name?.toLowerCase().includes(q) ||
      r.barcode?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (prod) => { setEditing(prod); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const submitForm = async (form) => {
    setSaving(true); setErr("");
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
      } else {
        await api.post("/products", form);
      }
      await load();
      closeModal();
    } catch (e) {
      setErr(e.message);
    } finally { setSaving(false); }
  };

  const askDelete = (prod) => { setToDelete(prod); setConfirmOpen(true); };
  const cancelDelete = () => { setConfirmOpen(false); setToDelete(null); };
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
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Productos</h1>
          {canEdit && (
            <button onClick={openCreate} className="btn-primary">Nuevo</button>
          )}
        </div>

        <div className="mb-3">
          <input
            className="input"
            placeholder="Buscar por SKU / nombre / código de barras..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-3 py-2">SKU</th>
                  <th className="text-left px-3 py-2">Nombre</th>
                  <th className="text-right px-3 py-2">Costo</th>
                  <th className="text-right px-3 py-2">Precio</th>
                  <th className="text-right px-3 py-2">Stock</th>
                  <th className="text-right px-3 py-2">Min</th>
                  {canEdit && <th className="text-right px-3 py-2">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.sku}</td>
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 text-right">S/ {Number(r.cost).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">S/ {Number(r.price).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{r.stock ?? 0}</td>
                    <td className="px-3 py-2 text-right">{r.min_stock}</td>
                    {canEdit && (
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button className="btn-primary" onClick={() => openEdit(r)}>Editar</button>
                          <button className="btn-delete" onClick={() => askDelete(r)}>Eliminar</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={canEdit ? 7 : 6} className="px-3 py-4 text-center text-gray-500">No hay productos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal simple */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
            <div className="bg-white rounded-xl shadow max-w-xl w-full p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">{editing ? "Editar producto" : "Nuevo producto"}</h2>
                <button onClick={closeModal} className="text-sm">✕</button>
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
