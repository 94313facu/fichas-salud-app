import api from './api';

const practicasService = {
  /**
   * Obtiene la lista completa de prácticas con sus reglas
   */
  async getPracticas() {
    const response = await api.get('/api/practicas');
    return response.data;
  },

  /**
   * Busca si un código de práctica ya fue registrado
   */
  async buscarCodigo(codigo, obraSocialId, planObraSocialId) {
    if (!codigo || !codigo.trim()) return { existe: false };
    
    let url = `/api/practicas/buscar?codigo=${encodeURIComponent(codigo.trim())}`;
    if (obraSocialId) url += `&obraSocialId=${obraSocialId}`;
    if (planObraSocialId) url += `&planObraSocialId=${planObraSocialId}`;

    const response = await api.get(url);
    return response.data;
  },

  /**
   * Guarda o actualiza un código de práctica con sus reglas
   */
  async savePractica(datosPractica) {
    const response = await api.post('/api/practicas', datosPractica);
    return response.data;
  },

  /**
   * Valida la frecuencia de una práctica
   */
  async validarFrecuencia(pacienteId, codigoPractica, piezaDental, caraDental, fechaEv, obraSocialId, ignoreSesionId = null, practicasSimuladas = []) {
    const response = await api.post('/api/practicas/validar-frecuencia', {
      pacienteId,
      codigoPractica,
      piezaDental,
      caraDental,
      fechaEv,
      obraSocialId,
      ignoreSesionId,
      practicasSimuladas
    });
    return response.data;
  },

  /**
   * Elimina una práctica (restricción)
   */
  async deletePractica(id) {
    const response = await api.delete(`/api/practicas/${id}`);
    return response.data;
  },

  /**
   * Obtiene prácticas (restricciones) para una Obra Social
   */
  async getPracticasByOS(obraSocialId) {
    const response = await api.get(`/api/practicas?obraSocialId=${obraSocialId}`);
    return response.data;
  }
};

export default practicasService;
