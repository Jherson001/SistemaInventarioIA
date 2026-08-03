import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import BarcodeScanner from "../../components/BarcodeScanner";
import useApi from "../../hooks/useApi";

/**
 * Pantalla para personal flojo / PC en mostrador:
 * escanear o buscar → Entrada/Salida con 1 clic (cantidad 1 por defecto).
 */
export default function QuickStock() {
  const api = useApi();
  const inputRef = useRef(null);

  const [mode, setMode] = useState("OUT"); // OUT | IN
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [recent, setRecent] = useState([]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/products?include_inactive=0");
      setProducts(Array.isArray(data) ? data.filter((p) => Number(p.is_active) !== 0) : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [api]);

  useEffect(() => {
    loadProducts();
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return products
      .filter(
        (p) =>
          p.sku?.toLowerCase().includes(s) ||
          p.name?.toLowerCase().includes(s) ||
          p.barcode?.toLowerCase().includes(s)
      )
      .slice(0, 12);
  }, [q, products]);

  const findByCode = (code) => {
    const c = String(code || "").trim();
    if (!c) return null;
    return (
      products.find((p) => p.barcode === c || p.sku === c) ||
      products.find(
        (p) =>
          String(p.barcode || "").toLowerCase() === c.toLowerCase() ||
          String(p.sku || "").toLowerCase() === c.toLowerCase()
      )
    );
  };

  const register = async (product, overrideQty) => {
    if (!product) return;
    const n = Number(overrideQty ?? qty) || 1;
    if (n <= 0) {
      setErr("Cantidad inválida");
      return;
    }

    setSaving(true);
    setErr("");
    setOkMsg("");
    try {
      await api.post("/stock-moves", {
        product_id: product.id,
        move_type: mode,
        quantity: n,
        reference: "rapido",
        note: mode === "OUT" ? "Salida rápida" : "Entrada rápida",
      });

      const stockBefore = Number(product.stock ?? 0);
      const stockAfter = mode === "OUT" ? stockBefore - n : stockBefore + n;

      setOkMsg(
        `${mode === "OUT" ? "Salida" : "Entrada"}: ${product.name} × ${n}` +
          (stockAfter < 0 ? " (stock quedó negativo: cuenta luego)" : ` · Quedan ~${stockAfter}`)
      );

      setRecent((prev) => [
        {
          id: `${Date.now()}-${product.id}`,
          name: product.name,
          sku: product.sku,
          qty: n,
          mode,
          at: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev,
      ].slice(0, 15));

      // refresca stock local
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, stock: stockAfter } : p
        )
      );

      setQ("");
      setQty(1);
      setTimeout(() => inputRef.current?.focus(), 30);
    } catch (e) {
      setErr(e.message || "No se pudo registrar");
    } finally {
      setSaving(false);
    }
  };

  const onSubmitSearch = async (e) => {
    e.preventDefault();
    const code = q.trim();
    if (!code) return;
    const found = findByCode(code);
    if (found) {
      await register(found);
      return;
    }
    if (matches.length === 1) {
      await register(matches[0]);
      return;
    }
    setErr(
      matches.length === 0
        ? `No hay producto con "${code}"`
        : "Hay varios resultados: toca uno de la lista"
    );
  };

  const onScan = async (code) => {
    setScanOpen(false);
    const found = findByCode(code);
    if (!found) {
      setErr(`Código no encontrado: ${code}`);
      setQ(code);
      return;
    }
    setQ(found.sku || code);
    await register(found);
  };

  return (
    <DashboardLayout activeMenu="Rápido">
      <div className="space-y-4 max-w-2xl mx-auto">
        <div>
          <h1 className="page-title">Entrada / Salida rápida</h1>
          <p className="page-subtitle">
            Usa el <strong>escáner USB</strong> de la tienda (clic en la caja y dispara) o la cámara del celular.
            Cobrar sigue en el POS de Sunat.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`btn !py-3 !text-base ${
              mode === "OUT" ? "!bg-red-600 !text-white !border-red-600" : ""
            }`}
            onClick={() => {
              setMode("OUT");
              setErr("");
              setOkMsg("");
              inputRef.current?.focus();
            }}
          >
            − Salida
          </button>
          <button
            type="button"
            className={`btn !py-3 !text-base ${
              mode === "IN" ? "!bg-teal-700 !text-white !border-teal-700" : ""
            }`}
            onClick={() => {
              setMode("IN");
              setErr("");
              setOkMsg("");
              inputRef.current?.focus();
            }}
          >
            + Entrada
          </button>
        </div>

        <form onSubmit={onSubmitSearch} className="card space-y-3">
          <label className="text-sm font-semibold">
            {mode === "OUT" ? "Producto que sale" : "Producto que entra"}
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="input !text-lg !py-3"
              placeholder="Apunta el escáner aquí o escribe el código…"
              value={q}
              disabled={saving || loading}
              onChange={(e) => {
                setQ(e.target.value);
                setErr("");
              }}
              autoComplete="off"
              autoFocus
            />
            <button
              type="button"
              className="btn shrink-0"
              onClick={() => setScanOpen(true)}
              disabled={saving}
              title="Solo si no tienes escáner USB"
            >
              Cámara
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium shrink-0">Cantidad</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn !px-3"
                onClick={() => setQty((n) => Math.max(1, Number(n) - 1))}
              >
                −
              </button>
              <input
                className="input !w-20 !text-center"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
              <button
                type="button"
                className="btn !px-3"
                onClick={() => setQty((n) => Number(n) + 1)}
              >
                +
              </button>
            </div>
            <button type="submit" className="btn-primary ml-auto" disabled={saving || !q.trim()}>
              {saving ? "…" : mode === "OUT" ? "Registrar salida" : "Registrar entrada"}
            </button>
          </div>

          {err && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {err}
            </p>
          )}
          {okMsg && (
            <p className="text-sm text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
              {okMsg}
            </p>
          )}
        </form>

        {matches.length > 0 && (
          <div className="card !p-0 overflow-hidden">
            <p className="px-3 py-2 text-xs font-semibold text-slate-500 border-b">
              Toca un producto
            </p>
            <ul>
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-3 border-b hover:bg-teal-50 flex justify-between gap-2 disabled:opacity-50"
                    disabled={saving}
                    onClick={() => register(p)}
                  >
                    <span className="min-w-0">
                      <span className="font-semibold block truncate">{p.name}</span>
                      <span className="text-xs text-slate-500">
                        {p.sku}
                        {p.barcode ? ` · ${p.barcode}` : ""}
                      </span>
                    </span>
                    <span className="text-sm text-slate-600 shrink-0">Hay {p.stock ?? 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card">
          <h2 className="font-bold text-slate-800 mb-2">Últimos en esta sesión</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400">Aún no hay registros aquí.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="flex justify-between gap-2 text-sm border-b border-slate-100 pb-2"
                >
                  <span className="min-w-0">
                    <span
                      className={`badge mr-1 ${r.mode === "OUT" ? "badge-out" : "badge-ok"}`}
                    >
                      {r.mode === "OUT" ? "Salida" : "Entrada"}
                    </span>
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-slate-400 block">{r.sku}</span>
                  </span>
                  <span className="shrink-0 font-semibold">
                    ×{r.qty} · {r.at}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <BarcodeScanner
        open={scanOpen}
        onScan={onScan}
        onClose={() => setScanOpen(false)}
        title={mode === "OUT" ? "Escanear salida" : "Escanear entrada"}
      />
    </DashboardLayout>
  );
}
