import useAuth from "../../hooks/useAuth";
import NavBar from "./NavBar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <NavBar activeMenu={activeMenu} />

      {user && (
        <div className="flex">
          <div className="hidden lg:block">
            <SideMenu activeMenu={activeMenu} />
          </div>
          <main className="grow px-3 sm:px-4 md:px-6 py-3 sm:py-5 max-w-[1400px] w-full mx-auto min-w-0">
            {children}
          </main>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
