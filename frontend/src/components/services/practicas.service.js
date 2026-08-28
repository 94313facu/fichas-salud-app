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
   * Ejecuta el motor de validación de frecuencia por Obra Social
   */
  async validarFrecuencia(pacienteId, codigoPractica, piezaDental, caraDental, fechaEv) {
    const response = await api.post('/api/practicas/validar-frecuencia', {
      pacienteId,
      codigoPractica,
      piezaDental,
      caraDental,
      fechaEv
    });
    return response.data;
  }
};

export default practicasService;
