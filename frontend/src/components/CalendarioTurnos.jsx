import React, { useState, useEffect, useCallback } from 'react';
import turnosService from './services/turnos.service';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_NOMBRE_MAP = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
  4: 'jueves', 5: 'viernes', 6: 'sabado'
};
const MESES_NOMBRE = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Genera slots de 30 min entre horaInicio y horaFin para calcular disponibilidad.
 * Ej: "08:00" a "10:00" → ["08:00", "08:30", "09:00", "09:30"]
 */
const generarSlotsDelDia = (horaInicio, horaFin) => {
  const slots = [];
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFin.split(':').map(Number);
  let minActual = hI * 60 + mI;
  const minFin = hF * 60 + mF;
  while (minActual < minFin) {
    const h = Math.floor(minActual / 60);
    const m = minActual % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    minActual += 30;
  }
  return slots;
};

/**
 * Verifica si un slot de 30 min se superpone con algún turno existente
 */
const slotOcupado = (slotHora, turnosDelDia) => {
  const [sh, sm] = slotHora.split(':').map(Number);
  const slotInicio = sh * 60 + sm;
  const slotFin = slotInicio + 30;

  for (const turno of turnosDelDia) {
    const fecha = new Date(turno.fechaHora);
    const turnoInicio = fecha.getHours() * 60 + fecha.getMinutes();
    const turnoFin = turnoInicio + (turno.duracionMinutos || 30);
    // Hay superposición si slot no termina antes de que empiece turno ni empieza después de que termine turno
    if (slotInicio < turnoFin && slotFin > turnoInicio) {
      return turno;
    }
  }
  return null;
};

/**
 * CalendarioTurnos - Componente reutilizable de calendario mensual
 * 
 * Props:
 * - onSlotClick(fechaHoraISO): callback al clickear slot libre
 * - pacienteId: (opcional) resalta turnos del paciente
 * - modoSeleccion: si true, permite clickear slots libres
 * - compacto: si true, muestra versión reducida (para modales)
 * - turnosExternos: (opcional) turnos ya cargados externamente
 * - horarioExterno: (opcional) horario laboral ya cargado
 */
const CalendarioTurnos = ({
  onSlotClick,
  onEditClick,
  onDeleteClick,
  pacienteId = null,
  modoSeleccion = false,
  compacto = false,
  turnosExternos = null,
  horarioExterno = null,
  refreshTrigger = 0,
  renderSlotDetails = null
}) => {
  const hoy = new Date();
  const [mesActual, setMesActual] = useState(hoy.getMonth());
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());
  const [turnos, setTurnos] = useState([]);
  const [horarioLaboral, setHorarioLaboral] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [slotActivo, setSlotActivo] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Cargar datos del mes
  const cargarMes = useCallback(async () => {
    if (turnosExternos && horarioExterno) {
      setTurnos(turnosExternos);
      setHorarioLaboral(horarioExterno);
      return;
    }

    try {
      setCargando(true);
      const data = await turnosService.getTurnosPorMes(anioActual, mesActual + 1);
      setTurnos(data.turnos || []);
      setHorarioLaboral(data.horarioLaboral || null);
    } catch (err) {
      console.error('Error al cargar turnos del mes:', err);
    } finally {
      setCargando(false);
    }
  }, [anioActual, mesActual, turnosExternos, horarioExterno, refreshTrigger]);

  useEffect(() => {
    cargarMes();
  }, [cargarMes]);

  // Navegar meses
  const mesAnterior = () => {
    if (mesActual === 0) {
      setMesActual(11);
      setAnioActual(a => a - 1);
    } else {
      setMesActual(m => m - 1);
    }
    setDiaSeleccionado(null);
    setSlotActivo(null);
  };

  const mesSiguiente = () => {
    if (mesActual === 11) {
      setMesActual(0);
      setAnioActual(a => a + 1);
    } else {
      setMesActual(m => m + 1);
    }
    setDiaSeleccionado(null);
    setSlotActivo(null);
  };

  // Generar grilla del mes
  const primerDiaMes = new Date(anioActual, mesActual, 1);
  const ultimoDiaMes = new Date(anioActual, mesActual + 1, 0);
  const diasEnMes = ultimoDiaMes.getDate();
  const primerDiaSemana = primerDiaMes.getDay(); // 0=Dom

  // Turnos agrupados por día
  const turnosPorDia = {};
  turnos.forEach(t => {
    if (t.estado === 'Cancelado') return;
    const fecha = new Date(t.fechaHora);
    const dia = fecha.getDate();
    if (!turnosPorDia[dia]) turnosPorDia[dia] = [];
    turnosPorDia[dia].push(t);
  });

  // Obtener info de disponibilidad para un día
  const getInfoDia = (numDia) => {
    const fecha = new Date(anioActual, mesActual, numDia);
    const diaSemana = fecha.getDay();
    const nombreDia = DIAS_NOMBRE_MAP[diaSemana];
    const config = horarioLaboral?.[nombreDia];
    
    const esPasado = fecha < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const noLaboral = !config?.activo;
    const turnosDelDia = turnosPorDia[numDia] || [];

    if (esPasado || noLaboral) {
      return { estado: 'inactivo', turnosDelDia, totalSlots: 0, slotsLibres: 0 };
    }

    const slots = generarSlotsDelDia(config.inicio, config.fin);
    let slotsOcupados = 0;
    slots.forEach(slot => {
      if (slotOcupado(slot, turnosDelDia)) slotsOcupados++;
    });

    const slotsLibres = slots.length - slotsOcupados;

    if (turnosDelDia.length === 0) {
      return { estado: 'libre', turnosDelDia, totalSlots: slots.length, slotsLibres };
    } else if (slotsLibres === 0) {
      return { estado: 'completo', turnosDelDia, totalSlots: slots.length, slotsLibres: 0 };
    } else {
      return { estado: 'parcial', turnosDelDia, totalSlots: slots.length, slotsLibres };
    }
  };

  // Construir la grilla
  const celdas = [];
  // Celdas vacías antes del primer día
  for (let i = 0; i < primerDiaSemana; i++) {
    celdas.push(<div key={`empty-${i}`} className="cal-celda cal-celda-vacia"></div>);
  }
  // Días del mes
  for (let d = 1; d <= diasEnMes; d++) {
    const info = getInfoDia(d);
    const esHoy = d === hoy.getDate() && mesActual === hoy.getMonth() && anioActual === hoy.getFullYear();
    const esSeleccionado = diaSeleccionado === d;

    let claseEstado = 'cal-dia-inactivo';
    if (info.estado === 'libre') claseEstado = 'cal-dia-libre';
    else if (info.estado === 'parcial') claseEstado = 'cal-dia-parcial';
    else if (info.estado === 'completo') claseEstado = 'cal-dia-completo';

    celdas.push(
      <div
        key={d}
        className={`cal-celda cal-celda-dia ${claseEstado} ${esHoy ? 'cal-dia-hoy' : ''} ${esSeleccionado ? 'cal-dia-seleccionado' : ''} ${info.estado !== 'inactivo' ? 'cal-celda-clickable' : ''}`}
        onClick={() => {
          if (info.estado !== 'inactivo') {
            setDiaSeleccionado(d);
            setSlotActivo(null);
          }
        }}
      >
        <div className="d-flex flex-column align-items-end w-100">
          <span className="cal-dia-numero">{d}</span>
          {info.estado === 'completo' && <span className="cal-badge-lleno">(lleno)</span>}
        </div>
        {info.estado !== 'inactivo' && (
          <div className="cal-dia-indicadores">
            {info.turnosDelDia.length > 0 && (
              <span className="cal-badge-turnos">{info.turnosDelDia.length}</span>
            )}
            <span className={`cal-dot cal-dot-${info.estado}`}></span>
          </div>
        )}
      </div>
    );
  }

  // Detalle del día seleccionado
  const renderDetalleDia = () => {
    if (!diaSeleccionado || !horarioLaboral) return null;

    const fecha = new Date(anioActual, mesActual, diaSeleccionado);
    const diaSemana = fecha.getDay();
    const nombreDia = DIAS_NOMBRE_MAP[diaSemana];
    const config = horarioLaboral[nombreDia];

    if (!config?.activo) return null;

    const slots = generarSlotsDelDia(config.inicio, config.fin);
    const turnosDelDia = turnosPorDia[diaSeleccionado] || [];

    const fechaStr = fecha.toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
      <div className="cal-detalle-dia mt-3">
        <div className="cal-detalle-header d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fs-6 text-capitalize" style={{ color: 'var(--primary-color)' }}>
            <i className="bi bi-calendar-day me-2"></i>
            {fechaStr}
          </h5>
          <button
            className="btn btn-sm btn-outline-secondary px-2 py-1"
            onClick={() => { setDiaSeleccionado(null); setSlotActivo(null); }}
            style={{ height: '30px', fontSize: '0.8rem' }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="cal-slots-grid">
          {slots.map((slotHora, idx) => {
            const turnoEnSlot = slotOcupado(slotHora, turnosDelDia);
            const esPasado = new Date(anioActual, mesActual, diaSeleccionado,
              ...slotHora.split(':').map(Number)) < new Date();

            if (turnoEnSlot) {
              // Verificar si este es el primer slot del turno para no duplicar
              const turnoInicio = new Date(turnoEnSlot.fechaHora);
              const turnoHora = `${String(turnoInicio.getHours()).padStart(2, '0')}:${String(turnoInicio.getMinutes()).padStart(2, '0')}`;
              const esPrimerSlot = turnoHora === slotHora;

              if (!esPrimerSlot) return null; // No mostrar slots intermedios del turno

              const duracion = turnoEnSlot.duracionMinutos || 30;
              const horaFin = new Date(turnoInicio.getTime() + duracion * 60000);
              const horaFinStr = `${String(horaFin.getHours()).padStart(2, '0')}:${String(horaFin.getMinutes()).padStart(2, '0')}`;

              const esMiPaciente = pacienteId && turnoEnSlot.Paciente?.id === parseInt(pacienteId);

              return (
                <div key={idx} 
                     className={`cal-slot cal-slot-ocupado ${esMiPaciente ? 'cal-slot-mi-paciente' : ''}`}
                     onClick={() => window.alert(`No puedes agendar un turno a las ${slotHora} porque se superpone con un turno que ya tienes programado (${turnoEnSlot.duracionMinutos} min).`)}
                     style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex w-100 justify-content-between align-items-center">
                    <div>
                      <div className="cal-slot-hora">
                        <i className="bi bi-clock-fill me-1"></i>
                        {slotHora} - {horaFinStr}
                      </div>
                      <div className="cal-slot-info mt-1">
                        <span className="cal-slot-paciente">
                          <i className="bi bi-person-fill me-1"></i>
                          {turnoEnSlot.Paciente?.nombre || 'Paciente'}
                        </span>
                        <span className={`cal-slot-estado badge ms-2 ${
                          turnoEnSlot.estado === 'Confirmado' ? 'bg-primary' :
                          turnoEnSlot.estado === 'Atendido' ? 'bg-success' :
                          'bg-warning text-dark'
                        }`}>
                          {turnoEnSlot.estado}
                        </span>
                      </div>
                      {turnoEnSlot.notas && (
                        <div className="cal-slot-notas text-muted mt-1">
                          <small><i className="bi bi-chat-left-text me-1"></i>{turnoEnSlot.notas}</small>
                        </div>
                      )}
                      <div className="cal-slot-duracion mt-1">
                        <small className="text-muted">
                          <i className="bi bi-hourglass-split me-1"></i>{duracion} min
                        </small>
                      </div>
                    </div>

                    <div className="d-flex flex-column gap-2 ms-3">
                      {onEditClick && (
                        <button 
                          className="btn btn-sm btn-outline-primary p-1"
                          onClick={(e) => { e.stopPropagation(); onEditClick(turnoEnSlot); }}
                          title="Editar turno"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      )}
                      {onDeleteClick && (
                        <button 
                          className="btn btn-sm btn-outline-danger p-1"
                          onClick={(e) => { e.stopPropagation(); onDeleteClick(turnoEnSlot.id); }}
                          title="Eliminar turno"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Slot libre
            return (
              <React.Fragment key={idx}>
                <div
                  className={`cal-slot cal-slot-libre ${esPasado ? 'cal-slot-pasado' : ''} ${modoSeleccion && !esPasado ? 'cal-slot-seleccionable' : ''} ${slotActivo === slotHora ? 'cal-slot-activo' : ''}`}
                  onClick={() => {
                    if (modoSeleccion && !esPasado && onSlotClick) {
                      setSlotActivo(slotHora);
                      const fechaISO = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${String(diaSeleccionado).padStart(2, '0')}T${slotHora}:00`;
                      onSlotClick(fechaISO, slotHora, `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${String(diaSeleccionado).padStart(2, '0')}`);
                    }
                  }}
                  style={slotActivo === slotHora ? { backgroundColor: 'var(--bs-primary-bg-subtle)', borderColor: 'var(--bs-primary)', borderWidth: '2px' } : {}}
                >
                  <div className="cal-slot-hora">
                    <i className="bi bi-clock me-1"></i>
                    {slotHora}
                  </div>
                  <div className="cal-slot-info">
                    {!esPasado && modoSeleccion ? (
                      <span className={slotActivo === slotHora ? 'text-primary font-weight-bold' : 'cal-slot-disponible text-success'}>
                        <i className={`bi ${slotActivo === slotHora ? 'bi-check-circle-fill' : 'bi-plus-circle'} me-1`}></i>
                        {slotActivo === slotHora ? 'Seleccionado' : 'Disponible'}
                      </span>
                    ) : esPasado ? (
                      <span className="text-muted"><small>Pasado</small></span>
                    ) : (
                      <span className="cal-slot-disponible text-success">
                        <i className="bi bi-check-circle me-1"></i>Libre
                      </span>
                    )}
                  </div>
                </div>
                {slotActivo === slotHora && renderSlotDetails && (
                  <div className="p-3 mb-3 border rounded-bottom" style={{ backgroundColor: '#f8f9fa', marginTop: '-8px', borderTop: 'none', borderLeft: '2px solid var(--bs-primary)', borderRight: '2px solid var(--bs-primary)', borderBottom: '2px solid var(--bs-primary)' }}>
                    {renderSlotDetails(slotHora)}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="cal-leyenda mt-3 d-flex gap-3 flex-wrap" style={{ fontSize: '0.78rem' }}>
          <span><span className="cal-dot cal-dot-libre d-inline-block me-1"></span> Disponible</span>
          <span><span className="cal-dot cal-dot-parcial d-inline-block me-1"></span> Parcial</span>
          <span><span className="cal-dot cal-dot-completo d-inline-block me-1"></span> Completo</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`cal-container ${compacto ? 'cal-compacto' : ''}`}>
      {/* Header con navegación */}
      <div className="cal-header">
        <button
          className="cal-nav-btn"
          onClick={mesAnterior}
          title="Mes anterior"
        >
          <i className="bi bi-chevron-left"></i>
        </button>
        <h4 className="cal-titulo mb-0">
          {MESES_NOMBRE[mesActual]} {anioActual}
        </h4>
        <button
          className="cal-nav-btn"
          onClick={mesSiguiente}
          title="Mes siguiente"
        >
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-4">
          <div className="spinner-border spinner-border-sm spinner-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2 text-muted mb-0" style={{ fontSize: '0.85rem' }}>Cargando calendario...</p>
        </div>
      ) : (
        <>
          {!horarioLaboral && (
            <div className="alert alert-info py-2 mb-3" style={{ fontSize: '0.85rem' }}>
              <i className="bi bi-info-circle me-1"></i>
              Configurá tu horario laboral para ver la disponibilidad.
            </div>
          )}

          {/* Días de la semana */}
          <div className="cal-dias-semana">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="cal-dia-header">{d}</div>
            ))}
          </div>

          {/* Grilla de días */}
          <div className="cal-grilla">
            {celdas}
          </div>

          {/* Detalle del día */}
          {renderDetalleDia()}
        </>
      )}
    </div>
  );
};

export default CalendarioTurnos;
