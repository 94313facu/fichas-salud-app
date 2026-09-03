import api from './api';

const turnosService = {
  /**
   * Obtiene la agenda completa de turnos del profesional
   */
  async getTurnos() {
    const response = await api.get('/api/turnos');
    return response.data;
  },

  /**
   * Obtiene turnos de un mes específico con horario laboral (para el calendario)
   */
  async getTurnosPorMes(anio, mes) {
    const response = await api.get(`/api/turnos/por-mes?anio=${anio}&mes=${mes}`);
    return response.data;
  },

  /**
   * Registra un nuevo turno
   */
  async createTurno(datosTurno) {
    const response = await api.post('/api/turnos', datosTurno);
    return response.data;
  },

  /**
   * Actualiza los datos de un turno existente
   */
  async updateTurno(id, datosTurno) {
    const response = await api.put(`/api/turnos/${id}`, datosTurno);
    return response.data;
  },

  /**
   * Elimina/cancela un turno
   */
  async deleteTurno(id) {
    const response = await api.delete(`/api/turnos/${id}`);
    return response.data;
  },

  /**
   * Marca un turno como que su recordatorio de WhatsApp fue enviado manualmente
   * @param {number|string} id - ID del turno
   */
  async marcarRecordatorioEnviado(id) {
    const response = await api.put(`/api/turnos/${id}/recordatorio`);
    return response.data;
  }
};

export default turnosService;
