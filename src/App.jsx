import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Project from "./pages/Project";
import { useAuthStore } from "./store/authStore";

function RutasProtegidas({ children }) {
  const usuario = useAuthStore((state) => state.usuario);
  return usuario ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <RutasProtegidas>
              <Dashboard />
            </RutasProtegidas>
          }
        />
        <Route
          path="/proyecto/:id"
          element={
            <RutasProtegidas>
              <Project />
            </RutasProtegidas>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

