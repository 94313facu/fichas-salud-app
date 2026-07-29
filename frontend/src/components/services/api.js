import axios from 'axios';

// Instancia central de Axios
// No requiere host completo ya que Vite proxy redirigirá las llamadas /api al backend
const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar automáticamente el JWT en las cabeceras de las llamadas
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores de forma unificada
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend devuelve un error estructurado, extraemos el mensaje simple
    const mensaje = error.response?.data?.mensaje || 'Ha ocurrido un error de conexión con el servidor.';
    
    // Si el error es 401 (no autorizado/token expirado), limpiamos la sesión
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
    
    return Promise.reject({
      status: error.response?.status,
      mensaje: mensaje,
      originalError: error
    });
  }
);

export default api;
