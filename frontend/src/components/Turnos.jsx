import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import turnosService from './services/turnos.service';
import pacientesService from './services/pacientes.service';

const Turnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [tratamientosPaciente, setTratamientosPaciente] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados para nuevo turno / modal
  const [showModal, setShowModal] = useState(false);
  const [pacienteId, setPacienteId] = useState('');
  const [tratamientoId, setTratamientoId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState('30');
  const [notas, setNotas] = useState('');
  const [estado, setEstado] = useState('Pendiente');

  // Mensajes de feedback
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar turnos y pacientes
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [turnosData, pacientesData] = await Promise.all([
        turnosService.getTurnos(),
        pacientesService.getPacientes()
      ]);
      setTurnos(turnosData);
      setPacientes(pacientesData);
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al cargar la agenda de turnos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cargar tratamientos al cambiar paciente en el modal
  useEffect(() => {
    if (pacienteId) {
      pacientesService.getTratamientos(pacienteId)
        .then(data => setTratamientosPaciente(data))
        .catch(() => setTratamientosPaciente([]));
    } else {
      setTratamientosPaciente([]);
    }
  }, [pacienteId]);

  // Formatear fecha y hora para la vista
  const formatearFechaHora = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-AR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Guardar nuevo turno
  const handleGuardarTurno = async (e) => {
    e.preventDefault();
    if (!pacienteId || !fechaHora) {
      setErrorMsg('Selecciona un paciente y una fecha/hora válida.');
      return;
    }

    try {
      setGuardando(true);
      setErrorMsg('');
      setMensajeExito('');

      const nuevoTurno = await turnosService.createTurno({
        pacienteId: parseInt(pacienteId),
        tratamientoId: tratamientoId ? parseInt(tratamientoId) : null,
        fechaHora,
        duracionMinutos: parseInt(duracionMinutos) || 30,
        notas,
        estado
      });

      setMensajeExito(
        `Turno agendado con éxito${nuevoTurno.googleEventId ? ' y sincronizado en tu Google Calendar' : ''}.`
      );

      // Limpiar modal
      setPacienteId('');
      setTratamientoId('');
      setFechaHora('');
      setNotas('');
      setEstado('Pendiente');
      setShowModal(false);

      await cargarDatos();
      setTimeout(() => setMensajeExito(''), 5000);
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al guardar el turno.');
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar estado de un turno
  const handleCambiarEstado = async (turnoId, nuevoEstado) => {
    try {
      setErrorMsg('');
      await turnosService.updateTurno(turnoId, { estado: nuevoEstado });
      setMensajeExito(`Estado del turno actualizado a "${nuevoEstado}".`);
      await cargarDatos();
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al actualizar estado.');
    }
  };

  // Cancelar/Eliminar turno
  const handleEliminarTurno = async (turnoId) => {
    if (!window.confirm('¿Estás seguro de cancelar este turno? Se removerá de la agenda y de Google Calendar.')) {
      return;
    }

    try {
      setErrorMsg('');
      await turnosService.deleteTurno(turnoId);
      setMensajeExito('Turno cancelado correctamente.');
      await cargarDatos();
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al cancelar el turno.');
    }
  };

  return (
    <div className="container py-4">
      {/* Cabecera */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div className="d-flex align-items-center">
          <Link to="/" className="btn btn-secondary px-3 me-3" style={{ height: '40px' }} aria-label="Volver">
            <i className="bi bi-arrow-left me-1"></i> Volver
          </Link>
          <h2 className="mb-0 fs-3 d-flex align-items-center">
            <i className="bi bi-calendar3 text-primary me-2"></i> Agenda de Turnos
          </h2>
        </div>

        <button
          className="btn btn-accent text-white px-4 d-flex align-items-center justify-content-center"
          onClick={() => setShowModal(true)}
          style={{ minHeight: '44px' }}
        >
          <i className="bi bi-calendar-plus me-2"></i> Agendar Nuevo Turno
        </button>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2 fs-5"></i>
          <div>{mensajeExito}</div>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Listado de Turnos */}
      <div className="card p-4 border-0 shadow-sm">
        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border spinner-primary" role="status">
              <span className="visually-hidden">Cargando agenda...</span>
            </div>
            <p className="mt-2 text-muted-custom">Cargando turnos agendados...</p>
          </div>
        ) : turnos.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {turnos.map((t) => (
              <div key={t.id} className="p-3 border rounded bg-white shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                
                {/* Datos del Turno */}
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-primary text-white p-2 fs-6">
                      <i className="bi bi-clock me-1"></i> {formatearFechaHora(t.fechaHora)}
                    </span>
                    <span className="badge bg-light text-dark border">
                      {t.duracionMinutos} min
                    </span>
                    {t.googleEventId && (
                      <span className="badge bg-light text-success border border-success" title="Sincronizado con Google Calendar">
                        <i className="bi bi-google me-1"></i> Calendar
                      </span>
                    )}
                  </div>

                  <h4 className="fs-5 mb-1 font-weight-bold text-dark">
                    <Link to={`/pacientes/${t.Paciente?.id}`} className="text-decoration-none text-dark">
                      {t.Paciente?.nombre || 'Paciente sin nombre'}
                    </Link>
                  </h4>

                  {t.Tratamiento && (
                    <span className="badge bg-light text-primary border mb-2 d-inline-block">
                      <i className="bi bi-folder-fill me-1"></i> {t.Tratamiento.nombre}
                    </span>
                  )}

                  {t.notas && (
                    <p className="mb-0 text-muted-custom" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-chat-left-text me-1"></i> {t.notas}
                    </p>
                  )}
                </div>

                {/* Acciones y Estado */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {/* Selector de Estado */}
                  <select
                    className={`form-select form-select-sm font-weight-bold ${
                      t.estado === 'Confirmado' ? 'bg-primary-light text-primary border-primary' :
                      t.estado === 'Atendido' ? 'bg-success-light text-success border-success' :
                      t.estado === 'Cancelado' ? 'bg-danger-light text-danger border-danger' : 'bg-light text-dark border'
                    }`}
                    style={{ minWidth: '130px', height: '36px' }}
                    value={t.estado}
                    onChange={(e) => handleCambiarEstado(t.id, e.target.value)}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Atendido">Atendido</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>

                  <button
                    className="btn btn-outline-danger btn-sm p-2 d-flex align-items-center"
                    title="Cancelar turno"
                    onClick={() => handleEliminarTurno(t.id)}
                    style={{ height: '36px' }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-light rounded">
            <i className="bi bi-calendar-x fs-1 text-muted"></i>
            <p className="mt-2 text-muted-custom mb-0">No tienes turnos agendados en este momento.</p>
          </div>
        )}
      </div>

      {/* MODAL: AGENDAR NUEVO TURNO */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 rounded-3 shadow-lg">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title font-weight-bold">
                  <i className="bi bi-calendar-plus-fill me-2"></i> Agendar Nuevo Turno
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Cerrar"></button>
              </div>

              <div className="modal-body p-4 bg-light">
                <form onSubmit={handleGuardarTurno} id="form-nuevo-turno">
                  {/* Selección de Paciente */}
                  <div className="mb-3">
                    <label htmlFor="selectPaciente" className="form-label font-weight-bold">Paciente</label>
                    <select
                      id="selectPaciente"
                      className="form-select"
                      value={pacienteId}
                      onChange={(e) => setPacienteId(e.target.value)}
                      required
                    >
                      <option value="">Selecciona un paciente...</option>
                      {pacientes.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selección de Tratamiento (Opcional) */}
                  {tratamientosPaciente.length > 0 && (
                    <div className="mb-3">
                      <label htmlFor="selectTratamiento" className="form-label font-weight-bold">Plan de Tratamiento (Opcional)</label>
                      <select
                        id="selectTratamiento"
                        className="form-select"
                        value={tratamientoId}
                        onChange={(e) => setTratamientoId(e.target.value)}
                      >
                        <option value="">General / Sin plan específico</option>
                        {tratamientosPaciente.map(t => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Fecha y Hora */}
                  <div className="row g-2 mb-3">
                    <div className="col-12 col-md-7">
                      <label htmlFor="inputFechaHora" className="form-label font-weight-bold">Fecha y Hora de Cita</label>
                      <input
                        type="datetime-local"
                        id="inputFechaHora"
                        className="form-control"
                        value={fechaHora}
                        onChange={(e) => setFechaHora(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-5">
                      <label htmlFor="selectDuracion" className="form-label font-weight-bold">Duración</label>
                      <select
                        id="selectDuracion"
                        className="form-select"
                        value={duracionMinutos}
                        onChange={(e) => setDuracionMinutos(e.target.value)}
                      >
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min (1 hora)</option>
                      </select>
                    </div>
                  </div>

                  {/* Estado inicial */}
                  <div className="mb-3">
                    <label htmlFor="selectEstadoInit" className="form-label font-weight-bold">Estado inicial</label>
                    <select
                      id="selectEstadoInit"
                      className="form-select"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Confirmado">Confirmado</option>
                    </select>
                  </div>

                  {/* Notas adicionadas */}
                  <div className="mb-3">
                    <label htmlFor="inputNotas" className="form-label font-weight-bold">Notas de la cita</label>
                    <textarea
                      id="inputNotas"
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Control de evolución, revisión de estudios..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-info-circle me-1"></i> Si iniciaste sesión con Google, este turno se sincronizará automáticamente con tu Google Calendar.
                  </div>
                </form>
              </div>

              <div className="modal-footer bg-light border-top">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModal(false)} style={{ height: '44px' }}>
                  Cancelar
                </button>
                <button type="submit" form="form-nuevo-turno" className="btn btn-accent text-white px-4" style={{ height: '44px' }} disabled={guardando}>
                  {guardando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Agendando...
                    </>
                  ) : (
                    'Agendar Turno'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Turnos;
