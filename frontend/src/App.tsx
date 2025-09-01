// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Project from "./pages/ProjectPage";
import Protegido from "./components/auth/Protegido";
import Home from "./pages/Home"; 
import Todos from './components/Todos';

export default function App() {
  return (
   
    <BrowserRouter>
     <Todos />
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
