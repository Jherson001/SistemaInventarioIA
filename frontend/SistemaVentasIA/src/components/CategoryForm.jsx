// src/components/CategoryForm.jsx
import { useEffect, useState } from "react";

const empty = {
  name: "",
  description: "",
  is_active: 1,
};

export default function CategoryForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");

  useEffect(() => {
    setForm(initialData ? { ...empty, ...initialData } : empty);
    setErr("");
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "is_active") v = Number(value);
    setForm((f) => ({ ...f, [name]: v }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr("El nombre es requerido");
    setErr("");
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-sm">Nombre *</label>
          <input
            name="name"
            className="input"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm">Descripción</label>
          <input
            name="description"
            className="input"
            value={form.description || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="text-sm">Activo</label>
          <select
            name="is_active"
            className="input"
            value={form.is_active}
            onChange={handleChange}
          >
            <option value={1}>Sí</option>
            <option value={0}>No</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn">Cancelar</button>
        <button disabled={loading} className="btn btn-primary">
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
