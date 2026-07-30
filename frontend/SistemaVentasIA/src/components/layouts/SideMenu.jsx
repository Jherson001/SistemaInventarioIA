import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SIDE_MENU_DATA } from "../../utils/data";
import useAuth from "../../hooks/useAuth";

const SideMenu = ({ activeMenu, onNavigate }) => {
  const { user, logout } = useAuth();
  const [sideMenuData, setSideMenuData] = useState([]);
  const navigate = useNavigate();

  const handleClick = (route) => {
    if (route === "logout") {
      localStorage.clear();
      logout();
      onNavigate?.();
      navigate("/login");
      return;
    }
    onNavigate?.();
    navigate(route);
  };

  useEffect(() => {
    if (user) setSideMenuData(SIDE_MENU_DATA);
  }, [user]);

  const displayName = user?.full_name || user?.name || "Usuario";
  const isAdmin = (user?.roles || []).includes("admin") || user?.role === "admin";

  return (
    <aside className="w-full lg:w-64 h-full lg:min-h-[calc(100vh-64px)] lg:sticky lg:top-16 z-20 flex flex-col bg-[var(--color-sidebar)] text-white">
      <div className="px-4 pt-5 pb-4 border-b border-white/10">
        <p className="brand-font text-xl tracking-tight">Inventario</p>
        <p className="text-xs text-slate-300 mt-0.5">Control de stock</p>
        <div className="mt-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
          <p className="text-sm font-semibold truncate">{displayName}</p>
          <p className="text-[11px] text-slate-400 truncate">{user?.email || ""}</p>
          {isAdmin && (
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide bg-teal-500/20 text-teal-200 px-2 py-0.5 rounded">
              Admin
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto">
        {sideMenuData.map((item) => {
          const active = activeMenu === item.label;
          const isLogout = item.path === "logout";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.path)}
              className={`w-full flex items-center gap-3 text-[14px] font-medium rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${
                isLogout
                  ? "text-slate-300 hover:bg-red-500/15 hover:text-red-200 mt-4"
                  : active
                    ? "bg-teal-500/20 text-white border border-teal-400/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="text-lg shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default SideMenu;
