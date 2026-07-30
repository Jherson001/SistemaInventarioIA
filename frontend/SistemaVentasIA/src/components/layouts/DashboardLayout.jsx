import { useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import NavBar from "./NavBar";
import SideMenu from "./SideMenu";
import MobileTabBar from "./MobileTabBar";

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [activeMenu]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <NavBar activeMenu={activeMenu} onOpenMenu={() => setMenuOpen(true)} />

      {user && (
        <>
          <div className="flex">
            <div className="only-desktop">
              <SideMenu activeMenu={activeMenu} />
            </div>
            <main className="app-main grow w-full min-w-0">{children}</main>
          </div>

          <MobileTabBar onOpenMenu={() => setMenuOpen(true)} />

          {menuOpen && (
            <div className="mobile-drawer-root only-mobile-flex">
              <button
                type="button"
                className="mobile-drawer-backdrop"
                aria-label="Cerrar menú"
                onClick={() => setMenuOpen(false)}
              />
              <div className="mobile-drawer-panel">
                <SideMenu
                  activeMenu={activeMenu}
                  onNavigate={() => setMenuOpen(false)}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardLayout;
