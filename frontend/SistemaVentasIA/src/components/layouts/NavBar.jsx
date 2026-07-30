import { useEffect, useState } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import SideMenu from "./SideMenu";

const NavBar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);

  useEffect(() => {
    setOpenSideMenu(false);
  }, [activeMenu]);

  useEffect(() => {
    if (!openSideMenu) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openSideMenu]);

  return (
    <header className="flex items-center gap-3 bg-[var(--color-sidebar)] text-white border-b border-white/10 py-3 px-3 sm:px-5 sticky top-0 z-30">
      <button
        type="button"
        className="block lg:hidden text-white p-1 -ml-1"
        aria-label={openSideMenu ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpenSideMenu(!openSideMenu)}
      >
        {openSideMenu ? <HiOutlineX className="text-2xl" /> : <HiOutlineMenu className="text-2xl" />}
      </button>

      <div className="flex items-baseline gap-2 min-w-0">
        <h1 className="brand-font text-lg sm:text-xl md:text-2xl leading-none truncate">
          <span className="sm:hidden">Zuria</span>
          <span className="hidden sm:inline">Minimarket Zuria</span>
        </h1>
        <span className="hidden sm:inline text-xs text-slate-300 tracking-wide uppercase shrink-0">
          Inventario
        </span>
      </div>

      {openSideMenu && (
        <div className="fixed inset-0 top-[52px] lg:hidden z-40">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Cerrar menú"
            onClick={() => setOpenSideMenu(false)}
          />
          <div className="relative h-full w-[min(18rem,86vw)] shadow-2xl">
            <SideMenu activeMenu={activeMenu} onNavigate={() => setOpenSideMenu(false)} />
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
