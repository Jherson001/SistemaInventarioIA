import UI_IMG from "../../assets/images/auth-img.png";

function AuthLayout({ children }) {
  return (
    <div className="flex min-h-[100dvh]">
      <div className="w-full lg:w-[55vw] px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8 pb-8 flex flex-col">
        <div>
          <h2 className="brand-font text-2xl sm:text-3xl text-[var(--color-sidebar)]">Zuria</h2>
          <p className="text-sm text-slate-500 mt-1">Sistema de inventario</p>
        </div>
        <div className="flex-1 flex items-center justify-center lg:justify-start">{children}</div>
      </div>

      <div
        className="hidden lg:flex w-[45vw] min-h-screen items-center justify-center overflow-hidden p-10"
        style={{
          background:
            "linear-gradient(160deg, #0F2744 0%, #163A5F 45%, #0F766E 100%)",
        }}
      >
        <div className="text-center">
          <img src={UI_IMG} alt="" className="w-64 lg:w-[85%] mx-auto drop-shadow-2xl" />
          <p className="text-teal-100/90 mt-8 text-sm max-w-xs mx-auto">
            Controla productos, stock y alertas en un solo lugar.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
