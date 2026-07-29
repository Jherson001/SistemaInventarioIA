import {
  LuLayoutDashboard,
  LuLogOut,
  LuPackage,
  LuTags,
  LuArrowLeftRight,
  LuChartNoAxesCombined,
  LuTriangleAlert,
} from "react-icons/lu";

export const SIDE_MENU_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/admin/dashboard",
  },
  {
    id: "02",
    label: "Productos",
    icon: LuPackage,
    path: "/admin/products",
  },
  {
    id: "03",
    label: "Movimiento Stock",
    icon: LuArrowLeftRight,
    path: "/admin/stock-moves",
  },
  {
    id: "04",
    label: "Categorías",
    icon: LuTags,
    path: "/admin/categorias",
  },
  {
    id: "05",
    label: "Insights",
    icon: LuChartNoAxesCombined,
    path: "/admin/insights",
  },
  {
    id: "06",
    label: "Baja rotación",
    icon: LuTriangleAlert,
    path: "/admin/low-rotation",
  },
  {
    id: "07",
    label: "Salir",
    icon: LuLogOut,
    path: "logout",
  },
];
