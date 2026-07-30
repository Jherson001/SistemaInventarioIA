import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";

const NavBar = ({ activeMenu, onOpenMenu }) => {
  return (
    <header className="app-navbar">
      <button
        type="button"
        className="only-mobile-flex app-navbar-menu-btn"
        aria-label="Abrir menú"
        onClick={onOpenMenu}
      >
        <HiOutlineMenu className="text-xl" />
      </button>

      <div className="flex items-baseline gap-2 min-w-0">
        <h1 className="brand-font app-navbar-title truncate">Zuria</h1>
        <span className="only-desktop text-xs text-slate-300 tracking-wide uppercase shrink-0">
          Inventario · {activeMenu || ""}
        </span>
      </div>

      {/* Espaciador para centrar título en móvil */}
      <span className="only-mobile-flex w-8" aria-hidden />
    </header>
  );
};

export default NavBar;
