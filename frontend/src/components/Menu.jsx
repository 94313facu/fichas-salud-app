import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import authService from './services/auth.service';

const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleLogout = () => {
    authService.logout();
    setShowConfirmLogout(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="navbar navbar-dark navbar-custom navbar-expand-lg px-3 mb-4">
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <i className="bi bi-file-earmark-medical-fill me-2 fs-4 text-accent"></i>
            <span>Fichas de Salud</span>
          </Link>

          {isAuthenticated && user && (
            <>
              <button
                className="navbar-toggler border-0"
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>

              <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`}>
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/') ? 'active fw-bold' : ''}`} to="/" onClick={() => setMenuOpen(false)}>
                      <i className="bi bi-house-door me-1"></i>Inicio
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/pacientes') ? 'active fw-bold' : ''}`} to="/pacientes" onClick={() => setMenuOpen(false)}>
                      <i className="bi bi-people me-1"></i>Pacientes
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/turnos') ? 'active fw-bold' : ''}`} to="/turnos" onClick={() => setMenuOpen(false)}>
                      <i className="bi bi-calendar3 me-1"></i>Turnos
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/obras-sociales') ? 'active fw-bold' : ''}`} to="/obras-sociales" onClick={() => setMenuOpen(false)}>
                      <i className="bi bi-building me-1"></i>Obras Sociales
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/facturacion') ? 'active fw-bold' : ''}`} to="/facturacion" onClick={() => setMenuOpen(false)}>
                      <i className="bi bi-receipt-cutoff me-1"></i>Facturación
                    </Link>
                  </li>
                </ul>

                <div className="d-flex align-items-center gap-3 ms-auto">
                  <span className="text-white d-none d-sm-inline">
                    Hola, <strong>{user.nombre}</strong>
                  </span>
                  <button 
                    className="btn btn-sm btn-outline-light px-3 py-1 d-flex align-items-center" 
                    onClick={() => setShowConfirmLogout(true)}
                    style={{ height: '36px', fontSize: '0.95rem' }}
                  >
                    <i className="bi bi-box-arrow-right me-1"></i> Salir
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* MODAL DE CONFIRMACIÓN DE CERRAR SESIÓN */}
      {showConfirmLogout && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 rounded-3 shadow-lg">
              <div className="modal-header bg-danger text-white py-3">
                <h5 className="modal-title font-weight-bold">
                  <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirmLogout(false)} aria-label="Cerrar"></button>
              </div>

              <div className="modal-body p-4 bg-light text-center">
                <p className="text-dark fs-5 mb-1">
                  ¿Estás seguro de que deseas salir?
                </p>
                <p className="text-muted-custom small mb-0">
                  Tendrás que volver a ingresar tus credenciales para acceder.
                </p>
              </div>

              <div className="modal-footer bg-light border-top d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={() => setShowConfirmLogout(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={handleLogout}
                >
                  Sí, cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Menu;
