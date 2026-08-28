import api from './api';

const obrasSocialesService = {
  /**
   * Obtiene la lista de todas las obras sociales del profesional autenticado
   * Incluye planes, portal y conteo de pacientes
   */
  async getObrasSociales() {
    const response = await api.get('/api/obras-sociales');
    return response.data;
  },

  /**
   * Agrega una nueva obra social
   */
  async createObraSocial(datos) {
    const response = await api.post('/api/obras-sociales', datos);
    return response.data;
  },

  /**
   * Edita una obra social existente
   */
  async updateObraSocial(id, datos) {
    const response = await api.put(`/api/obras-sociales/${id}`, datos);
    return response.data;
  },

  /**
   * Pausar/activar una obra social
   */
  async toggleObraSocial(id) {
    const response = await api.patch(`/api/obras-sociales/${id}/toggle`);
    return response.data;
  },

  /**
   * Eliminar una obra social
   */
  async deleteObraSocial(id) {
    const response = await api.delete(`/api/obras-sociales/${id}`);
    return response.data;
  },

  // ========================
  // PLANES
  // ========================

  /**
   * Obtener los planes de una obra social
   */
  async getPlanes(obraSocialId) {
    const response = await api.get(`/api/obras-sociales/${obraSocialId}/planes`);
    return response.data;
  },

  /**
   * Crear un plan para una obra social
   */
  async createPlan(obraSocialId, datos) {
    const response = await api.post(`/api/obras-sociales/${obraSocialId}/planes`, datos);
    return response.data;
  },

  /**
   * Editar un plan
   */
  async updatePlan(obraSocialId, planId, datos) {
    const response = await api.put(`/api/obras-sociales/${obraSocialId}/planes/${planId}`, datos);
    return response.data;
  },

  /**
   * Eliminar un plan
   */
  async deletePlan(obraSocialId, planId) {
    const response = await api.delete(`/api/obras-sociales/${obraSocialId}/planes/${planId}`);
    return response.data;
  },

  // ========================
  // PORTALES DE FACTURACIÓN
  // ========================

  /**
   * Obtener todos los portales del profesional
   */
  async getPortales() {
    const response = await api.get('/api/obras-sociales/portales');
    return response.data;
  },

  /**
   * Crear un portal de facturación
   */
  async createPortal(datos) {
    const response = await api.post('/api/obras-sociales/portales', datos);
    return response.data;
  },

  /**
   * Editar un portal
   */
  async updatePortal(portalId, datos) {
    const response = await api.put(`/api/obras-sociales/portales/${portalId}`, datos);
    return response.data;
  },

  /**
   * Eliminar un portal
   */
  async deletePortal(portalId) {
    const response = await api.delete(`/api/obras-sociales/portales/${portalId}`);
    return response.data;
  }
};

export default obrasSocialesService;
