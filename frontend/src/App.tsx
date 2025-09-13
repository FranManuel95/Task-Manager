import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Páginas/Componentes (sin alias @, tal cual tus rutas)
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Project from "./pages/ProjectPage";
import Protegido from "./components/auth/Protegido";
import Home from "./pages/Home";

import { api } from "./services/api";

type Todo = { id: number; title: string; done: boolean };

export default function App() {
  

  return (
    <BrowserRouter>

      {/* Tus rutas reales */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Protegido />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/proyecto/:id" element={<Project />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
