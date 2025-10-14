// src/pages/Admin/Customers.jsx
import { useEffect, useMemo, useState } from "react";
import useApi from "../../hooks/useApi";
import useAuth from "../../hooks/useAuth";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import CustomerForm from "../../components/CustomerForm";
import ConfirmDialog from "../../components/ConfirmDialog";

const PAGE_SIZE = 20;

export default function Customers() {
  const api = useApi();
  const { user } = useAuth();

  const canEdit = useMemo(() => {
    const roles = user?.roles || [];
    return roles.includes("admin") || roles.includes("manager");
  }, [user]);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

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
      const data = await api.get(`/customers?${params}`);
      setRows(data.rows || []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load({ p: 1 }); }, []);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load({ q: search, p: 1 }); }, 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { load({ p: page }); }, [page]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const submitForm = async (form) => {
    setSaving(true); setErr("");
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, form);
      } else {
        await api.post(`/customers`, form);
      }
      await load({ p: 1 });
      closeModal();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (c) => { setToDelete(c); setConfirmOpen(true); };
  const cancelDelete = () => { setConfirmOpen(false); setToDelete(null); };
  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.del(`/customers/${toDelete.id}`);
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
    <DashboardLayout activeMenu="Clientes">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Clientes</h1>
          {canEdit && (
            <button onClick={openCreate} className="btn-primary">Nuevo</button>
          )}
        </div>

        <div className="mb-3">
          <input
            className="input"
            placeholder="Buscar por nombre, documento, teléfono o correo…"
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
                  <th className="text-left px-3 py-2">Tipo Doc</th>
                  <th className="text-left px-3 py-2">N° Doc</th>
                  <th className="text-left px-3 py-2">Teléfono</th>
                  <th className="text-left px-3 py-2">Correo</th>
                  <th className="text-left px-3 py-2">Dirección</th>
                  <th className="text-left px-3 py-2">Activo</th>
                  <th className="text-left px-3 py-2">Actualizado</th>
                  {canEdit && <th className="text-right px-3 py-2">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.full_name}</td>
                    <td className="px-3 py-2">{r.document_type}</td>
                    <td className="px-3 py-2">{r.document_number || "-"}</td>
                    <td className="px-3 py-2">{r.phone || "-"}</td>
                    <td className="px-3 py-2">{r.email || "-"}</td>
                    <td className="px-3 py-2">{r.address || "-"}</td>
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
                    <td colSpan={canEdit ? 9 : 8} className="px-3 py-4 text-center text-gray-500">
                      No hay clientes
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

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
            <div className="bg-white rounded-xl shadow max-w-2xl w-full p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">{editing ? "Editar cliente" : "Nuevo cliente"}</h2>
                <button onClick={closeModal} className="text-sm">✕</button>
              </div>
              <CustomerForm
                initialData={editing}
                onSubmit={submitForm}
                onCancel={closeModal}
                loading={saving}
              />
            </div>
          </div>
        )}

        {/* Confirmación */}
        <ConfirmDialog
          open={confirmOpen}
          title="Eliminar cliente"
          message={toDelete ? `¿Seguro que deseas eliminar "${toDelete.full_name}"?` : ""}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          confirmText="Eliminar"
        />
      </div>
    </DashboardLayout>
  );
}
