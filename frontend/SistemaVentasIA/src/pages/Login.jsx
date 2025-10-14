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
      <div className="min-h-[60vh] grid place-items-center bg-gray-50">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm bg-white border rounded-xl shadow p-6"
        >
          <h1 className="text-xl font-semibold mb-4">Iniciar sesión</h1>

          {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

          <label className="text-sm mb-1 block">Email</label>
          <input
            className="mb-3 block w-full rounded-lg border border-gray-300 px-3 py-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="text-sm mb-1 block">Contraseña</label>
          <input
            className="mb-4 block w-full rounded-lg border border-gray-300 px-3 py-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-lg
                      bg-blue-600 text-white px-4 py-2 font-medium
                      hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
