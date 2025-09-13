// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Project from "./pages/ProjectPage";
import Protegido from "./components/auth/Protegido";
import Home from "./pages/Home"; 
import { useEffect, useState } from "react";
import { api } from "./services/api";

type Todo = { id: number; title: string; done: boolean };

export default function App() {
  const [health, setHealth] = useState<string>("cargando...");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const h = await api.health();
        setHealth(h.ok ? `OK (${h.env})` : "KO");
        setTodos(await api.listTodos());
      } catch (e) {
        setHealth(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  const add = async () => {
    if (!title.trim()) return;
    const t = await api.createTodo(title.trim());
    setTodos(prev => [...prev, t]);
    setTitle("");
  };

  return (

    
  
    
    <BrowserRouter>
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Vite + React + API</h1>
      <p className="mb-4">Estado API: {health}</p>

      <div className="flex gap-2 mb-4">
        <input
          className="border rounded px-3 py-2"
          placeholder="Nuevo todo…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="bg-black text-white rounded px-3 py-2" onClick={add}>
          Añadir
        </button>
      </div>

      <ul className="space-y-2">
        {todos.map(t => (
          <li key={t.id} className="border rounded px-3 py-2 flex justify-between">
            <span>{t.title}</span>
            <span className="text-xs">{t.done ? "✅" : "⏳"}</span>
          </li>
        ))}
      </ul>
    </div>
     
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
