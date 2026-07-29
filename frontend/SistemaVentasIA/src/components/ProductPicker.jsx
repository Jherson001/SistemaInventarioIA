import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useApi from "../hooks/useApi";
import BarcodeScanner from "./BarcodeScanner";

export default function ProductPicker({ onAdd }) {
  const api = useApi();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const inputRef = useRef(null);
  const lastScanRef = useRef({ code: "", at: 0 });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get("/products");
        setRows(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows.slice(0, 20);
    return rows
      .filter(
        (r) =>
          r.sku?.toLowerCase().includes(s) ||
          r.name?.toLowerCase().includes(s) ||
          r.barcode?.toLowerCase().includes(s)
      )
      .slice(0, 20);
  }, [rows, q]);

  const add = useCallback(
    (p) => {
      onAdd({
        product_id: p.id,
        sku: p.sku,
        name: p.name,
        stock: p.stock ?? 0,
        unit_price: Number(p.price || 0),
        unit_cost: Number(p.cost || 0),
        quantity: 1,
        discount: 0,
        tax_rate_applied: 0.18,
      });
      setMsg(`Agregado: ${p.name}`);
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [onAdd]
  );

  const resolveCode = useCallback(
    async (rawCode) => {
      const code = String(rawCode || "").trim();
      if (!code) return;

      const now = Date.now();
      if (lastScanRef.current.code === code && now - lastScanRef.current.at < 1200) {
        return; // evita doble lectura del mismo código
      }
      lastScanRef.current = { code, at: now };

      setLookingUp(true);
      setErr("");
      setMsg("");
      try {
        const local = rows.find(
          (r) => r.barcode === code || r.sku === code
        );
        if (local) {
          add(local);
          return;
        }

        const product = await api.get(`/products/barcode/${encodeURIComponent(code)}`);
        add(product);
        setRows((prev) => (prev.some((p) => p.id === product.id) ? prev : [product, ...prev]));
      } catch (e) {
        setErr(e.message || "Producto no encontrado");
      } finally {
        setLookingUp(false);
      }
    },
    [api, rows, add]
  );

  const onKeyDown = (e) => {
    // Escáner USB envía Enter al final
    if (e.key === "Enter") {
      e.preventDefault();
      resolveCode(q);
    }
  };

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          ref={inputRef}
          className="input w-full"
          placeholder="Escanear código (USB) o buscar por SKU / nombre..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
        />
        <button
          type="button"
          className="btn-primary whitespace-nowrap shrink-0"
          onClick={() => setScanOpen(true)}
          disabled={lookingUp}
        >
          {lookingUp ? "Buscando..." : "Escanear"}
        </button>
      </div>

      {msg && <p className="text-green-700 text-sm mt-2">{msg}</p>}
      {err && <p className="text-red-600 text-sm mt-2">{err}</p>}

      {loading ? (
        <p className="mt-3">Cargando...</p>
      ) : (
        <div className="mt-3 max-h-64 overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-3 py-2">SKU</th>
                <th className="text-left px-3 py-2">Nombre</th>
                <th className="text-right px-3 py-2">Precio</th>
                <th className="text-right px-3 py-2">Stock</th>
                <th className="text-right px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{p.sku}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 text-right">S/ {Number(p.price).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{p.stock ?? 0}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" className="btn-primary" onClick={() => add(p)}>
                      + Agregar
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-3 py-3 text-center text-gray-500">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <BarcodeScanner
        open={scanOpen}
        title="Escanear producto para vender"
        onScan={resolveCode}
        onClose={() => setScanOpen(false)}
      />
    </div>
  );
}
