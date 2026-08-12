import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import turnosService from './services/turnos.service';
import practicasService from './services/practicas.service';
import AdvertenciaFrecuenciaModal from './AdvertenciaFrecuenciaModal';

const CrearTurnoModal = ({ show, onHide, paciente, tratamientos, onSave }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState(null);

  const [codigoPractica, setCodigoPractica] = useState('');
  const [nombrePractica, setNombrePractica] = useState('');
  const [piezaDental, setPiezaDental] = useState('');
  const [caraDental, setCaraDental] = useState('');
  const [alcanceNew, setAlcanceNew] = useState('paciente');
  const [mesesNew, setMesesNew] = useState('12');
  const [esNuevaPractica, setEsNuevaPractica] = useState(false);

  const [validacionResult, setValidacionResult] = useState(null);
  const [showAdvertencia, setShowAdvertencia] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  if (!show || !paciente) return null;

  const onSubmit = async (data) => {
    try {
      setErrorApi(null);
      setCargando(true);

      // Si es una práctica nueva que el profesional carga por primera vez
      if (codigoPractica.trim() && esNuevaPractica && nombrePractica.trim()) {
        await practicasService.savePractica({
          codigo: codigoPractica.trim(),
          nombre: nombrePractica.trim(),
          alcance: alcanceNew,
          mesesFrecuencia: parseInt(mesesNew) || 0
        });
        setEsNuevaPractica(false);
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
        tratamientoId: data.tratamientoId ? parseInt(data.tratamientoId) : null,
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
      setPiezaDental('');
      setCaraDental('');
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
        <div className="modal-dialog modal-dialog-centered">
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
                      <h6 className="font-weight-bold text-primary mb-2" style={{ fontSize: '0.9rem' }}>
                        <i className="bi bi-tag-fill me-1"></i> Código de Práctica a Realizar (Opcional)
                      </h6>
                      <div className="row g-2">
                        <div className="col-12 col-sm-5">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Código (ej. 02.01)"
                            value={codigoPractica}
                            onChange={async (e) => {
                              const val = e.target.value;
                              setCodigoPractica(val);
                              if (val.trim().length >= 2) {
                                const search = await practicasService.buscarCodigo(val);
                                if (search.existe) {
                                  setNombrePractica(search.practica.nombre);
                                  setEsNuevaPractica(false);
                                } else {
                                  setEsNuevaPractica(true);
                                  setNombrePractica('');
                                }
                              } else {
                                setEsNuevaPractica(false);
                              }
                            }}
                          />
                        </div>
                        <div className="col-12 col-sm-7">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Nombre de la práctica"
                            value={nombrePractica}
                            onChange={(e) => setNombrePractica(e.target.value)}
                          />
                        </div>

                        {esNuevaPractica && (
                          <div className="col-12 mt-2 p-2 bg-white rounded border border-info">
                            <small className="text-info font-weight-bold d-block mb-1">
                              <i className="bi bi-info-circle me-1"></i> Nueva Práctica: Define la regla de refacturación
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
                        )}

                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Pieza (ej. 18)" value={piezaDental} onChange={(e) => setPiezaDental(e.target.value)} />
                        </div>
                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Cara (ej. Oclusal)" value={caraDental} onChange={(e) => setCaraDental(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-8">
                    <label className="form-label font-weight-bold">Plan de Tratamiento</label>
                    <select className="form-select" {...register('tratamientoId')} disabled={cargando}>
                      <option value="">General / Sin plan asignado</option>
                      {tratamientos && tratamientos.map(t => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-sm-4">
                    <label className="form-label font-weight-bold">Duración</label>
                    <select className="form-select" {...register('duracionMinutos')} defaultValue="30" disabled={cargando}>
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min (1 hr)</option>
                      <option value="90">90 min</option>
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
