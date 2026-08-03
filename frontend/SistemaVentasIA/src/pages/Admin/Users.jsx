import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import useApi from "../../hooks/useApi";
import useAuth from "../../hooks/useAuth";
import { isAdmin } from "../../utils/roles";

const ROLE_LABEL = {
  admin: "Admin",
  manager: "Gerente",
  cashier: "Cajero",
};

export default function Users() {
  const api = useApi();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "cashier",
  });

  const allowed = isAdmin(user);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await api.get("/users");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  const onCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setOk("");
    try {
      const res = await api.post("/users", form);
      setOk(
        `Listo: ${res.user?.email} (${ROLE_LABEL[form.role] || form.role}). Usa la contraseña que escribiste.`
      );
      setForm({ full_name: "", email: "", password: "", role: "cashier" });
      await load();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (row, is_active) => {
    setErr("");
    try {
      await api.patch(`/users/${row.id}/active`, { is_active });
      await load();
    } catch (ex) {
      setErr(ex.message);
    }
  };

  const cashiers = useMemo(
    () => rows.filter((r) => (r.roles || []).includes("cashier")),
    [rows]
  );

  if (!allowed) {
    return <Navigate to="/admin/rapido" replace />;
  }

  return (
    <DashboardLayout activeMenu="Usuarios">
      <div className="space-y-4 max-w-3xl">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">
            Crea cajeros para la tienda. Ellos solo ven <strong>Rápido</strong>.
          </p>
        </div>

        <form onSubmit={onCreate} className="card space-y-3">
          <h2 className="font-bold text-slate-800">Nuevo usuario</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <input
                className="input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                placeholder="Ej. María"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email / usuario</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="cajero1@tienda.local"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contraseña</label>
              <input
                className="input"
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={4}
                placeholder="Mín. 4 caracteres"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Rol</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="cashier">Cajero (solo Rápido)</option>
                <option value="manager">Gerente</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Creando…" : "Crear usuario"}
          </button>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {ok && (
            <p className="text-sm text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
              {ok}
            </p>
          )}
        </form>

        <div className="card !p-0 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="font-bold text-slate-800">Lista ({rows.length})</h2>
            <p className="text-xs text-slate-500">
              Cajeros activos: {cashiers.filter((c) => Number(c.is_active) !== 0).length}
            </p>
          </div>
          {loading ? (
            <p className="p-4 text-slate-500">Cargando…</p>
          ) : (
            <ul>
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{r.full_name}</p>
                    <p className="text-xs text-slate-500">{r.email}</p>
                    <p className="text-xs mt-1">
                      {(r.roles || []).map((role) => (
                        <span key={role} className="badge badge-ok mr-1">
                          {ROLE_LABEL[role] || role}
                        </span>
                      ))}
                      {Number(r.is_active) === 0 && (
                        <span className="badge badge-out">Inactivo</span>
                      )}
                    </p>
                  </div>
                  {Number(r.id) !== Number(user?.id) && (
                    <button
                      type="button"
                      className="btn !text-xs"
                      onClick={() => setActive(r, Number(r.is_active) === 0)}
                    >
                      {Number(r.is_active) === 0 ? "Activar" : "Desactivar"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
