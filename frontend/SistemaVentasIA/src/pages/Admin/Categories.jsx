// src/pages/Admin/Categories.jsx
import { useEffect, useMemo, useState } from "react";
import useApi from "../../hooks/useApi";
import useAuth from "../../hooks/useAuth";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import CategoryForm from "../../components/CategoryForm";
import ConfirmDialog from "../../components/ConfirmDialog";

const PAGE_SIZE = 20;

export default function Categories() {
  const api = useApi();
  const { user } = useAuth();

  const canEdit = useMemo(() => {
    const roles = user?.roles || [];
    return roles.includes("admin") || roles.includes("manager");
  }, [user]);

  // Datos y estado de UI
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  // Confirmación eliminar
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = async ({ q = search, p = page } = {}) => {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({
        q: q || "",
        page: String(p),
        pageSize: String(PAGE_SIZE),
      }).toString();
      const data = await api.get(`/categories?${params}`);
      setRows(data.rows || []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => { load({ p: 1 }); }, []);

  // Búsqueda con “debounce” simple
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load({ q: search, p: 1 }); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Cambio de página
  useEffect(() => { load({ p: page }); }, [page]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (cat) => { setEditing(cat); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const submitForm = async (form) => {
    setSaving(true); setErr("");
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
      } else {
        await api.post("/categories", form);
      }
      await load({ p: 1 });
      closeModal();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (cat) => { setToDelete(cat); setConfirmOpen(true); };
  const cancelDelete = () => { setConfirmOpen(false); setToDelete(null); };
  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.del(`/categories/${toDelete.id}`);
      // Si borramos el último de la página, retrocedemos una página
      const newTotal = total - 1;
      const newLastPage = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      const nextPage = Math.min(page, newLastPage);
      setPage(nextPage);
      await load({ p: nextPage });
    } catch (e) {
      setErr(e.message);
    } finally {
      cancelDelete();
    }
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <DashboardLayout activeMenu="Categorías">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Categorías</h1>
            <p className="page-subtitle">Agrupa tus productos</p>
          </div>
          {canEdit && (
            <button type="button" onClick={openCreate} className="btn-primary shrink-0">
              Nuevo
            </button>
          )}
        </div>

        <div className="card !p-3">
          <input
            className="input"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : (
          <>
            <div className="mobile-list only-mobile">
              {rows.map((r) => (
                <div key={r.id} className="mobile-item">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.description || "Sin descripción"}
                      </p>
                    </div>
                    <span className={`badge shrink-0 ${Number(r.is_active) ? "badge-ok" : "badge-out"}`}>
                      {Number(r.is_active) ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="mobile-item-actions">
                      <button type="button" className="btn-primary flex-1" onClick={() => openEdit(r)}>
                        Editar
                      </button>
                      <button type="button" className="btn-delete flex-1" onClick={() => askDelete(r)}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {rows.length === 0 && (
                <p className="text-center text-slate-500 py-8 text-sm">No hay categorías</p>
              )}
            </div>

            <div className="card !p-0 table-scroll only-desktop">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Activo</th>
                    <th>Actualizado</th>
                    {canEdit && <th className="!text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.name}</td>
                      <td>{r.description || "—"}</td>
                      <td>{Number(r.is_active) ? "Sí" : "No"}</td>
                      <td className="text-slate-500 text-xs">
                        {r.updated_at ? new Date(r.updated_at).toLocaleString() : "—"}
                      </td>
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
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={canEdit ? 5 : 4} className="!text-center text-slate-500 py-8">
                        No hay categorías
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
          <span className="text-slate-600">
            {from}-{to} de {total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setPage((p) => (p * PAGE_SIZE >= total ? p : p + 1))}
              disabled={page * PAGE_SIZE >= total}
            >
              Siguiente
            </button>
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 grid place-items-end sm:place-items-center z-50 p-0 sm:p-4">
            <div className="card max-w-xl w-full !shadow-2xl !rounded-b-none sm:!rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">
                  {editing ? "Editar categoría" : "Nueva categoría"}
                </h2>
                <button type="button" onClick={closeModal} className="btn !px-2 !py-1">
                  ✕
                </button>
              </div>
              <CategoryForm
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
          title="Eliminar categoría"
          message={toDelete ? `¿Seguro que deseas eliminar "${toDelete.name}"?` : ""}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          confirmText="Eliminar"
        />
      </div>
    </DashboardLayout>
  );
}
