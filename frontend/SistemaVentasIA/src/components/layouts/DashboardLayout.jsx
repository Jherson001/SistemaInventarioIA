import useAuth from "../../hooks/useAuth";
import NavBar from "./NavBar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <NavBar activeMenu={activeMenu} />

      {user && (
        <div className="flex">
          <div className="hidden lg:block">
            <SideMenu activeMenu={activeMenu} />
          </div>
          <main className="grow px-4 md:px-6 py-5 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
