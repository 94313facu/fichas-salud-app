import api from './api';

const facturacionService = {
  /**
   * Obtiene las sesiones facturables con filtros
   * @param {Object} filtros - { estado, obraSocialId, desde, hasta }
   */
  async getPendientes(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.obraSocialId) params.append('obraSocialId', filtros.obraSocialId);
    if (filtros.desde) params.append('desde', filtros.desde);
    if (filtros.hasta) params.append('hasta', filtros.hasta);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/api/facturacion/pendientes${query}`);
    return response.data;
  },

  /**
   * Cambia el estado de facturación de una sesión
   */
  async cambiarEstado(sesionId, estadoFacturacion) {
    const response = await api.patch(`/api/facturacion/${sesionId}/estado`, { estadoFacturacion });
    return response.data;
  },

  /**
   * Obtiene el resumen de facturación agrupado por obra social
   */
  async getResumen() {
    const response = await api.get('/api/facturacion/resumen');
    return response.data;
  }
};

export default facturacionService;
