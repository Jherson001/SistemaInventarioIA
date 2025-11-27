// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute"; // ajusta la ruta si la colocaste en otro lugar
import Login from "./pages/Login";
import Products from "./pages/Admin/Products";
import Categories from "./pages/Admin/Categories";
import Customers from "./pages/Admin/Customers";
import Dashboard from "./pages/Admin/Dashboard";
import POS from "./pages/Admin/POS";
import Sales from "./pages/Admin/Sales";
import SaleDetail from "./pages/Admin/SaleDetail";
import StockMoves from "./pages/Admin/StockMoves";
import LowRotationPage from "./pages/LowRotationPage";
import Insights from "./pages/Admin/Insights";


const App = () => {
  return (
      <div>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
            <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/insights" element={<Insights />} />
            <Route path="/admin/pos" element={<POS />} />
            <Route path="/admin/stock-moves" element={<StockMoves />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/categorias" element={<Categories />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/sales" element={<Sales />} />
            <Route path="/admin/sales/:id" element={<SaleDetail />} />
            <Route path="/admin/low-rotation" element={<LowRotationPage />} />
          </Route>

          {/* Catch-all: redirige al login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>

  );
};

export default App;
