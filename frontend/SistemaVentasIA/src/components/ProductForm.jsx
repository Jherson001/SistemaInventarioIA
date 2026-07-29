import { useEffect, useState } from "react";
import BarcodeScanner from "./BarcodeScanner";

const empty = {
  sku: "", barcode: "", name: "", description: "",
  cost: 0, price: 0, min_stock: 0, is_active: 1
};

export default function ProductForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  useEffect(() => {
    setForm(initialData ? { ...empty, ...initialData } : empty);
    setErr("");
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let v = value;
    if (["cost","price"].includes(name)) v = Number(value);
    if (["min_stock","is_active"].includes(name)) v = Number(value);
    setForm(f => ({ ...f, [name]: type === "number" ? Number(v) : v }));
  };

  const onBarcodeScanned = (code) => {
    setForm(f => ({
      ...f,
      barcode: code,
      // Si aún no hay SKU, lo rellenamos con el código escaneado
      sku: f.sku?.trim() ? f.sku : code,
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.sku.trim()) return setErr("SKU es requerido");
    if (!form.name.trim()) return setErr("Nombre es requerido");
    if (form.price === "" || isNaN(form.price) || Number(form.price) < 0) return setErr("Precio inválido");
    if (form.cost === "" || isNaN(form.cost) || Number(form.cost) < 0) return setErr("Costo inválido");
    if (form.min_stock < 0) return setErr("Min stock no puede ser negativo");
    setErr("");
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm">SKU *</label>
          <input name="sku" className="input" value={form.sku} onChange={handleChange} required />
        </div>
        <div>
          <label className="text-sm">Código de barras</label>
          <div className="flex gap-2">
            <input
              name="barcode"
              className="input flex-1"
              value={form.barcode || ""}
              onChange={handleChange}
              placeholder="Escanear o escribir..."
            />
            <button
              type="button"
              className="btn-primary whitespace-nowrap shrink-0"
              onClick={() => setScanOpen(true)}
            >
              Escanear
            </button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm">Nombre *</label>
          <input name="name" className="input" value={form.name} onChange={handleChange} required />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm">Descripción</label>
          <input name="description" className="input" value={form.description || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm">Costo (S/)</label>
          <input name="cost" type="number" step="0.01" min="0" className="input" value={form.cost} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm">Precio (S/)</label>
          <input name="price" type="number" step="0.01" min="0" className="input" value={form.price} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm">Existencias mínimas</label>
          <input name="min_stock" type="number" min="0" className="input" value={form.min_stock} onChange={handleChange} />
        </div>
        <div>
          <label className="text-sm">Activo</label>
          <select name="is_active" className="input" value={form.is_active} onChange={handleChange}>
            <option value={1}>Sí</option>
            <option value={0}>No</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn">Cancelar</button>
        <button disabled={loading} type="submit" className="btn-primary">
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <BarcodeScanner
        open={scanOpen}
        title="Escanear código del producto"
        onScan={onBarcodeScanned}
        onClose={() => setScanOpen(false)}
      />
    </form>
  );
}
