import {
  LuLayoutDashboard,
  LuLogOut,
  LuPackage,
  LuTags,
  LuArrowLeftRight,
  LuChartNoAxesCombined,
  LuTriangleAlert,
  LuZap,
} from "react-icons/lu";

export const SIDE_MENU_DATA = [
  {
    id: "01",
    label: "Inicio",
    icon: LuLayoutDashboard,
    path: "/admin/dashboard",
  },
  {
    id: "02",
    label: "Rápido",
    icon: LuZap,
    path: "/admin/rapido",
  },
  {
    id: "03",
    label: "Productos",
    icon: LuPackage,
    path: "/admin/products",
  },
  {
    id: "04",
    label: "Movimientos",
    icon: LuArrowLeftRight,
    path: "/admin/stock-moves",
  },
  {
    id: "05",
    label: "Categorías",
    icon: LuTags,
    path: "/admin/categorias",
  },
  {
    id: "06",
    label: "Análisis",
    icon: LuChartNoAxesCombined,
    path: "/admin/insights",
  },
  {
    id: "07",
    label: "Baja rotación",
    icon: LuTriangleAlert,
    path: "/admin/low-rotation",
  },
  {
    id: "08",
    label: "Salir",
    icon: LuLogOut,
    path: "logout",
  },
];
