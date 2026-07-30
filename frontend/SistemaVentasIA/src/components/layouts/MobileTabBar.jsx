import { NavLink } from "react-router-dom";
import {
  LuHouse,
  LuPackage,
  LuArrowLeftRight,
  LuTags,
  LuMenu,
} from "react-icons/lu";

const TABS = [
  { to: "/admin/dashboard", label: "Inicio", icon: LuHouse },
  { to: "/admin/products", label: "Productos", icon: LuPackage },
  { to: "/admin/stock-moves", label: "Stock", icon: LuArrowLeftRight },
  { to: "/admin/categories", label: "Categorías", icon: LuTags },
];

/**
 * Barra inferior solo en celular/tablet (oculta en desktop con CSS).
 * onOpenMenu abre el drawer con el resto de opciones.
 */
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
