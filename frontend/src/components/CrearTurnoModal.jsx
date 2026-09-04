import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import turnosService from './services/turnos.service';
import CalendarioTurnos from './CalendarioTurnos';

const CrearTurnoModal = ({ show, onHide, paciente, onSave }) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState(null);

  const [estado, setEstado] = useState('Pendiente');

  // Estado para mostrar/ocultar el calendario
  const [showCalendario, setShowCalendario] = useState(true);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);

  useEffect(() => {
    if (show) {
      reset();
      setEstado('Pendiente');
      setSlotSeleccionado(null);
      setShowCalendario(true);
      setErrorApi(null);
    }
  }, [show, reset]);

  if (!show || !paciente) return null;

  // Cuando se selecciona un slot desde el calendario
  const handleSlotClick = (fechaHoraISO, hora, fecha) => {
    setValue('fecha', fecha);
    setValue('hora', hora);
    setSlotSeleccionado({ fecha, hora, fechaHoraISO });
    setErrorApi(null);
  };

  const onSubmit = async (data) => {
    try {
      setErrorApi(null);
      setCargando(true);

      const fechaHoraCombo = `${data.fecha}T${data.hora}:00`;

      const turnoPayload = {
        pacienteId: paciente.id,
        fechaHora: fechaHoraCombo,
        duracionMinutos: parseInt(data.duracionMinutos) || 30,
        notas: data.notas ? data.notas.trim() : null,
        estado: estado
      };

      const nuevoTurno = await turnosService.createTurno(turnoPayload);
      onSave(nuevoTurno);
      onHide();
    } catch (err) {
      setErrorApi(err.mensaje || 'Error al agendar el turno.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-warning text-dark py-3">
            <h5 className="modal-title font-weight-bold d-flex align-items-center fs-5">
              <i className="bi bi-calendar-plus-fill me-2"></i>
              Agendar Próximo Turno: {paciente.nombre}
            </h5>
            <button type="button" className="btn-close" onClick={onHide} disabled={cargando}></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate id="form-nuevo-turno">
            <div className="modal-body p-4">
              {errorApi && (
                <div className="alert alert-danger py-2 mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errorApi}
                </div>
              )}

              {/* Mini-Calendario para seleccionar horario */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label font-weight-bold mb-0">
                    <i className="bi bi-calendar-check me-1 text-primary"></i>
                    Seleccionar Fecha y Hora
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary px-2 py-1"
                    onClick={() => setShowCalendario(!showCalendario)}
                    style={{ height: '28px', fontSize: '0.78rem' }}
                  >
                    <i className={`bi ${showCalendario ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                    {showCalendario ? 'Ocultar calendario' : 'Mostrar calendario'}
                  </button>
                </div>

                {showCalendario && (
                  <CalendarioTurnos
                    onSlotClick={handleSlotClick}
                    pacienteId={paciente.id}
                    modoSeleccion={true}
                    compacto={true}
                    renderSlotDetails={() => (
                      <div className="row g-2">
                        <div className="col-12 col-sm-6">
                          <label className="form-label font-weight-bold" style={{ fontSize: '0.85rem' }}>Duración</label>
                          <select className="form-select form-select-sm" {...register('duracionMinutos')} defaultValue="30" disabled={cargando}>
                            <option value="15">15 min</option>
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">60 min (1 hr)</option>
                            <option value="90">90 min</option>
                            <option value="120">120 min (2 hr)</option>
                          </select>
                        </div>
                        <div className="col-12 col-sm-6">
                          <label htmlFor="selectEstadoInit" className="form-label font-weight-bold" style={{ fontSize: '0.85rem' }}>Estado inicial</label>
                          <select
                            id="selectEstadoInit"
                            className="form-select form-select-sm"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            disabled={cargando}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Confirmado">Confirmado</option>
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label font-weight-bold" style={{ fontSize: '0.85rem' }}>Notas o Indicaciones previas</label>
                          <textarea
                            className="form-control form-control-sm"
                            rows="2"
                            placeholder="Ej. Control de ortodoncia..."
                            {...register('notas')}
                            disabled={cargando}
                          ></textarea>
                        </div>
                      </div>
                    )}
                  />
                )}

                {slotSeleccionado && (
                  <div className="alert alert-success py-2 mt-3 mb-0 d-flex align-items-center" style={{ fontSize: '0.88rem' }}>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Seleccionado: <strong className="ms-1">{slotSeleccionado.fecha}</strong> a las <strong className="ms-1">{slotSeleccionado.hora} hs</strong>
                  </div>
                )}
              </div>

              <div className="row g-3">
                {/* Inputs ocultos para mantener react-hook-form funcionando sin mostrar los campos */}
                <input type="hidden" {...register('fecha', { required: 'Seleccione un horario.' })} />
                <input type="hidden" {...register('hora', { required: 'Seleccione un horario.' })} />

                {(!slotSeleccionado && (errors.fecha || errors.hora)) && (
                  <div className="col-12">
                    <div className="alert alert-warning py-2 mb-0" style={{ fontSize: '0.88rem' }}>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      Debe seleccionar un horario disponible en el calendario para poder agendar el turno.
                    </div>
                  </div>
                )}

                {/* Los campos de duración, estado y notas ahora se renderizan dentro del CalendarioTurnos mediante la prop renderSlotDetails */}
              </div>
            </div>

            <div className="modal-footer bg-light py-2 d-flex justify-content-between">
              <button type="button" className="btn btn-secondary" onClick={onHide} disabled={cargando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-warning text-dark font-weight-bold px-4" disabled={cargando}>
                {cargando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Agendando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-calendar-check-fill me-1"></i> Agendar y Sincronizar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrearTurnoModal;
