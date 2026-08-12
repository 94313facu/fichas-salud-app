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
  async buscarCodigo(codigo) {
    if (!codigo || !codigo.trim()) return { existe: false };
    const response = await api.get(`/api/practicas/buscar?codigo=${encodeURIComponent(codigo.trim())}`);
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
