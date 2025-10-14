// src/components/CustomerForm.jsx
import { useEffect, useState } from "react";

const empty = {
  full_name: "",
  document_type: "DNI", // 'DNI','RUC','CE','PASSPORT'
  document_number: "",
  email: "",
  phone: "",
  address: "",
  is_active: 1,
};

export default function CustomerForm({ initialData, onSubmit, onCancel, loading }) {
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
    if (!form.full_name.trim()) return setErr("El nombre es obligatorio");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      return setErr("Correo inválido");
    }
    setErr("");
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-sm">Nombre completo *</label>
          <input
            name="full_name"
            className="input"
            value={form.full_name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="text-sm">Tipo de documento</label>
          <select
            name="document_type"
            className="input"
            value={form.document_type}
            onChange={handleChange}
          >
            <option value="DNI">DNI</option>
            <option value="RUC">RUC</option>
            <option value="CE">CE</option>
            <option value="PASSPORT">PASSPORT</option>
          </select>
        </div>

        <div>
          <label className="text-sm">Número de documento</label>
          <input
            name="document_number"
            className="input"
            value={form.document_number || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="text-sm">Teléfono</label>
          <input
            name="phone"
            className="input"
            value={form.phone || ""}
            onChange={handleChange}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm">Correo</label>
          <input
            name="email"
            type="email"
            className="input"
            value={form.email || ""}
            onChange={handleChange}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm">Dirección</label>
          <input
            name="address"
            className="input"
            value={form.address || ""}
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
