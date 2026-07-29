import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './components/Menu';
import Login from './components/Login';
import Registro from './components/Registro';
import Inicio from './components/Inicio';
import Pacientes from './components/Pacientes';
import FichaPaciente from './components/FichaPaciente';
import RequireAuth from './components/RequireAuth';

function App() {
  return (
    <BrowserRouter>
      {/* Barra de navegación global. Se adapta automáticamente si el usuario inició sesión */}
      <Menu />
      
      <main className="pb-5">
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas Privadas / Protegidas */}
          <Route 
            path="/" 
            element={
              <RequireAuth>
                <Inicio />
              </RequireAuth>
            } 
          />
          <Route 
            path="/pacientes" 
            element={
              <RequireAuth>
                <Pacientes />
              </RequireAuth>
            } 
          />
          <Route 
            path="/pacientes/:id" 
            element={
              <RequireAuth>
                <FichaPaciente />
              </RequireAuth>
            } 
          />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
