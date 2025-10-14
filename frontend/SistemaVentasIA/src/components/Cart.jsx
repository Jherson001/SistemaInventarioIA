import { useMemo } from "react";

export default function Cart({ items, setItems }) {
  const update = (idx, patch) => {
    setItems(list => list.map((it,i) => i===idx ? { ...it, ...patch } : it));
  };
  const remove = (idx) => setItems(list => list.filter((_,i)=> i!==idx));
  const clear  = () => setItems([]);

  const totals = useMemo(() => {
    let subtotal = 0, tax_total = 0, discount_total = 0;
    for (const it of items) {
      const qty = Number(it.quantity || 0);
      const price = Number(it.unit_price || 0);
      const disc = Number(it.discount || 0);
      const taxRate = Number(it.tax_rate_applied ?? 0.18);
      const line_subtotal = price * qty - disc;
      const line_tax = Math.max(line_subtotal, 0) * taxRate;
      subtotal += Math.max(line_subtotal, 0);
      tax_total += line_tax;
      discount_total += Math.max(disc, 0);
    }
    const grand_total = subtotal + tax_total;
    return {
      subtotal: +subtotal.toFixed(2),
      tax_total: +tax_total.toFixed(2),
      discount_total: +discount_total.toFixed(2),
      grand_total: +grand_total.toFixed(2)
    };
  }, [items]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Carrito</h2>
        {items.length > 0 && <button className="btn" onClick={clear}>Vaciar</button>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-3 py-2">SKU</th>
              <th className="text-left px-3 py-2">Producto</th>
              <th className="text-right px-3 py-2">Stock</th>
              <th className="text-right px-3 py-2">Cant.</th>
              <th className="text-right px-3 py-2">Precio</th>
              <th className="text-right px-3 py-2">Desc.</th>
              <th className="text-right px-3 py-2">IGV</th>
              <th className="text-right px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-3 py-2">{it.sku}</td>
                <td className="px-3 py-2">{it.name}</td>
                <td className="px-3 py-2 text-right">{it.stock ?? 0}</td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number" min="1" className="input w-20 text-right"
                    value={it.quantity}
                    onChange={e => update(idx, { quantity: Math.max(1, Number(e.target.value)) })}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number" step="0.01" min="0" className="input w-24 text-right"
                    value={it.unit_price}
                    onChange={e => update(idx, { unit_price: Math.max(0, Number(e.target.value)) })}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number" step="0.01" min="0" className="input w-24 text-right"
                    value={it.discount}
                    onChange={e => update(idx, { discount: Math.max(0, Number(e.target.value)) })}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <select
                    className="input w-24 text-right"
                    value={it.tax_rate_applied}
                    onChange={e => update(idx, { tax_rate_applied: Number(e.target.value) })}
                  >
                    <option value={0.18}>18%</option>
                    <option value={0}>0%</option>
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <button className="btn text-red-700 border-red-200" onClick={()=>remove(idx)}>Quitar</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan="8" className="px-3 py-4 text-center text-gray-500">Sin ítems</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <div></div>
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>S/ {totals.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>IGV</span><span>S/ {totals.tax_total.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Descuentos</span><span>S/ {totals.discount_total.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold text-lg mt-2"><span>Total</span><span>S/ {totals.grand_total.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
