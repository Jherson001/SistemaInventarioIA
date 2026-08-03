import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Products from "./pages/Admin/Products";
import Categories from "./pages/Admin/Categories";
import Dashboard from "./pages/Admin/Dashboard";
import StockMoves from "./pages/Admin/StockMoves";
import QuickStock from "./pages/Admin/QuickStock";
import Users from "./pages/Admin/Users";
import LowRotationPage from "./pages/LowRotationPage";
import Insights from "./pages/Admin/Insights";
import useAuth from "./hooks/useAuth";
import { homePathForUser, isCashierOnly } from "./utils/roles";

function CashierHome() {
  const { user } = useAuth();
  return <Navigate to={homePathForUser(user)} replace />;
}

function ManagerOnly({ children }) {
  const { user } = useAuth();
  if (isCashierOnly(user)) return <Navigate to="/admin/rapido" replace />;
  return children;
}

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<CashierHome />} />
        <Route
          path="/admin/dashboard"
          element={
            <ManagerOnly>
              <Dashboard />
            </ManagerOnly>
          }
        />
        <Route
          path="/admin/insights"
          element={
            <ManagerOnly>
              <Insights />
            </ManagerOnly>
          }
        />
        <Route
          path="/admin/stock-moves"
          element={
            <ManagerOnly>
              <StockMoves />
            </ManagerOnly>
          }
        />
        <Route path="/admin/rapido" element={<QuickStock />} />
        <Route
          path="/admin/products"
          element={
            <ManagerOnly>
              <Products />
            </ManagerOnly>
          }
        />
        <Route
          path="/admin/categorias"
          element={
            <ManagerOnly>
              <Categories />
            </ManagerOnly>
          }
        />
        <Route path="/admin/categories" element={<Navigate to="/admin/categorias" replace />} />
        <Route
          path="/admin/low-rotation"
          element={
            <ManagerOnly>
              <LowRotationPage />
            </ManagerOnly>
          }
        />
        <Route path="/admin/users" element={<Users />} />

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
