import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import turnosService from './services/turnos.service';
import pacientesService from './services/pacientes.service';
import configuracionService from './services/configuracion.service';
import CalendarioTurnos from './CalendarioTurnos';

const Turnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [refreshCal, setRefreshCal] = useState(0);

  // Vista: 'calendario' | 'lista'
  const [vistaActiva, setVistaActiva] = useState('calendario');

  // Filtros de Lista
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTiempo, setFiltroTiempo] = useState('futuros'); // 'futuros' | 'pasados'

  // Estados para nuevo turno / modal
  const [showModal, setShowModal] = useState(false);
  const [turnoEditandoId, setTurnoEditandoId] = useState(null);
  const [pacienteId, setPacienteId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState('30');
  const [notas, setNotas] = useState('');
  const [estado, setEstado] = useState('Pendiente');
  
  // Escuchar eventos globales de notificaciones (ej: recordatorios enviados automáticamente)
  useEffect(() => {
    const handleAppDataUpdate = (e) => {
      // Si recibimos una notificación de éxito (como WhatsApp o Respaldo)
      // Recargamos los datos para que se refresque la UI
      if (e.detail && e.detail.tipo === 'EXITO') {
        cargarDatos();
        setRefreshCal(prev => prev + 1);
      }
    };

    window.addEventListener('appDataUpdate', handleAppDataUpdate);
    return () => {
      window.removeEventListener('appDataUpdate', handleAppDataUpdate);
    };
  }, []);

  // Configuración de horarios
  const [showConfigHorario, setShowConfigHorario] = useState(false);
  const [horarioLaboral, setHorarioLaboral] = useState(null);
  const [guardandoHorario, setGuardandoHorario] = useState(false);

  // Mensajes de feedback
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const DIAS_LABEL = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo'
  };

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

  const cargarHorario = async () => {
    try {
      const data = await configuracionService.getHorarioLaboral();
      setHorarioLaboral(data);
    } catch (err) {
      console.error('Error al cargar horario:', err);
    }
  };

  useEffect(() => {
    cargarDatos();
    cargarHorario();
  }, []);

  // (Tratamientos eliminados)

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

      let mensajeResponse = '';

      if (turnoEditandoId) {
        await turnosService.updateTurno(turnoEditandoId, {
          pacienteId: parseInt(pacienteId),
          fechaHora,
          duracionMinutos: parseInt(duracionMinutos) || 30,
          notas,
          estado
        });
        mensajeResponse = 'Turno actualizado con éxito.';
      } else {
        const nuevoTurno = await turnosService.createTurno({
          pacienteId: parseInt(pacienteId),
          fechaHora,
          duracionMinutos: parseInt(duracionMinutos) || 30,
          notas,
          estado
        });
        mensajeResponse = `Turno agendado con éxito${nuevoTurno.googleEventId ? ' y sincronizado en tu Google Calendar' : ''}.`;
      }

      setMensajeExito(mensajeResponse);

      // Limpiar modal
      setTurnoEditandoId(null);
      setPacienteId('');
      setFechaHora('');
      setNotas('');
      setEstado('Pendiente');
      setDuracionMinutos('30');
      setShowModal(false);

      await cargarDatos();
      setRefreshCal(prev => prev + 1); // Forzar actualización del calendario
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
      setRefreshCal(prev => prev + 1);
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
      setRefreshCal(prev => prev + 1);
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al cancelar el turno.');
    }
  };

  // Slot click desde el calendario → se abre el accordion inline
  const handleSlotClick = (fechaHoraISO) => {
    setErrorMsg(''); // Limpiar errores previos
    setTurnoEditandoId(null);
    setPacienteId('');
    setNotas('');
    setEstado('Pendiente');
    setDuracionMinutos('30');
    setFechaHora(fechaHoraISO.substring(0, 16)); // "YYYY-MM-DDTHH:mm"
  };

  const handleEditarTurno = (turno) => {
    setErrorMsg('');
    setTurnoEditandoId(turno.id);
    setPacienteId(turno.pacienteId ? turno.pacienteId.toString() : '');
    setDuracionMinutos(turno.duracionMinutos ? turno.duracionMinutos.toString() : '30');
    setNotas(turno.notas || '');
    setEstado(turno.estado || 'Pendiente');
    
    if (turno.fechaHora) {
      const d = new Date(turno.fechaHora);
      const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      setFechaHora(localDate.toISOString().substring(0, 16));
    } else {
      setFechaHora('');
    }
    setShowModal(true);
  };

  const handleEnviarWhatsAppManual = async (turno) => {
    try {
      const pac = turno.Paciente || turno.paciente;
      if (!pac || !pac.telefono) {
        alert('El paciente no tiene un número de teléfono registrado.');
        return;
      }
      
      const resConfig = await fetch('http://localhost:5000/api/whatsapp/config', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await resConfig.json();
      
      if (!data || !data.mensajePlantilla) {
        alert('No tienes configurada la plantilla de WhatsApp. Ve a Ajustes -> WhatsApp.');
        return;
      }

      const fechaTurno = new Date(turno.fechaHora);
      const fechaHoraStr = fechaTurno.toLocaleString('es-AR', {
        weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
      });

      let mensaje = data.mensajePlantilla;
      mensaje = mensaje.replace(/{nombrePaciente}/g, pac.nombre);
      mensaje = mensaje.replace(/{fechaHora}/g, fechaHoraStr);

      let phone = pac.telefono.replace(/\D/g, '');
      // Si el número tiene 10 dígitos, asumimos que es de Argentina y le agregamos el 549 (código de país + celular)
      if (phone.length === 10) {
        phone = `549${phone}`;
      } else if (phone.length === 13 && phone.startsWith('549')) {
         // Ya tiene el formato correcto
      } else if (phone.length === 12 && phone.startsWith('54')) {
         // Si pusieron el código de país pero no el 9 para celulares de Argentina, se lo agregamos
         phone = `549${phone.substring(2)}`;
      }

      const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
      window.open(waLink, '_blank');

      // Marcar como enviado en la DB
      await turnosService.marcarRecordatorioEnviado(turno.id);
      
      setMensajeExito('Recordatorio marcado como enviado manualmente.');
      await cargarDatos();
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (err) {
      setErrorMsg('Error al enviar WhatsApp.');
    }
  };

  // Guardar configuración de horario
  const handleGuardarHorario = async () => {
    try {
      setGuardandoHorario(true);
      setErrorMsg('');
      await configuracionService.updateHorarioLaboral(horarioLaboral);
      setMensajeExito('Horario laboral guardado correctamente.');
      setShowConfigHorario(false);
      setRefreshCal(prev => prev + 1);
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al guardar el horario.');
    } finally {
      setGuardandoHorario(false);
    }
  };

  const updateHorarioDia = (dia, campo, valor) => {
    setHorarioLaboral(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [campo]: valor
      }
    }));
  };
  // Lógica de filtrado y ordenamiento de turnos para la vista Lista
  const turnosFiltradosYOrdenados = turnos
    .filter((t) => {
      // Filtrar por texto (nombre paciente)
      if (searchQuery) {
        const nombrePaciente = t.Paciente?.nombre || 'Paciente sin nombre';
        if (!nombrePaciente.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // Filtrar por tiempo (futuro/pasado)
      const ahora = new Date();
      // Ajustamos a principio del día actual para incluir los de hoy como futuros/actuales
      ahora.setHours(0, 0, 0, 0);
      const fechaTurno = new Date(t.fechaHora);
      
      if (filtroTiempo === 'futuros') {
        return fechaTurno >= ahora;
      } else {
        return fechaTurno < ahora;
      }
    })
    .sort((a, b) => {
      const fechaA = new Date(a.fechaHora).getTime();
      const fechaB = new Date(b.fechaHora).getTime();
      
      if (filtroTiempo === 'futuros') {
        // Futuros: del más próximo al más lejano (ascendente)
        return fechaA - fechaB;
      } else {
        // Pasados: del más reciente al más viejo (descendente)
        return fechaB - fechaA;
      }
    });

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

        <div className="d-flex align-items-center gap-2">
          {/* Toggle Vista */}
          <div className="cal-vista-toggle" data-active={vistaActiva}>
            <button
              className={vistaActiva === 'calendario' ? 'activo' : ''}
              onClick={() => setVistaActiva('calendario')}
              title="Vista Calendario"
            >
              <i className="bi bi-calendar3 me-1"></i> Calendario
            </button>
            <button
              className={vistaActiva === 'lista' ? 'activo' : ''}
              onClick={() => setVistaActiva('lista')}
              title="Vista Lista"
            >
              <i className="bi bi-list-ul me-1"></i> Lista
            </button>
          </div>

          {/* Botón configurar horario */}
          <button
            className="btn btn-outline-primary d-flex align-items-center px-3"
            onClick={() => setShowConfigHorario(true)}
            style={{ height: '40px', fontSize: '0.88rem' }}
            title="Configurar horarios de atención"
          >
            <i className="bi bi-gear me-1"></i> Horarios
          </button>

        </div>
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

      {/* ======================== */}
      {/* VISTA CALENDARIO */}
      {/* ======================== */}
      {vistaActiva === 'calendario' && (
        <CalendarioTurnos
          onSlotClick={handleSlotClick}
          onEditClick={handleEditarTurno}
          onDeleteClick={handleEliminarTurno}
          modoSeleccion={true}
          refreshTrigger={refreshCal}
          renderSlotDetails={() => (
            <form onSubmit={handleGuardarTurno} className="row g-2 mt-1">
              <div className="col-12 col-md-6">
                <label htmlFor="selectPacienteInline" className="form-label font-weight-bold" style={{ fontSize: '0.85rem' }}>Paciente</label>
                <select
                  id="selectPacienteInline"
                  className="form-select form-select-sm"
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  required
                  disabled={guardando}
                >
                  <option value="">Selecciona un paciente...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label htmlFor="selectDuracionInline" className="form-label font-weight-bold" style={{ fontSize: '0.85rem' }}>Duración</label>
                <select
                  id="selectDuracionInline"
                  className="form-select form-select-sm"
                  value={duracionMinutos}
                  onChange={(e) => setDuracionMinutos(e.target.value)}
                  disabled={guardando}
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                  <option value="120">120 min</option>
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label htmlFor="selectEstadoInline" className="form-label font-weight-bold" style={{ fontSize: '0.85rem' }}>Estado inicial</label>
                <select
                  id="selectEstadoInline"
                  className="form-select form-select-sm"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  disabled={guardando}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Confirmado">Confirmado</option>
                </select>
              </div>
              <div className="col-12">
                <label htmlFor="inputNotasInline" className="form-label font-weight-bold" style={{ fontSize: '0.85rem' }}>Notas de la cita</label>
                <textarea
                  id="inputNotasInline"
                  className="form-control form-control-sm"
                  rows="2"
                  placeholder="Ej. Control de evolución, revisión de estudios..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  disabled={guardando}
                ></textarea>
              </div>
              <div className="col-12 d-flex justify-content-end mt-2">
                <button type="submit" className="btn btn-sm btn-accent text-white px-4 font-weight-bold" disabled={guardando}>
                  {guardando ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Agendando...</>
                  ) : (
                    <><i className="bi bi-calendar-check-fill me-1"></i> Agendar Turno</>
                  )}
                </button>
              </div>
            </form>
          )}
        />
      )}

      {/* ======================== */}
      {/* VISTA LISTA */}
      {/* ======================== */}
      {vistaActiva === 'lista' && (
        <div className="card p-4 border-0 shadow-sm">
          {/* Controles de filtro y búsqueda */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom">
            <div className="btn-group shadow-sm" role="group">
              <button
                type="button"
                className={`btn ${filtroTiempo === 'futuros' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFiltroTiempo('futuros')}
              >
                Próximos Turnos
              </button>
              <button
                type="button"
                className={`btn ${filtroTiempo === 'pasados' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFiltroTiempo('pasados')}
              >
                Turnos Pasados
              </button>
            </div>
            
            <div className="input-group w-auto" style={{ minWidth: '250px' }}>
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Buscar paciente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {cargando ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-primary" role="status">
                <span className="visually-hidden">Cargando agenda...</span>
              </div>
              <p className="mt-2 text-muted-custom">Cargando turnos agendados...</p>
            </div>
          ) : turnosFiltradosYOrdenados.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {turnosFiltradosYOrdenados.map((t) => (
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
                    
                    <button
                      className={`btn btn-sm p-2 d-flex align-items-center ${t.recordatorioEnviado ? 'btn-success text-white' : 'btn-outline-success'}`}
                      title={t.recordatorioEnviado ? "Recordatorio ya enviado. Clic para reenviar." : "Enviar recordatorio por WhatsApp"}
                      onClick={() => handleEnviarWhatsAppManual(t)}
                      style={{ height: '36px' }}
                    >
                      <i className={`bi bi-whatsapp ${t.recordatorioEnviado ? 'me-1' : ''}`}></i>
                      {t.recordatorioEnviado && <i className="bi bi-check2-all"></i>}
                    </button>

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
              <p className="mt-2 text-muted-custom mb-0">No se encontraron turnos para la vista y búsqueda actuales.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: EDITAR TURNO */}
      {showModal && turnoEditandoId && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 rounded-3 shadow-lg">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title font-weight-bold">
                  <i className="bi bi-pencil-square me-2"></i> Editar Turno
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowModal(false); setErrorMsg(''); }} aria-label="Cerrar"></button>
              </div>

              <div className="modal-body p-4 position-relative">
                {/* Mostrar error dentro del modal si ocurre al intentar agendar */}
                {errorMsg && (
                  <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>{errorMsg}</div>
                  </div>
                )}
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

                  {/* Selección de Tratamiento eliminada */}

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
                        <option value="90">90 min</option>
                        <option value="120">120 min (2 horas)</option>
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
                <button type="button" className="btn btn-secondary px-4" onClick={() => { setShowModal(false); setErrorMsg(''); }} style={{ height: '44px' }}>
                  Cancelar
                </button>
                <button type="submit" form="form-nuevo-turno" className="btn btn-accent text-white px-4" style={{ height: '44px' }} disabled={guardando}>
                  {guardando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURACIÓN DE HORARIOS */}
      {showConfigHorario && horarioLaboral && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content border-0 rounded-3 shadow-lg">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title font-weight-bold">
                  <i className="bi bi-gear-fill me-2"></i> Configurar Horarios de Atención
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfigHorario(false)} aria-label="Cerrar"></button>
              </div>

              <div className="modal-body p-4">
                <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                  <i className="bi bi-info-circle me-1"></i>
                  Configurá los días y horarios en los que atendés. El calendario usará estos datos para mostrar la disponibilidad.
                </p>

                <div className="d-flex flex-column">
                  {Object.entries(DIAS_LABEL).map(([dia, label]) => {
                    const config = horarioLaboral[dia] || { activo: false, inicio: '08:00', fin: '20:00' };
                    return (
                      <div key={dia} className={`horario-dia-row ${!config.activo ? 'horario-dia-inactivo' : ''}`}>
                        <div className="horario-dia-nombre">{label}</div>
                        <div className="form-check form-switch horario-dia-toggle">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`toggle-${dia}`}
                            checked={config.activo}
                            onChange={(e) => updateHorarioDia(dia, 'activo', e.target.checked)}
                          />
                          <label className="form-check-label small" htmlFor={`toggle-${dia}`}>
                            {config.activo ? 'Atiendo' : 'No atiendo'}
                          </label>
                        </div>
                        {config.activo && (
                          <div className="horario-dia-inputs">
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={config.inicio}
                              onChange={(e) => updateHorarioDia(dia, 'inicio', e.target.value)}
                            />
                            <span className="text-muted">a</span>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={config.fin}
                              onChange={(e) => updateHorarioDia(dia, 'fin', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-footer bg-light border-top">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowConfigHorario(false)} style={{ height: '44px' }}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary px-4"
                  style={{ height: '44px' }}
                  disabled={guardandoHorario}
                  onClick={handleGuardarHorario}
                >
                  {guardandoHorario ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Guardando...
                    </>
                  ) : (
                    <><i className="bi bi-check-lg me-1"></i> Guardar Horarios</>
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
