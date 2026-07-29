import api from './api';

const authService = {
  /**
   * Registra un nuevo profesional en la plataforma
   */
  async registro(nombre, especialidad, username, password) {
    const response = await api.post('/api/auth/registro', {
      nombre,
      especialidad,
      username,
      password
    });
    
    if (response.data?.token) {
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Inicia sesión del profesional
   */
  async login(username, password) {
    const response = await api.post('/api/auth/login', {
      username,
      password
    });
    
    if (response.data?.token) {
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Cierra la sesión activa
   */
  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  /**
   * Obtiene la información del usuario actual
   */
  getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Obtiene el token de la sesión activa
   */
  getToken() {
    return sessionStorage.getItem('token');
  },

  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated() {
    return !!this.getToken();
  }
};

export default authService;
