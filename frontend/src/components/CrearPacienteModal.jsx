import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import pacientesService from './services/pacientes.service';
import obrasSocialesService from './services/obrasSociales.service';

const CrearPacienteModal = ({ show, onHide, obrasSociales, setObrasSociales, onSave }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [obraSocialId, setObraSocialId] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Limpiar formulario al abrir
  useEffect(() => {
    if (show) {
      reset({
        nombre: '',
        direccion: '',
        telefono: '',
        emailContact: '',
        servicioEmergencia: '',
        contactoEmergencia: '',
        antecedentesEnfermedades: '',
        antecedentesHereditarias: '',
        antecedentesMedicacion: '',
        antecedentesAlergias: ''
      });
      setObraSocialId('');
      setErrorMsg(null);
    }
  }, [show, reset]);

  if (!show) return null;

  // Alta dinámica de obra social dentro del modal de registro
  const handleNuevaObraSocial = async () => {
    const nombre = prompt('Ingresa el nombre de la nueva obra social (ej. Daspu):');
    if (nombre && nombre.trim()) {
      try {
        setErrorMsg(null);
        const nuevaObra = await obrasSocialesService.createObraSocial(nombre.trim());
        setObrasSociales(prev => [...prev, nuevaObra]);
        setObraSocialId(nuevaObra.id); // Pre-seleccionar
      } catch (err) {
        setErrorMsg(err.mensaje || 'Error al registrar la obra social.');
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      setGuardando(true);
      setErrorMsg(null);

      const payload = {
        ...data,
        obraSocialId: obraSocialId ? parseInt(obraSocialId) : null
      };

      const nuevoPaciente = await pacientesService.createPaciente(payload);
      onSave(nuevoPaciente);
      onHide();
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al guardar el paciente.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div className="modal-content border-0 rounded-3 shadow-lg">
          <div className="modal-header bg-primary text-white py-3">
            <h5 className="modal-title font-weight-bold">
              <i className="bi bi-person-plus-fill me-2"></i> Registrar Nuevo Paciente
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide} aria-label="Cerrar"></button>
          </div>
          
          <div className="modal-body p-4 bg-light">
            {errorMsg && (
              <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} id="form-crear-paciente">
              
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
                      placeholder="Ej. Dr. Juan Pérez"
                      {...register('nombre', { required: 'El nombre es obligatorio' })}
                      disabled={guardando}
                    />
                    {errors.nombre && <div className="invalid-feedback">{errors.nombre.message}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label htmlFor="modalObraSelect" className="form-label mb-0 font-weight-bold">Obra social</label>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-accent font-weight-bold text-decoration-none"
                        style={{ height: 'auto', fontSize: '0.9rem' }}
                        onClick={handleNuevaObraSocial}
                        disabled={guardando}
                      >
                        <i className="bi bi-plus-circle-fill me-1"></i> Nueva
                      </button>
                    </div>
                    <select 
                      id="modalObraSelect" 
                      className="form-select"
                      value={obraSocialId}
                      onChange={(e) => setObraSocialId(e.target.value)}
                      disabled={guardando}
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
                    <input type="text" className="form-control" {...register('telefono')} placeholder="Ej. 3513456789" disabled={guardando} />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label font-weight-bold">Correo electrónico</label>
                    <input type="email" className="form-control" {...register('emailContact')} placeholder="ejemplo@correo.com" disabled={guardando} />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label font-weight-bold">Dirección</label>
                    <input type="text" className="form-control" {...register('direccion')} placeholder="Ej. Av. Colón 123" disabled={guardando} />
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
                    <input type="text" className="form-control" {...register('servicioEmergencia')} placeholder="Ej. 107, ECCO, URG" disabled={guardando} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Contacto de emergencia (Nombre/Teléfono)</label>
                    <input type="text" className="form-control" {...register('contactoEmergencia')} placeholder="Ej. Juan (Padre) - 3519876543" disabled={guardando} />
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
                    <textarea className="form-control" rows="2" {...register('antecedentesEnfermedades')} placeholder="Ej. Hipertensión, Diabetes..." disabled={guardando}></textarea>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Antecedentes hereditarios</label>
                    <textarea className="form-control" rows="2" {...register('antecedentesHereditarias')} placeholder="Ej. Madre hipertensa, padre diabético..." disabled={guardando}></textarea>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Medicación actual</label>
                    <textarea className="form-control" rows="2" {...register('antecedentesMedicacion')} placeholder="Ej. Enalapril 10mg diario..." disabled={guardando}></textarea>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label font-weight-bold">Alergias conocidas</label>
                    <textarea className="form-control" rows="2" {...register('antecedentesAlergias')} placeholder="Ej. Penicilina..." disabled={guardando}></textarea>
                  </div>
                </div>
              </div>

            </form>
          </div>
          
          <div className="modal-footer bg-light border-top">
            <button type="button" className="btn btn-secondary px-4" onClick={onHide} style={{ height: '44px' }} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" form="form-crear-paciente" className="btn btn-accent text-white px-4" style={{ height: '44px' }} disabled={guardando}>
              {guardando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Registrando...
                </>
              ) : (
                'Registrar Paciente'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrearPacienteModal;
