import { NavLink } from "react-router-dom";
import {
  LuHouse,
  LuPackage,
  LuZap,
  LuArrowLeftRight,
  LuMenu,
} from "react-icons/lu";

const TABS = [
  { to: "/admin/dashboard", label: "Inicio", icon: LuHouse },
  { to: "/admin/rapido", label: "Rápido", icon: LuZap },
  { to: "/admin/products", label: "Productos", icon: LuPackage },
  { to: "/admin/stock-moves", label: "Histórico", icon: LuArrowLeftRight },
];

export default function MobileTabBar({ onOpenMenu }) {
  return (
    <nav className="mobile-tabbar" aria-label="Navegación principal">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `mobile-tab ${isActive ? "is-active" : ""}`
          }
        >
          <tab.icon className="mobile-tab-icon" />
          <span>{tab.label}</span>
        </NavLink>
      ))}
      <button type="button" className="mobile-tab" onClick={onOpenMenu}>
        <LuMenu className="mobile-tab-icon" />
        <span>Más</span>
      </button>
    </nav>
  );
}
