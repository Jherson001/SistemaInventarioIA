import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import useApi from "../../hooks/useApi";
import moment from "moment";
import "moment/locale/es";
import { LuPackage, LuTriangleAlert, LuBoxes, LuCircleX } from "react-icons/lu";

moment.locale("es");

const MOVE_LABEL = {
  IN: "Entrada",
  OUT: "Salida",
  ADJUST: "Ajuste",
};

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
        setMoves(
          Array.isArray(stockMoves)
            ? stockMoves.slice(0, 8)
            : stockMoves?.rows?.slice(0, 8) || []
        );
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
        .slice(0, 8),
    [products]
  );

  const StatCard = ({ title, value, subtext, icon, tone }) => (
    <div className="card flex items-center gap-2.5 sm:gap-4 !p-3 sm:!p-[1.25rem]">
      <div className={`p-2.5 sm:p-3.5 rounded-xl text-white text-base sm:text-xl shrink-0 ${tone}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-xs sm:text-sm font-medium truncate">{title}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{value}</h3>
        {subtext && <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <DashboardLayout activeMenu="Inicio">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="page-title">Panel de inventario</h2>
            <p className="page-subtitle capitalize">
              {moment().format("dddd D [de] MMMM")}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Link to="/admin/products" className="btn-primary w-full sm:w-auto">
              Productos
            </Link>
            <Link to="/admin/stock-moves" className="btn-accent w-full sm:w-auto">
              Movimiento
            </Link>
          </div>
        </div>

        <div className="card !py-2.5 text-xs sm:text-sm text-slate-600">
          <strong className="text-slate-800">Alertas:</strong> si la cantidad es ≤ al
          mínimo → <strong>bajo</strong>; si llega a 0 → <strong>sin existencias</strong>.
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando inventario...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4">
              <StatCard
                title="Productos activos"
                value={metrics.total}
                subtext="En catálogo"
                icon={<LuPackage />}
                tone="bg-teal-700"
              />
              <StatCard
                title="Existencias OK"
                value={metrics.ok}
                subtext="Por encima del mínimo"
                icon={<LuBoxes />}
                tone="bg-[var(--color-sidebar)]"
              />
              <StatCard
                title="Existencias bajas"
                value={metrics.low}
                subtext="En o bajo el mínimo"
                icon={<LuTriangleAlert />}
                tone="bg-amber-600"
              />
              <StatCard
                title="Sin existencias"
                value={metrics.out}
                subtext="Reponer cuanto antes"
                icon={<LuCircleX />}
                tone="bg-red-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-800">Alertas de existencias</h3>
                  <Link to="/admin/products" className="text-sm text-teal-700 font-semibold">
                    Ir a productos
                  </Link>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Productos en 0 o por debajo de su mínimo.
                </p>
                {lowList.length === 0 ? (
                  <p className="text-sm text-slate-400">Todo está en buen nivel.</p>
                ) : (
                  <>
                    <div className="mobile-list md:hidden">
                      {lowList.map((p) => {
                        const s = Number(p.stock ?? 0);
                        const sin = s <= 0;
                        return (
                          <div key={p.id} className="mobile-item !p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{p.name}</p>
                                <p className="text-xs text-slate-400">{p.sku}</p>
                              </div>
                              <span className={`badge shrink-0 ${sin ? "badge-out" : "badge-low"}`}>
                                {sin ? "Sin stock" : "Bajo"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              Hay <strong>{s}</strong> · Mín. {p.min_stock ?? 0}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="table-scroll hidden md:block">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Hay</th>
                            <th>Mínimo</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lowList.map((p) => {
                            const s = Number(p.stock ?? 0);
                            const sin = s <= 0;
                            return (
                              <tr key={p.id}>
                                <td>
                                  <div className="font-medium">{p.name}</div>
                                  <div className="text-xs text-slate-400">{p.sku}</div>
                                </td>
                                <td className="font-semibold">{s}</td>
                                <td>{p.min_stock ?? 0}</td>
                                <td>
                                  <span className={`badge ${sin ? "badge-out" : "badge-low"}`}>
                                    {sin ? "Sin existencias" : "Bajo"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
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
                  <>
                    <div className="mobile-list md:hidden">
                      {moves.map((m) => (
                        <div key={m.id} className="mobile-item !p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span
                              className={`badge ${
                                m.move_type === "IN"
                                  ? "badge-ok"
                                  : m.move_type === "OUT"
                                    ? "badge-out"
                                    : "badge-low"
                              }`}
                            >
                              {MOVE_LABEL[m.move_type] || m.move_type}
                            </span>
                            <p className="font-medium text-sm mt-1 truncate">
                              {m.name || m.sku || "—"}
                            </p>
                          </div>
                          <span className="font-semibold shrink-0">{m.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="table-scroll hidden md:block">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Producto</th>
                            <th className="!text-right">Cant.</th>
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
                                  {MOVE_LABEL[m.move_type] || m.move_type}
                                </span>
                              </td>
                              <td>
                                <div className="font-medium">{m.name || m.sku || "—"}</div>
                                {m.name && m.sku ? (
                                  <div className="text-xs text-slate-400">{m.sku}</div>
                                ) : null}
                              </td>
                              <td className="!text-right font-semibold">{m.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
