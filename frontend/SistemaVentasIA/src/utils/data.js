import {
  LuLayoutDashboard,
  LuUsers,
  LuClipboardCheck,
  LuSquarePlus,
  LuLogOut,
} from "react-icons/lu";

import { GoPackage } from "react-icons/go";

export const SIDE_MENU_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/admin/dashboard",
  },
  {
    id: "02",
    label: "Generar Venta",
    icon: GoPackage,
    path: "/admin/pos",
  },
  {
    id: "03",
    label: "Ventas",
    icon: GoPackage,
    path: "/admin/sales",
  },
  {
    id: "04",
    label: "Movimiento Stock",
    icon: GoPackage,
    path: "/admin/stock-moves",
  },
  {
    id: "05",
    label: "Productos",
    icon: GoPackage,
    path: "/admin/products",
  },
  {
    id: "06",
    label: "Categorías",
    icon: GoPackage,
    path: "/admin/categorias",
  },
  {
    id: "07",
    label: "Customers",
    icon: GoPackage,
    path: "/admin/customers",
  },
  {
    id: "08",
    label: "Logout",
    icon: LuLogOut,
    path: "logout",
  },
];

export const SIDE_MENU_USER_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/user/dashboard",
  },
  {
    id: "02",
    label: "My Tasks",
    icon: LuClipboardCheck,
    path: "/user/tasks",
  },
  {
    id: "03",
    label: "Logout",
    icon: LuLogOut,
    path: "logout",
  },
];
