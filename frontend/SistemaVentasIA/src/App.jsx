import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Products from "./pages/Admin/Products";
import Categories from "./pages/Admin/Categories";
import Dashboard from "./pages/Admin/Dashboard";
import StockMoves from "./pages/Admin/StockMoves";
import QuickStock from "./pages/Admin/QuickStock";
import LowRotationPage from "./pages/LowRotationPage";
import Insights from "./pages/Admin/Insights";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/insights" element={<Insights />} />
        <Route path="/admin/stock-moves" element={<StockMoves />} />
        <Route path="/admin/rapido" element={<QuickStock />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/categorias" element={<Categories />} />
        <Route path="/admin/categories" element={<Navigate to="/admin/categorias" replace />} />
        <Route path="/admin/low-rotation" element={<LowRotationPage />} />

        <Route path="/admin/pos" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/sales" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/sales/:id" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/customers" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
