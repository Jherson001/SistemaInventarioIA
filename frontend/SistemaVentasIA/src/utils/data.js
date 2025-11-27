import {
  LuLayoutDashboard,
  LuUsers,
  LuClipboardCheck,
  LuSquarePlus,
  LuLogOut,
} from "react-icons/lu";

import { GoPackage } from "react-icons/go";
import { MdBarChart } from "react-icons/md";

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
    label: "Insights",
    icon: MdBarChart,
    path: "/admin/insights",
  },
  {
    id: "07",
    label: "Categorías",
    icon: GoPackage,
    path: "/admin/categorias",
  },
  {
    id: "08",
    label: "Customers",
    icon: GoPackage,
    path: "/admin/customers",
  },
  {
    id: "09",
    label:"Baja rotación",
    icon: MdBarChart,
    path: "/admin/low-rotation",
  },
  {
  id: "10",
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
    id: "03",
    label: "My Tasks",
    icon: LuClipboardCheck,
    path: "/user/tasks",
  },
  {
    id: "04",
    label: "Logout",
    icon: LuLogOut,
    path: "logout",
  },
];
