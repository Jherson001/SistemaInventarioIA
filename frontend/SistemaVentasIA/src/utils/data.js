import {
  LuLayoutDashboard,
  LuLogOut,
  LuPackage,
  LuTags,
  LuArrowLeftRight,
  LuChartNoAxesCombined,
  LuTriangleAlert,
  LuZap,
  LuUsers,
} from "react-icons/lu";

/** roles: quién ve el ítem. Sin roles = todos los autenticados */
export const SIDE_MENU_DATA = [
  {
    id: "01",
    label: "Inicio",
    icon: LuLayoutDashboard,
    path: "/admin/dashboard",
    roles: ["admin", "manager"],
  },
  {
    id: "02",
    label: "Rápido",
    icon: LuZap,
    path: "/admin/rapido",
    roles: ["admin", "manager", "cashier"],
  },
  {
    id: "03",
    label: "Productos",
    icon: LuPackage,
    path: "/admin/products",
    roles: ["admin", "manager"],
  },
  {
    id: "04",
    label: "Movimientos",
    icon: LuArrowLeftRight,
    path: "/admin/stock-moves",
    roles: ["admin", "manager"],
  },
  {
    id: "05",
    label: "Categorías",
    icon: LuTags,
    path: "/admin/categorias",
    roles: ["admin", "manager"],
  },
  {
    id: "06",
    label: "Análisis",
    icon: LuChartNoAxesCombined,
    path: "/admin/insights",
    roles: ["admin", "manager"],
  },
  {
    id: "07",
    label: "Baja rotación",
    icon: LuTriangleAlert,
    path: "/admin/low-rotation",
    roles: ["admin", "manager"],
  },
  {
    id: "08",
    label: "Usuarios",
    icon: LuUsers,
    path: "/admin/users",
    roles: ["admin"],
  },
  {
    id: "09",
    label: "Salir",
    icon: LuLogOut,
    path: "logout",
  },
];
