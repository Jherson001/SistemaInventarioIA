import { NavLink } from "react-router-dom";
import { LuHouse, LuPackage, LuZap, LuArrowLeftRight, LuMenu } from "react-icons/lu";
import useAuth from "../../hooks/useAuth";
import { isCashierOnly } from "../../utils/roles";

const TABS_FULL = [
  { to: "/admin/dashboard", label: "Inicio", icon: LuHouse },
  { to: "/admin/rapido", label: "Rápido", icon: LuZap },
  { to: "/admin/products", label: "Productos", icon: LuPackage },
  { to: "/admin/stock-moves", label: "Histórico", icon: LuArrowLeftRight },
];

const TABS_CASHIER = [{ to: "/admin/rapido", label: "Rápido", icon: LuZap }];

export default function MobileTabBar({ onOpenMenu }) {
  const { user } = useAuth();
  const tabs = isCashierOnly(user) ? TABS_CASHIER : TABS_FULL;

  return (
    <nav
      className="mobile-tabbar"
      style={
        isCashierOnly(user)
          ? { gridTemplateColumns: "1fr 1fr" }
          : undefined
      }
      aria-label="Navegación principal"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `mobile-tab ${isActive ? "is-active" : ""}`}
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
