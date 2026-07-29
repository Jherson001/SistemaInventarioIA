import { useState } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import SideMenu from "./SideMenu";

const NavBar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);

  return (
    <header className="flex items-center gap-4 bg-[var(--color-sidebar)] text-white border-b border-white/10 py-3.5 px-5 sticky top-0 z-30">
      <button
        type="button"
        className="block lg:hidden text-white"
        onClick={() => setOpenSideMenu(!openSideMenu)}
      >
        {openSideMenu ? <HiOutlineX className="text-2xl" /> : <HiOutlineMenu className="text-2xl" />}
      </button>

      <div className="flex items-baseline gap-3">
        <h1 className="brand-font text-xl md:text-2xl leading-none">Minimarket Zuria</h1>
        <span className="hidden sm:inline text-xs text-slate-300 tracking-wide uppercase">
          Inventario
        </span>
      </div>

      {openSideMenu && (
        <div className="fixed top-16 left-0 lg:hidden z-40 shadow-2xl">
          <SideMenu activeMenu={activeMenu} />
        </div>
      )}
    </header>
  );
};

export default NavBar;
