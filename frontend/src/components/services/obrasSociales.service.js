import api from './api';

const obrasSocialesService = {
  /**
   * Obtiene la lista de todas las obras sociales del profesional autenticado
   */
  async getObrasSociales() {
    const response = await api.get('/api/obras-sociales');
    return response.data;
  },

  /**
   * Agrega una nueva obra social a la lista del profesional
   * @param {string} nombre - Nombre de la obra social (ej. "Particular", "Daspu")
   */
  async createObraSocial(nombre) {
    const response = await api.post('/api/obras-sociales', { nombre });
    return response.data;
  }
};

export default obrasSocialesService;
