import React from 'react';
import ReactDOM from 'react-dom/client';

// Importar primero Bootstrap 5 y Bootstrap Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Importar luego nuestra aplicación y estilos personalizados para que tengan prioridad
import App from './App.jsx';
import './App.css';

// Registro de Service Worker para soporte de PWA e instalación en móviles
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA: Service Worker registrado con éxito:', registration.scope);
      })
      .catch((error) => {
        console.error('PWA: Falló el registro del Service Worker:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
