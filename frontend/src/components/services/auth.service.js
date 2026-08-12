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
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Inicia sesión del profesional tradicional
   */
  async login(username, password) {
    const response = await api.post('/api/auth/login', {
      username,
      password
    });
    
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Inicia sesión o se registra con Google OAuth 2.0
   */
  async googleLogin(credential, code) {
    const response = await api.post('/api/auth/google', {
      credential,
      code
    });
    
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Vincula permisos de Google Calendar y Drive a la cuenta del usuario actual
   */
  async linkGoogle(code) {
    const response = await api.post('/api/auth/google/link', { code });
    if (response.data?.googleLinked) {
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        currentUser.googleLinked = true;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    }
    return response.data;
  },

  /**
   * Fuerza la subida inmediata de un respaldo JSON al Google Drive del profesional
   */
  async syncDriveNow() {
    const response = await api.post('/api/auth/google/sync-drive');
    return response.data;
  },

  /**
   * Cierra la sesión activa
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Obtiene la información del usuario actual
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
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
    return localStorage.getItem('token');
  },

  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated() {
    return !!this.getToken();
  }
};

export default authService;
