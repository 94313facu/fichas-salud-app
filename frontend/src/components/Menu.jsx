import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from './services/auth.service';

const Menu = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-dark navbar-custom navbar-expand-lg px-3 mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <i className="bi bi-file-earmark-medical-fill me-2 fs-4 text-accent"></i>
          <span>Fichas de Salud</span>
        </Link>
        
        {isAuthenticated && user && (
          <div className="d-flex align-items-center gap-3 ms-auto">
            <span className="text-white d-none d-sm-inline">
              Hola, <strong>{user.nombre}</strong>
            </span>
            <button 
              className="btn btn-sm btn-outline-light px-3 py-1 d-flex align-items-center" 
              onClick={handleLogout}
              style={{ height: '36px', fontSize: '0.95rem' }}
            >
              <i className="bi bi-box-arrow-right me-1"></i> Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Menu;
