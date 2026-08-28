import api from './api';

const configuracionService = {
  /**
   * Obtiene el horario laboral configurado del profesional
   */
  async getHorarioLaboral() {
    const response = await api.get('/api/configuracion/horario');
    return response.data;
  },

  /**
   * Actualiza el horario laboral del profesional
   */
  async updateHorarioLaboral(horario) {
    const response = await api.put('/api/configuracion/horario', horario);
    return response.data;
  }
};

export default configuracionService;
