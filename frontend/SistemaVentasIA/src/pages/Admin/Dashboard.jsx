import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import useApi from "../../hooks/useApi";
import moment from "moment";
import "moment/locale/es";
import { LuPackage, LuTriangleAlert, LuBoxes, LuArrowLeftRight } from "react-icons/lu";

export default function Dashboard() {
  const api = useApi();
  const [products, setProducts] = useState([]);
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [prods, stockMoves] = await Promise.all([
          api.get("/products"),
          api.get("/stock-moves").catch(() => []),
        ]);
        setProducts(Array.isArray(prods) ? prods : []);
        setMoves(Array.isArray(stockMoves) ? stockMoves.slice(0, 8) : stockMoves?.rows?.slice(0, 8) || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    const active = products.filter((p) => Number(p.is_active) !== 0);
    const out = active.filter((p) => Number(p.stock ?? 0) <= 0).length;
    const low = active.filter((p) => {
      const stock = Number(p.stock ?? 0);
      const min = Number(p.min_stock ?? 0);
      return stock > 0 && stock <= min;
    }).length;
    const ok = active.length - out - low;
    return { total: active.length, out, low, ok };
  }, [products]);

  const lowList = useMemo(
    () =>
      products
        .filter((p) => Number(p.stock ?? 0) <= Number(p.min_stock ?? 0))
        .sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0))
        .slice(0, 6),
    [products]
  );

  const StatCard = ({ title, value, subtext, icon, tone }) => (
    <div className="card flex items-center gap-4">
      <div className={`p-3.5 rounded-xl text-white text-xl ${tone}`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="page-title">Inventario</h2>
            <p className="page-subtitle capitalize">
              {moment().format("dddd D [de] MMMM, YYYY")}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/products" className="btn-primary">
              Ver productos
            </Link>
            <Link to="/admin/stock-moves" className="btn-accent">
              Movimiento stock
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando inventario...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title="Productos activos"
                value={metrics.total}
                subtext="En catálogo"
                icon={<LuPackage />}
                tone="bg-teal-700"
              />
              <StatCard
                title="Stock OK"
                value={metrics.ok}
                subtext="Por encima del mínimo"
                icon={<LuBoxes />}
                tone="bg-[var(--color-sidebar)]"
              />
              <StatCard
                title="Stock bajo"
                value={metrics.low}
                subtext="En o bajo el mínimo"
                icon={<LuTriangleAlert />}
                tone="bg-amber-600"
              />
              <StatCard
                title="Sin stock"
                value={metrics.out}
                subtext="Reponer cuanto antes"
                icon={<LuArrowLeftRight />}
                tone="bg-red-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card">
                <h3 className="font-bold text-slate-800 mb-4">Alertas de stock</h3>
                {lowList.length === 0 ? (
                  <p className="text-sm text-slate-400">Todo el stock está en buen nivel.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Producto</th>
                        <th>Stock</th>
                        <th>Min</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowList.map((p) => (
                        <tr key={p.id}>
                          <td>{p.sku}</td>
                          <td>{p.name}</td>
                          <td>
                            <span
                              className={`badge ${
                                Number(p.stock ?? 0) <= 0 ? "badge-out" : "badge-low"
                              }`}
                            >
                              {p.stock ?? 0}
                            </span>
                          </td>
                          <td>{p.min_stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800">Últimos movimientos</h3>
                  <Link to="/admin/stock-moves" className="text-sm text-teal-700 font-semibold">
                    Ver todos
                  </Link>
                </div>
                {moves.length === 0 ? (
                  <p className="text-sm text-slate-400">Aún no hay movimientos registrados.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>SKU</th>
                        <th>Cant.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moves.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <span
                              className={`badge ${
                                m.move_type === "IN"
                                  ? "badge-ok"
                                  : m.move_type === "OUT"
                                    ? "badge-out"
                                    : "badge-low"
                              }`}
                            >
                              {m.move_type}
                            </span>
                          </td>
                          <td>{m.sku || "-"}</td>
                          <td>{m.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
