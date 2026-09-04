import React, { useEffect, useState, useRef } from 'react';
import authService from './services/auth.service';

const NotificadorGlobal = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const eventSourceRef = useRef(null);

  // Un sonido corto base64 de campana/burbuja
  const notificationSound = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'); 
  // Nota: como el base64 es largo, usaré un truco: simplemente usaré un objeto Audio, 
  // pero el navegador puede bloquear el auto-play si no hay interacción previa.
  // Sin embargo, si el usuario interactuó con la app, debería sonar.
  // Usaré un archivo de audio del sistema o dejaré que use el default.
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Crear conexión EventSource
    // Lamentablemente, EventSource estándar no soporta enviar headers Authorization fácilmente
    // sin polyfills. Sin embargo, podemos pasar el token en la URL (query param).
    const connectSSE = () => {
      eventSourceRef.current = new EventSource(`http://localhost:5000/api/notificaciones/stream?token=${token}`);

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          agregarNotificacion(data);
          reproducirSonido();
          
          // Emitir evento global para que otros componentes (ej. Turnos) se actualicen
          window.dispatchEvent(new CustomEvent('appDataUpdate', { detail: data }));
        } catch (e) {}
      };

      eventSourceRef.current.onerror = () => {
        eventSourceRef.current.close();
        // Intentar reconectar después de 10 segundos
        setTimeout(connectSSE, 10000);
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const reproducirSonido = () => {
    try {
      // Intenta reproducir un sonido genérico. A veces los navegadores lo bloquean,
      // pero vale la pena intentarlo.
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error);
    }
  };

  const agregarNotificacion = (data) => {
    const id = Date.now();
    setNotificaciones(prev => [...prev, { id, ...data }]);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  if (notificaciones.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {notificaciones.map(n => (
        <div key={n.id} className="toast show" role="alert" aria-live="assertive" aria-atomic="true" style={{ width: '300px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div className={`toast-header text-white ${n.tipo === 'ERROR' ? 'bg-danger' : 'bg-primary'}`} style={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
            <i className={`bi ${n.tipo === 'ERROR' ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-2`}></i>
            <strong className="me-auto">{n.titulo}</strong>
            <small>Justo ahora</small>
            <button type="button" className="btn-close btn-close-white" onClick={() => setNotificaciones(prev => prev.filter(item => item.id !== n.id))} aria-label="Close"></button>
          </div>
          <div className="toast-body" style={{ color: '#333' }}>
            {n.mensaje}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificadorGlobal;
