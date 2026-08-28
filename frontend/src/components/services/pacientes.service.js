import api from './api';

const pacientesService = {
  /**
   * Obtiene la lista de todos los pacientes del profesional autenticado
   */
  async getPacientes() {
    const response = await api.get('/api/pacientes');
    return response.data;
  },

  /**
   * Registra un nuevo paciente con todos sus datos
   * @param {Object} datosPaciente - Datos personales y clínicos del paciente
   */
  async createPaciente(datosPaciente) {
    const payload = typeof datosPaciente === 'string' ? { nombre: datosPaciente } : datosPaciente;
    const response = await api.post('/api/pacientes', payload);
    return response.data;
  },

  /**
   * Actualiza los datos de un paciente existente (método PUT)
   */
  async updatePaciente(id, datosPaciente) {
    const response = await api.put(`/api/pacientes/${id}`, datosPaciente);
    return response.data;
  },

  /**
   * Obtiene los detalles de un paciente e historial de sesiones
   * @param {number|string} id - ID del paciente
   */
  async getPacienteDetail(id) {
    const response = await api.get(`/api/pacientes/${id}`);
    return response.data;
  },



  /**
   * Registra una nueva sesión médica vinculada a un tratamiento
   */
  async createSesion(pacienteId, notas, archivo, presupuesto = 0, pago = 0, practicas = [], modalidadCobro = 'obra_social', obraSocialId = null, planObraSocialId = null) {
    const formData = new FormData();
    if (notas) {
      formData.append('notas', notas);
    }
    formData.append('presupuesto', parseFloat(presupuesto) || 0);
    formData.append('pago', parseFloat(pago) || 0);
    
    if (practicas && practicas.length > 0) {
      formData.append('practicas', JSON.stringify(practicas));
    }
    
    formData.append('modalidadCobro', modalidadCobro);
    if (obraSocialId) formData.append('obraSocialId', obraSocialId);
    if (planObraSocialId) formData.append('planObraSocialId', planObraSocialId);

    if (archivo) {
      formData.append('archivo', archivo);
    }

    const response = await api.post(`/api/pacientes/${pacienteId}/sesiones`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Modifica una sesión existente
   */
  async updateSesion(pacienteId, sesionId, notas, archivo, presupuesto = 0, pago = 0) {
    const formData = new FormData();
    if (notas !== undefined) {
      formData.append('notas', notas);
    }
    formData.append('presupuesto', parseFloat(presupuesto) || 0);
    formData.append('pago', parseFloat(pago) || 0);
    
    if (archivo) {
      formData.append('archivo', archivo);
    }

    const response = await api.put(`/api/pacientes/${pacienteId}/sesiones/${sesionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Exporta la base de datos (pacientes y sesiones) del profesional como JSON blob
   */
  async exportarDatos() {
    const response = await api.get('/api/pacientes/exportar', {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Importa/Restaura la base de datos a partir de un archivo JSON de respaldo
   */
  async importarDatos(archivoJson) {
    const formData = new FormData();
    formData.append('archivo', archivoJson);

    const response = await api.post('/api/pacientes/importar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Actualiza el mapa de odontograma del paciente
   */
  async updateOdontograma(pacienteId, odontograma) {
    const response = await api.put(`/api/pacientes/${pacienteId}/odontograma`, { odontograma });
    return response.data;
  }
};

export default pacientesService;
