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
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Categorías</h1>
          {canEdit && (
            <button onClick={openCreate} className="btn-primary">Nuevo</button>
          )}
        </div>

        <div className="mb-3">
          <input
            className="input"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                  <th className="text-left px-3 py-2">Nombre</th>
                  <th className="text-left px-3 py-2">Descripción</th>
                  <th className="text-left px-3 py-2">Activo</th>
                  <th className="text-left px-3 py-2">Actualizado</th>
                  {canEdit && <th className="text-right px-3 py-2">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.description || "-"}</td>
                    <td className="px-3 py-2">{Number(r.is_active) ? "Sí" : "No"}</td>
                    <td className="px-3 py-2">
                      {r.updated_at ? new Date(r.updated_at).toLocaleString() : "-"}
                    </td>
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
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 5 : 4} className="px-3 py-4 text-center text-gray-500">
                      No hay categorías
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-gray-600">
            Mostrando {from}-{to} de {total}
          </span>
          <div className="flex gap-2">
            <button
              className="btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </button>
            <button
              className="btn"
              onClick={() => setPage((p) => (p * PAGE_SIZE >= total ? p : p + 1))}
              disabled={page * PAGE_SIZE >= total}
            >
              Siguiente
            </button>
          </div>
        </div>

        {/* Modal CRUD */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
            <div className="bg-white rounded-xl shadow max-w-xl w-full p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">{editing ? "Editar categoría" : "Nueva categoría"}</h2>
                <button onClick={closeModal} className="text-sm">✕</button>
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

        {/* Confirmar eliminación */}
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
