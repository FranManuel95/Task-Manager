import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Project from "./pages/Project";
import Protegido from "./components/Protegido";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas protegidas */}
        <Route element={<Protegido />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/proyecto/:id" element={<Project />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
