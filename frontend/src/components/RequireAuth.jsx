import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from './services/auth.service';

/**
 * Componente envoltorio de protección de rutas.
 * Redirige al login si el usuario no ha iniciado sesión.
 */
const RequireAuth = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Redirige a /login y guarda la ubicación actual a la que intentaba ir
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
