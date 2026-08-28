import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Menu from './components/Menu';
import Login from './components/Login';
import Registro from './components/Registro';
import RecuperarPassword from './components/RecuperarPassword';
import RestablecerPassword from './components/RestablecerPassword';
import Inicio from './components/Inicio';
import Pacientes from './components/Pacientes';
import FichaPaciente from './components/FichaPaciente';
import Turnos from './components/Turnos';
import GestionObrasSociales from './components/GestionObrasSociales';
import Facturacion from './components/Facturacion';
import RequireAuth from './components/RequireAuth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1081234567890-mockclientid.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        {/* Barra de navegación global */}
        <Menu />
        
        <main className="pb-5">
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar-password" element={<RecuperarPassword />} />
            <Route path="/reset-password/:token" element={<RestablecerPassword />} />

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
            <Route 
              path="/turnos" 
              element={
                <RequireAuth>
                  <Turnos />
                </RequireAuth>
              } 
            />
            <Route 
              path="/obras-sociales" 
              element={
                <RequireAuth>
                  <GestionObrasSociales />
                </RequireAuth>
              } 
            />
            <Route 
              path="/facturacion" 
              element={
                <RequireAuth>
                  <Facturacion />
                </RequireAuth>
              } 
            />

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
