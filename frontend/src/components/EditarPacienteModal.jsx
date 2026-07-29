import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import pacientesService from './services/pacientes.service';

const EditarPacienteModal = ({ show, onHide, paciente, obrasSociales, onSave }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Inicializar el formulario cuando el paciente cambie
  useEffect(() => {
    if (paciente) {
      reset({
        nombre: paciente.nombre,
        direccion: paciente.direccion || '',
        telefono: paciente.telefono || '',
        emailContact: paciente.emailContact || '',
        servicioEmergencia: paciente.servicioEmergencia || '',
        contactoEmergencia: paciente.contactoEmergencia || '',
        antecedentesEnfermedades: paciente.antecedentesEnfermedades || '',
        antecedentesHereditarias: paciente.antecedentesHereditarias || '',
        antecedentesMedicacion: paciente.antecedentesMedicacion || '',
        antecedentesAlergias: paciente.antecedentesAlergias || ''
      });
    }
  }, [paciente, reset]);

  if (!show || !paciente) return null;

  const onSubmit = async (data) => {
    try {
      // Si el valor seleccionado de obra social es "Particular" o vacío
      const selectedObraId = document.getElementById('editObraSocial').value;
      const payload = {
        ...data,
        obraSocialId: selectedObraId ? parseInt(selectedObraId) : null
      };

      const pacienteActualizado = await pacientesService.updatePaciente(paciente.id, payload);
      onSave(pacienteActualizado);
      onHide();
    } catch (err) {
      alert(err.mensaje || 'Error al actualizar los datos del paciente.');
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div className="modal-content border-0 rounded-3 shadow-lg">
          <div className="modal-header bg-primary text-white py-3">
            <h5 className="modal-title font-weight-bold">
              <i className="bi bi-pencil-square me-2"></i> Editar Ficha de Paciente
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide} aria-label="Cerrar"></button>
          </div>
          
          <div className="modal-body p-4 bg-light">
            <form onSubmit={handleSubmit(onSubmit)} id="form-editar-paciente">
              
              {/* Sección 1: Datos Personales */}
              <div className="mb-4 bg-white p-3 rounded border">
                <h6 className="border-bottom pb-2 mb-3 text-primary font-weight-bold">
                  <i className="bi bi-person-badge-fill me-1"></i> Datos Personales y de Contacto
                </h6>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Nombre completo</label>
                    <input
                      type="text"
                      className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                      {...register('nombre', { required: 'El nombre es obligatorio' })}
                    />
                    {errors.nombre && <div className="invalid-feedback">{errors.nombre.message}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Obra social</label>
                    <select 
                      id="editObraSocial" 
                      className="form-select"
                      defaultValue={paciente.obraSocialId || ''}
                    >
                      <option value="">Particular</option>
                      {obrasSociales.map((obra) => (
                        <option key={obra.id} value={obra.id}>
                          {obra.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label font-weight-bold">Teléfono de contacto</label>
                    <input type="text" className="form-control" {...register('telefono')} placeholder="Ej. 3513456789" />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label font-weight-bold">Correo electrónico</label>
                    <input type="email" className="form-control" {...register('emailContact')} placeholder="ejemplo@correo.com" />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label font-weight-bold">Dirección</label>
                    <input type="text" className="form-control" {...register('direccion')} placeholder="Ej. Av. Colón 123" />
                  </div>
                </div>
              </div>

              {/* Sección 2: Emergencias */}
              <div className="mb-4 bg-white p-3 rounded border">
                <h6 className="border-bottom pb-2 mb-3 text-primary font-weight-bold">
                  <i className="bi bi-shield-fill-plus me-1"></i> Información de Emergencias
                </h6>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Servicio de emergencias</label>
                    <input type="text" className="form-control" {...register('servicioEmergencia')} placeholder="Ej. 107, ECCO, URG" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Contacto de emergencia (Nombre/Teléfono)</label>
                    <input type="text" className="form-control" {...register('contactoEmergencia')} placeholder="Ej. Juan (Padre) - 3519876543" />
                  </div>
                </div>
              </div>

              {/* Sección 3: Antecedentes Clínicos */}
              <div className="bg-white p-3 rounded border">
                <h6 className="border-bottom pb-2 mb-3 text-primary font-weight-bold">
                  <i className="bi bi-file-earmark-medical-fill me-1"></i> Antecedentes Clínicos
                </h6>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Enfermedades preexistentes</label>
                    <textarea className="form-control" rows="2" {...register('antecedentesEnfermedades')} placeholder="Ej. Hipertensión, Diabetes tipo 2..."></textarea>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Antecedentes hereditarios</label>
                    <textarea className="form-control" rows="2" {...register('antecedentesHereditarias')} placeholder="Ej. Cardiopatías en línea materna..."></textarea>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Medicación actual</label>
                    <textarea className="form-control" rows="2" {...register('antecedentesMedicacion')} placeholder="Ej. Enalapril 10mg diario..."></textarea>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Alergias conocidas</label>
                    <textarea className="form-control" rows="2" {...register('antecedentesAlergias')} placeholder="Ej. Alergia a la Penicilina, al Ibuprofeno..."></textarea>
                  </div>
                </div>
              </div>

            </form>
          </div>
          
          <div className="modal-footer bg-light border-top">
            <button type="button" className="btn btn-secondary px-4" onClick={onHide} style={{ height: '44px' }}>
              Cancelar
            </button>
            <button type="submit" form="form-editar-paciente" className="btn btn-primary px-4" style={{ height: '44px' }}>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarPacienteModal;
