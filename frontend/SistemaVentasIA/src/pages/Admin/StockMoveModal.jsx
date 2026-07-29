import { useEffect, useMemo, useRef, useState } from "react";
import BarcodeScanner from "../../components/BarcodeScanner";

export default function StockMoveModal({
  open,
  products = [],
  defaultType = "IN",
  onCancel,
  onConfirm,
  loading
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [moveType, setMoveType] = useState(defaultType);
  const [qty, setQty] = useState(1);
  const [sign, setSign] = useState(1);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setSelected(null);
      setMoveType(defaultType);
      setQty(1);
      setSign(1);
      setReference("");
      setNote("");
      setErr("");
      setTimeout(() => inputRef.current?.focus(), 50);
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

  const pickByCode = (code) => {
    const c = String(code || "").trim();
    if (!c) return;
    const found = products.find(p => p.barcode === c || p.sku === c);
    if (found) {
      setSelected(found);
      setQ(found.sku);
      setErr("");
    } else {
      setErr(`No hay producto con código "${c}"`);
    }
  };

  if (!open) return null;

  const titles = {
    IN: "Nueva entrada de stock",
    OUT: "Nueva salida de stock",
    ADJUST: "Ajuste de stock"
  };

  const submit = (e) => {
    e.preventDefault();
    if (!selected) return setErr("Selecciona un producto");
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) return setErr("Cantidad inválida");

    let quantity = Math.abs(n);
    if (moveType === "ADJUST") {
      quantity = Math.abs(n) * (sign >= 0 ? 1 : -1);
    }

    if (moveType === "OUT" && Number(selected.stock ?? 0) < quantity) {
      return setErr(`Stock insuficiente. Disponible: ${selected.stock ?? 0}`);
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
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4">
      <div className="card max-w-xl w-full !shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">{titles[moveType] || "Movimiento"}</h2>
          <button type="button" onClick={onCancel} className="btn !px-2 !py-1">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {err && <p className="text-red-600 text-sm">{err}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <select className="input" value={moveType} onChange={e=>setMoveType(e.target.value)}>
                <option value="IN">Entrada (compra/ingreso)</option>
                <option value="OUT">Salida (venta/merma)</option>
                <option value="ADJUST">Ajuste (+/−)</option>
              </select>
            </div>

            {moveType === "ADJUST" && (
              <div>
                <label className="text-sm font-medium">Signo</label>
                <select className="input" value={sign} onChange={e=>setSign(Number(e.target.value))}>
                  <option value={1}>Incremento (+)</option>
                  <option value={-1}>Decremento (−)</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Producto</label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                className="input"
                placeholder="Escanear o buscar SKU / nombre / barcode..."
                value={q}
                onChange={e=>setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    pickByCode(q);
                  }
                }}
              />
              <button type="button" className="btn-primary shrink-0" onClick={() => setScanOpen(true)}>
                Escanear
              </button>
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto border border-[var(--color-line)] rounded-lg">
              <table className="min-w-full text-sm">
                <tbody>
                  {filtered.map(p => (
                    <tr
                      key={p.id}
                      className={`border-b cursor-pointer hover:bg-teal-50 ${selected?.id===p.id ? 'bg-teal-50' : ''}`}
                      onClick={()=>setSelected(p)}
                    >
                      <td className="px-3 py-2 font-medium">{p.sku}</td>
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2 text-right text-slate-500">Stock: {p.stock ?? 0}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td className="px-3 py-2 text-slate-500">Sin resultados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {selected && (
              <p className="text-xs text-slate-600 mt-2">
                Seleccionado: <strong>{selected.sku}</strong> — {selected.name} (Stock: {selected.stock ?? 0})
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Cantidad</label>
              <input className="input" type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Referencia (opcional)</label>
              <input
                className="input"
                value={reference}
                onChange={e=>setReference(e.target.value)}
                placeholder="COMPRA:0001, MERMA, etc."
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Nota (opcional)</label>
            <input className="input" value={note} onChange={e=>setNote(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
            <button disabled={loading} type="submit" className="btn-primary">
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>

      <BarcodeScanner
        open={scanOpen}
        title="Escanear producto"
        onScan={pickByCode}
        onClose={() => setScanOpen(false)}
      />
    </div>
  );
}
