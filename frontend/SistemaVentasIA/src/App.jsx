import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../src/components/ProtectedRoute";
import Login from "../src/pages/Login";
import Products from "../src/pages/Admin/Products";
import Categories from "../src/pages/Admin/Categories";
import Customers from "../src/pages/Admin/Customers";
import Dashboard from "./pages/Admin/Dashboard";
import Insights from "../src/pages/Insights";
import POS from "./pages/Admin/POS";
import Sales from "./pages/Admin/Sales";
import SaleDetail from "./pages/Admin/SaleDetail";
import StockMoves from "./pages/Admin/StockMoves";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Login />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/pos" element={<POS />} />
          <Route path="/admin/stock-moves" element={<StockMoves />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/categorias" element={<Categories />} />
          <Route path="/admin/Customers" element={<Customers />} />
          <Route path="/admin/sales" element={<Sales />} />
          <Route path="/admin/sales/:id" element={<SaleDetail />} />
          {/*<Route path="/admin/insights" element={<Insights />} /> */}
        </Route>

        {/* Catch-all */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;