import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import turnosService from './services/turnos.service';
import practicasService from './services/practicas.service';
import AdvertenciaFrecuenciaModal from './AdvertenciaFrecuenciaModal';
import CalendarioTurnos from './CalendarioTurnos';

const CrearTurnoModal = ({ show, onHide, paciente, onSave }) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState(null);

  const [codigoPractica, setCodigoPractica] = useState('');
  const [nombrePractica, setNombrePractica] = useState('');
  const [isNuevaPractica, setIsNuevaPractica] = useState(false);
  const [piezaDental, setPiezaDental] = useState('');
  const [caraDental, setCaraDental] = useState('');
  const [alcanceNew, setAlcanceNew] = useState('paciente');
  const [mesesNew, setMesesNew] = useState('12');

  const [validacionResult, setValidacionResult] = useState(null);
  const [showAdvertencia, setShowAdvertencia] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  
  const [catalogoPracticas, setCatalogoPracticas] = useState([]);

  // Estado para mostrar/ocultar el calendario
  const [showCalendario, setShowCalendario] = useState(true);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);

  React.useEffect(() => {
    if (show) {
      practicasService.getPracticas().then(setCatalogoPracticas).catch(console.error);
      setSlotSeleccionado(null);
      setShowCalendario(true);
    }
  }, [show]);

  if (!show || !paciente) return null;

  // Cuando se selecciona un slot desde el calendario
  const handleSlotClick = (fechaHoraISO, hora, fecha) => {
    setValue('fecha', fecha);
    setValue('hora', hora);
    setSlotSeleccionado({ fecha, hora, fechaHoraISO });
  };

  const onSubmit = async (data) => {
    try {
      setErrorApi(null);
      setCargando(true);

      // Guardar o actualizar regla de práctica si se ingresó nombre
      if (codigoPractica.trim() && nombrePractica.trim()) {
        await practicasService.savePractica({
          codigo: codigoPractica.trim(),
          nombre: nombrePractica.trim(),
          alcance: alcanceNew,
          mesesFrecuencia: parseInt(mesesNew) || 0,
          obraSocialId: paciente?.obraSocialId || null,
          planObraSocialId: paciente?.planObraSocialId || null
        });
      }

      // Validar frecuencia si ingresó un código de práctica
      if (codigoPractica.trim()) {
        const val = await practicasService.validarFrecuencia(
          paciente.id,
          codigoPractica.trim(),
          piezaDental,
          caraDental,
          data.fecha
        );

        if (!val.valido) {
          setValidacionResult(val);
          setPendingFormData(data);
          setShowAdvertencia(true);
          setCargando(false);
          return;
        }
      }

      await ejecutarGuardadoTurno(data, 'obra_social');
    } catch (err) {
      setErrorApi(err.mensaje || 'Error al agendar el turno.');
      setCargando(false);
    }
  };

  const ejecutarGuardadoTurno = async (data, modalidadCobro = 'obra_social') => {
    try {
      setCargando(true);
      setErrorApi(null);

      const fechaHoraCombo = `${data.fecha}T${data.hora}:00`;

      const turnoPayload = {
        pacienteId: paciente.id,

        fechaHora: fechaHoraCombo,
        duracionMinutos: parseInt(data.duracionMinutos) || 30,
        notas: data.notas ? data.notas.trim() : null,
        codigoPractica: codigoPractica.trim() || null,
        piezaDental: piezaDental.trim() || null,
        caraDental: caraDental.trim() || null,
        modalidadCobro,
        estado: 'Pendiente'
      };

      const nuevoTurno = await turnosService.createTurno(turnoPayload);
      reset();
      setCodigoPractica('');
      setNombrePractica('');
      setIsNuevaPractica(false);
      setPiezaDental('');
      setCaraDental('');
      setSlotSeleccionado(null);
      onSave(nuevoTurno);
      onHide();
    } catch (err) {
      setErrorApi(err.mensaje || 'Error al agendar el turno.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
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

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
                    />
                  )}

                  {slotSeleccionado && (
                    <div className="alert alert-success py-2 mt-2 mb-0 d-flex align-items-center" style={{ fontSize: '0.88rem' }}>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Seleccionado: <strong className="ms-1">{slotSeleccionado.fecha}</strong> a las <strong className="ms-1">{slotSeleccionado.hora} hs</strong>
                    </div>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label font-weight-bold">Fecha <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className={`form-control ${errors.fecha ? 'is-invalid' : ''}`}
                      {...register('fecha', { required: 'La fecha es obligatoria.' })}
                      disabled={cargando}
                    />
                    {errors.fecha && <div className="invalid-feedback">{errors.fecha.message}</div>}
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label font-weight-bold">Hora <span className="text-danger">*</span></label>
                    <input
                      type="time"
                      className={`form-control ${errors.hora ? 'is-invalid' : ''}`}
                      {...register('hora', { required: 'La hora es obligatoria.' })}
                      disabled={cargando}
                    />
                    {errors.hora && <div className="invalid-feedback">{errors.hora.message}</div>}
                  </div>

                  {/* Código de Práctica y Facturación */}
                  <div className="col-12">
                    <div className="p-3 bg-light rounded border">
                      <div className="row g-2">
                        <div className="col-12 col-sm-7">
                          {isNuevaPractica ? (
                            <div className="d-flex gap-2">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Ej. Nueva práctica..."
                                value={nombrePractica}
                                onChange={(e) => setNombrePractica(e.target.value)}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary px-2"
                                onClick={() => {
                                  setIsNuevaPractica(false);
                                  setNombrePractica('');
                                  setCodigoPractica('');
                                }}
                                title="Cancelar y seleccionar de la lista"
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </div>
                          ) : (
                            <select
                              className="form-select form-select-sm"
                              value={nombrePractica}
                              onChange={async (e) => {
                                const val = e.target.value;
                                if (val === '__NUEVA__') {
                                  setIsNuevaPractica(true);
                                  setNombrePractica('');
                                  setCodigoPractica('');
                                  setMesesNew(0);
                                } else {
                                  setNombrePractica(val);
                                  const practica = catalogoPracticas.find(p => p.nombre.toLowerCase() === val.toLowerCase());
                                  if (practica) {
                                    setCodigoPractica(practica.codigo);
                                    const search = await practicasService.buscarCodigo(practica.codigo, paciente?.obraSocialId, paciente?.planObraSocialId);
                                    if (search.existe) {
                                      setAlcanceNew(search.practica.alcance || 'paciente');
                                      setMesesNew(search.practica.mesesFrecuencia !== undefined ? search.practica.mesesFrecuencia : 0);
                                    }
                                  }
                                }
                              }}
                            >
                              <option value="">Seleccione una práctica...</option>
                              {catalogoPracticas.filter((p, index, self) => index === self.findIndex((t) => t.nombre.toLowerCase() === p.nombre.toLowerCase())).map(p => (
                                <option key={p.id} value={p.nombre}>{p.nombre}</option>
                              ))}
                              <option value="__NUEVA__" className="fw-bold text-primary">+ Crear nueva práctica...</option>
                            </select>
                          )}
                        </div>
                        <div className="col-12 col-sm-5">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Código (ej. 02.01)"
                            value={codigoPractica}
                            onChange={async (e) => {
                              const val = e.target.value;
                              setCodigoPractica(val);
                              if (val) {
                                const search = await practicasService.buscarCodigo(val, paciente?.obraSocialId, paciente?.planObraSocialId);
                                if (search.existe) {
                                  setNombrePractica(search.practica.nombre);
                                  setAlcanceNew(search.practica.alcance || 'paciente');
                                  setMesesNew(search.practica.mesesFrecuencia !== undefined ? search.practica.mesesFrecuencia : 0);
                                } else {
                                  setNombrePractica('');
                                }
                              }
                            }}
                            readOnly={!isNuevaPractica && nombrePractica !== ''}
                          />
                        </div>

                        {/* Reglas de refacturación siempre visibles */}
                        <div className="col-12 mt-2 p-2 bg-light rounded border">
                          <small className="text-secondary font-weight-bold d-block mb-1">
                            <i className="bi bi-gear-fill me-1"></i> Reglas de Refacturación para Obra Social
                            </small>
                            <div className="row g-2">
                              <div className="col-7">
                                <select className="form-select form-select-sm" value={alcanceNew} onChange={(e) => setAlcanceNew(e.target.value)}>
                                  <option value="paciente">Por Paciente (global)</option>
                                  <option value="diente">Por Diente</option>
                                  <option value="cara">Por Cara del Diente</option>
                                </select>
                              </div>
                              <div className="col-5">
                                <input type="number" className="form-control form-control-sm" placeholder="Meses (ej: 12)" value={mesesNew} onChange={(e) => setMesesNew(e.target.value)} />
                              </div>
                            </div>
                          </div>
                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Pieza (ej. 18)" value={piezaDental} onChange={(e) => setPiezaDental(e.target.value)} />
                        </div>
                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Cara (ej. Oclusal)" value={caraDental} onChange={(e) => setCaraDental(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="col-12 col-sm-4">
                    <label className="form-label font-weight-bold">Duración</label>
                    <select className="form-select" {...register('duracionMinutos')} defaultValue="30" disabled={cargando}>
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min (1 hr)</option>
                      <option value="90">90 min</option>
                      <option value="120">120 min (2 hr)</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label font-weight-bold">Notas o Indicaciones previas</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Control de ortodoncia, venir en ayunas..."
                      {...register('notas')}
                      disabled={cargando}
                    ></textarea>
                  </div>
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

      <AdvertenciaFrecuenciaModal
        show={showAdvertencia}
        onHide={() => setShowAdvertencia(false)}
        resultadoValidacion={validacionResult}
        onConfirmParticular={async () => {
          setShowAdvertencia(false);
          if (pendingFormData) await ejecutarGuardadoTurno(pendingFormData, 'particular');
        }}
        onConfirmObraSocial={async () => {
          setShowAdvertencia(false);
          if (pendingFormData) await ejecutarGuardadoTurno(pendingFormData, 'obra_social');
        }}
      />
    </>
  );
};

export default CrearTurnoModal;
