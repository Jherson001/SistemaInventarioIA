import { useEffect, useMemo, useRef, useState } from "react";
import useApi from "../../hooks/useApi";
import useAuth from "../../hooks/useAuth";
import ProductForm from "../../components/ProductForm";
import ConfirmDialog from "../../components/ConfirmDialog";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { downloadCsv, downloadProductImportTemplate, parseCsv } from "../../utils/csv";

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

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "inactive", label: "Inactivos" },
  { id: "out", label: "Sin stock" },
  { id: "low", label: "Bajo mínimo" },
  { id: "nobarcode", label: "Sin código" },
];

export default function Products() {
  const api = useApi();
  const { user } = useAuth();
  const fileRef = useRef(null);

  const canEdit = useMemo(() => {
    const roles = user?.roles || [];
    const email = String(user?.email || "").toLowerCase();
    return (
      roles.includes("admin") ||
      roles.includes("manager") ||
      user?.role === "admin" ||
      user?.role === "manager" ||
      email === "admin@local" ||
      email.startsWith("admin@")
    );
  }, [user]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [updateStockOnImport, setUpdateStockOnImport] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await api.get("/products?include_inactive=1");
      setRows(Array.isArray(data) ? data : []);
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
    return rows.filter((r) => {
      const active = Number(r.is_active) !== 0;
      const stock = Number(r.stock ?? 0);
      const min = Number(r.min_stock ?? 0);

      if (filter === "active" && !active) return false;
      if (filter === "inactive" && active) return false;
      if (filter === "out" && !(active && stock <= 0)) return false;
      if (filter === "low" && !(active && stock > 0 && stock <= min)) return false;
      if (filter === "nobarcode" && String(r.barcode || "").trim()) return false;

      if (!q) return true;
      return (
        r.sku?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.barcode?.toLowerCase().includes(q)
      );
    });
  }, [rows, search, filter]);

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

  const onPickImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      setErr(
        "Ese archivo es Excel (.xlsx). Usa el CSV del Escritorio: productos_zuria_importar.csv (no Productos 2.xlsx)."
      );
      return;
    }
    if (!name.endsWith(".csv") && file.type && !String(file.type).includes("csv") && !String(file.type).includes("text")) {
      setErr("Solo se acepta archivo .csv");
      return;
    }

    setImporting(true);
    setErr("");
    setImportResult(null);
    setImportProgress("Leyendo archivo…");
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (!parsed.length) {
        throw new Error(
          "No se pudieron leer filas. Abre productos_zuria_importar.csv (separador ;). Si abriste el Excel, guárdalo como CSV UTF-8."
        );
      }

      const batchSize = 100;
      const summary = { total: parsed.length, created: 0, updated: 0, skipped: 0, errors: [] };
      const totalBatches = Math.ceil(parsed.length / batchSize);

      for (let i = 0; i < parsed.length; i += batchSize) {
        const batch = parsed.slice(i, i + batchSize);
        const batchNo = Math.floor(i / batchSize) + 1;
        setImportProgress(`Subiendo lote ${batchNo}/${totalBatches} (${batch.length} productos)…`);
        const result = await api.post("/products/import", {
          rows: batch,
          update_existing: true,
          update_stock: updateStockOnImport,
        });
        summary.created += Number(result.created || 0);
        summary.updated += Number(result.updated || 0);
        summary.skipped += Number(result.skipped || 0);
        if (Array.isArray(result.errors) && result.errors.length) {
          summary.errors.push(...result.errors);
        }
      }

      setImportResult(summary);
      setImportProgress("");
      await load();
    } catch (ex) {
      setErr(ex.message || "Error al importar");
      setImportProgress("");
    } finally {
      setImporting(false);
    }
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
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="page-title">Productos</h1>
            <p className="page-subtitle">
              Catálogo, filtros e importación CSV para cargas masivas.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <button type="button" className="btn w-full sm:w-auto" onClick={exportProducts} disabled={!filtered.length}>
              Exportar
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  className="btn w-full sm:w-auto"
                  onClick={downloadProductImportTemplate}
                >
                  Plantilla
                </button>
                <button
                  type="button"
                  className="btn w-full sm:w-auto"
                  disabled={importing}
                  onClick={() => fileRef.current?.click()}
                >
                  {importing ? "Importando…" : "Importar CSV"}
                </button>
                <button type="button" onClick={openCreate} className="btn-primary w-full sm:w-auto">
                  Nuevo
                </button>
              </>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={onPickImportFile}
        />

        {!canEdit && (
          <p className="text-amber-800 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Tu usuario no tiene permiso de admin/manager para importar.
          </p>
        )}

      {canEdit && (
          <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 px-0.5">
            <input
              type="checkbox"
              checked={updateStockOnImport}
              onChange={(e) => setUpdateStockOnImport(e.target.checked)}
            />
            Al importar, también actualizar stock
          </label>
        )}

        {importProgress && (
          <p className="text-sm text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
            {importProgress}
          </p>
        )}

        {importResult && (
          <div className="card !py-3 text-sm text-slate-700">
            Importación: <strong>{importResult.created}</strong> creados,{" "}
            <strong>{importResult.updated}</strong> actualizados,{" "}
            <strong>{importResult.skipped}</strong> omitidos
            {importResult.errors?.length > 0 && (
              <details className="mt-2 text-xs text-amber-800">
                <summary>{importResult.errors.length} avisos</summary>
                <ul className="mt-1 list-disc pl-4 max-h-32 overflow-y-auto">
                  {importResult.errors.slice(0, 20).map((e, i) => (
                    <li key={i}>
                      Línea {e.line}
                      {e.sku ? ` (${e.sku})` : ""}: {e.error}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <div className="card !p-3 sm:!p-4 space-y-3">
          <input
            className="input"
            placeholder="Buscar SKU, nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`btn !py-1.5 !px-2.5 !text-xs ${
                  filter === f.id ? "!bg-teal-700 !text-white !border-teal-700" : ""
                }`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Mostrando {filtered.length} de {rows.length}
          </p>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : (
          <>
            <div className="mobile-list only-mobile">
              {filtered.map((r) => (
                <div key={r.id} className="mobile-item">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-snug">{r.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.sku}
                        {r.barcode ? ` · ${r.barcode}` : ""}
                        {Number(r.is_active) === 0 ? " · Inactivo" : ""}
                      </p>
                    </div>
                    {stockBadge(r.stock, r.min_stock)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span>Costo S/ {Number(r.cost).toFixed(2)}</span>
                    <span>Precio S/ {Number(r.price).toFixed(2)}</span>
                    <span>Mín. {r.min_stock}</span>
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
              {filtered.length === 0 && (
                <p className="text-center text-slate-500 py-8 text-sm">No hay productos</p>
              )}
            </div>

            <div className="card !p-0 table-scroll only-desktop">
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
                    <th>Estado</th>
                    {canEdit && <th className="!text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className={Number(r.is_active) === 0 ? "opacity-60" : ""}>
                      <td className="font-medium">{r.sku}</td>
                      <td>{r.name}</td>
                      <td className="text-slate-500">{r.barcode || "—"}</td>
                      <td className="!text-right">S/ {Number(r.cost).toFixed(2)}</td>
                      <td className="!text-right">S/ {Number(r.price).toFixed(2)}</td>
                      <td>{stockBadge(r.stock, r.min_stock)}</td>
                      <td className="!text-right">{r.min_stock}</td>
                      <td>
                        <span className={`badge ${Number(r.is_active) ? "badge-ok" : "badge-out"}`}>
                          {Number(r.is_active) ? "Activo" : "Inactivo"}
                        </span>
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
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={canEdit ? 9 : 8} className="!text-center text-slate-500 py-8">
                        No hay productos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 grid place-items-end sm:place-items-center z-50 p-0 sm:p-4">
            <div className="card max-w-xl w-full !shadow-2xl !rounded-b-none sm:!rounded-xl max-h-[92dvh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 sticky top-0 bg-white/95 pb-2">
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
