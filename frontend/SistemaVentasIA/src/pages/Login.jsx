import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import AuthLayout from "../components/layouts/AuthLayout";

export default function Login() {
  const nav = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      nav("/admin/dashboard");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={onSubmit} className="w-full max-w-sm card">
        <h1 className="page-title text-xl mb-1">Iniciar sesión</h1>
        <p className="page-subtitle mb-5">Accede a tu inventario Zuria</p>

        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

        <label className="text-sm mb-1 block font-medium">Email</label>
        <input
          className="input mb-3"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="text-sm mb-1 block font-medium">Contraseña</label>
        <input
          className="input mb-5"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button disabled={loading} className="btn-primary w-full">
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </AuthLayout>
  );
}
