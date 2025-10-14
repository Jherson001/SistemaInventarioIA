import { useEffect, useMemo, useState } from "react";

export default function StockMoveModal({
  open,
  products = [],
  defaultType = "IN", // "IN" | "ADJUST"
  onCancel,
  onConfirm, // ({ product_id, move_type, quantity, reference, note })
  loading
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [moveType, setMoveType] = useState(defaultType);
  const [qty, setQty] = useState(0);
  const [sign, setSign] = useState(1); // para ADJUST: 1 o -1
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setQ("");
      setSelected(null);
      setMoveType(defaultType);
      setQty(0);
      setSign(1);
      setReference("");
      setNote("");
      setErr("");
    }
  }, [open, defaultType]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products.slice(0, 20);
    return products.filter(p =>
      p.sku?.toLowerCase().includes(s) ||
      p.name?.toLowerCase().includes(s) ||
      p.barcode?.toLowerCase().includes(s)
    ).slice(0, 20);
  }, [q, products]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!selected) return setErr("Selecciona un producto");
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) return setErr("Cantidad inválida");

    let quantity = n;
    if (moveType === "IN") {
      // IN siempre positivo
      quantity = Math.abs(n);
    } else {
      // ADJUST puede ser + o -
      quantity = Math.abs(n) * (sign >= 0 ? 1 : -1);
    }

    setErr("");
    onConfirm({
      product_id: selected.id,
      move_type: moveType,
      quantity,
      reference: reference || null,
      note: note || null
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
      <div className="bg-white rounded-xl shadow max-w-xl w-full p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">
            {moveType === "IN" ? "Nueva entrada" : "Nuevo ajuste"}
          </h2>
          <button onClick={onCancel} className="text-sm">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {err && <p className="text-red-600 text-sm">{err}</p>}

          {/* Selección de tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Tipo</label>
              <select className="input" value={moveType} onChange={e=>setMoveType(e.target.value)}>
                <option value="IN">Entrada (IN)</option>
                <option value="ADJUST">Ajuste (+/−)</option>
              </select>
            </div>

            {moveType === "ADJUST" && (
              <div>
                <label className="text-sm">Signo del ajuste</label>
                <select className="input" value={sign} onChange={e=>setSign(Number(e.target.value))}>
                  <option value={1}>Incremento (+)</option>
                  <option value={-1}>Decremento (−)</option>
                </select>
              </div>
            )}
          </div>

          {/* Buscador de producto */}
          <div>
            <label className="text-sm">Producto</label>
            <input
              className="input"
              placeholder="Buscar por SKU / nombre / código de barras..."
              value={q}
              onChange={e=>setQ(e.target.value)}
            />
            {q.length >= 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id}
                          className={`border-b cursor-pointer hover:bg-gray-50 ${selected?.id===p.id ? 'bg-blue-50' : ''}`}
                          onClick={()=>setSelected(p)}>
                        <td className="px-3 py-2">{p.sku}</td>
                        <td className="px-3 py-2">{p.name}</td>
                        <td className="px-3 py-2 text-right">Stock: {p.stock ?? 0}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td className="px-3 py-2 text-gray-500">Sin resultados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {selected && (
              <p className="text-xs text-gray-600 mt-1">
                Seleccionado: <strong>{selected.sku}</strong> — {selected.name} (Stock actual: {selected.stock ?? 0})
              </p>
            )}
          </div>

          {/* Cantidad + refs */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Cantidad</label>
              <input className="input" type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm">Referencia (opcional)</label>
              <input className="input" value={reference} onChange={e=>setReference(e.target.value)} placeholder="COMPRA:0001, AJUSTE:MERMA, etc." />
            </div>
          </div>
          <div>
            <label className="text-sm">Nota (opcional)</label>
            <input className="input" value={note} onChange={e=>setNote(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
            <button disabled={loading} className="btn btn-primary">{loading ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
