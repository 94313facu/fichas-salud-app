import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import pacientesService from './services/pacientes.service';
import obrasSocialesService from './services/obrasSociales.service';

const LISTA_AFECCIONES = [
  { id: 'problemasCardiacos', label: 'Problemas cardíacos' },
  { id: 'presionAlta', label: 'Presión sanguínea alta' },
  { id: 'presionBaja', label: 'Presión sanguínea baja' },
  { id: 'fiebreReumatica', label: 'Fiebre reumática' },
  { id: 'hepatitis', label: 'Hepatitis' },
  { id: 'problemasGastricos', label: 'Problemas gástricos' },
  { id: 'problemasRenales', label: 'Problemas renales' },
  { id: 'hivSida', label: 'HIV / Sida' },
  { id: 'epilepsia', label: 'Epilepsia' },
  { id: 'artritisArtrosis', label: 'Artritis o Artrosis' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'alteracionesNerviosas', label: 'Alteraciones nerviosas' },
  { id: 'cefaleas', label: 'Cefaleas' }
];

const EditarPacienteModal = ({ show, onHide, paciente, obrasSociales, setObrasSociales, onSave }) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  
  const [tabActiva, setTabActiva] = useState('datos');
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState(null);

  const [mostrarNuevaObra, setMostrarNuevaObra] = useState(false);
  const [nuevaObraNombre, setNuevaObraNombre] = useState('');
  const [creandoObra, setCreandoObra] = useState(false);
  const [errorObra, setErrorObra] = useState('');

  const [afeccionesState, setAfeccionesState] = useState({});

  useEffect(() => {
    if (paciente) {
      setValue('numeroFicha', paciente.numeroFicha || '');
      setValue('nombre', paciente.nombre || '');
      setValue('telefono', paciente.telefono || '');
      setValue('emailContact', paciente.emailContact || '');
      setValue('direccion', paciente.direccion || '');
      setValue('localidad', paciente.localidad || '');
      setValue('codigoPostal', paciente.codigoPostal || '');
      setValue('fechaNacimiento', paciente.fechaNacimiento || '');
      setValue('edad', paciente.edad || '');
      setValue('actividad', paciente.actividad || '');
      setValue('deriva', paciente.deriva || '');
      setValue('medicoClinico', paciente.medicoClinico || '');
      setValue('medicoClinicoTelefono', paciente.medicoClinicoTelefono || '');
      setValue('obraSocialId', paciente.obraSocialId || '');
      setValue('numeroAfiliado', paciente.numeroAfiliado || '');
      setValue('planObraSocial', paciente.planObraSocial || '');
      setValue('servicioEmergencia', paciente.servicioEmergencia || '');
      setValue('contactoEmergencia', paciente.contactoEmergencia || '');
      setValue('aparatologia', paciente.aparatologia || '');
      setValue('alergiasMedicamentos', paciente.alergiasMedicamentos || paciente.antecedentesAlergias || '');
      setValue('propensoHemorragias', paciente.propensoHemorragias ? 'true' : 'false');
      setValue('medicamentoHabitual', paciente.medicamentoHabitual || paciente.antecedentesMedicacion || '');
      setValue('fuma', paciente.fuma ? 'true' : 'false');
      setValue('otrasEnfermedades', paciente.otrasEnfermedades || paciente.antecedentesEnfermedades || '');
      setValue('antecedentesHereditarios', paciente.antecedentesHereditarios || paciente.antecedentesHereditarias || '');
      setValue('embarazada', paciente.embarazada ? 'true' : 'false');

      setAfeccionesState(paciente.afecciones || {});
    }
  }, [paciente, setValue]);

  const toggleAfeccion = (key) => {
    setAfeccionesState(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCrearObraSocial = async () => {
    if (!nuevaObraNombre || nuevaObraNombre.trim() === '') {
      setErrorObra('El nombre de la obra social es obligatorio.');
      return;
    }
    try {
      setCreandoObra(true);
      setErrorObra('');
      const creada = await obrasSocialesService.createObraSocial(nuevaObraNombre.trim());
      setObrasSociales([...obrasSociales, creada]);
      setValue('obraSocialId', creada.id);
      setNuevaObraNombre('');
      setMostrarNuevaObra(false);
    } catch (err) {
      setErrorObra(err.mensaje || 'Error al crear la obra social.');
    } finally {
      setCreandoObra(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setErrorApi(null);
      setCargando(true);

      const pacientePayload = {
        ...data,
        afecciones: afeccionesState,
        propensoHemorragias: data.propensoHemorragias === 'true',
        fuma: data.fuma === 'true',
        embarazada: data.embarazada === 'true',
        obraSocialId: data.obraSocialId ? parseInt(data.obraSocialId) : null
      };

      const actualizado = await pacientesService.updatePaciente(paciente.id, pacientePayload);
      onSave(actualizado);
      onHide();
    } catch (err) {
      setErrorApi(err.mensaje || 'Error al actualizar la ficha médica.');
    } finally {
      setCargando(false);
    }
  };

  if (!show || !paciente) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', overflowY: 'auto' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: '92vh' }}>
        <div className="modal-content shadow-lg border-0" style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
          
          <div className="modal-header bg-warning text-dark py-3 flex-shrink-0">
            <h5 className="modal-title font-weight-bold d-flex align-items-center fs-5">
              <i className="bi bi-pencil-square me-2"></i>
              Editar Historia Clínica: {paciente.nombre}
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onHide}
              disabled={cargando}
            ></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
            
            <div className="bg-light border-bottom px-3 pt-2 flex-shrink-0">
              <ul className="nav nav-tabs border-bottom-0">
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${tabActiva === 'datos' ? 'active font-weight-bold text-primary bg-white' : 'text-secondary'}`}
                    onClick={() => setTabActiva('datos')}
                  >
                    <i className="bi bi-person-lines-fill me-1"></i> 1. Datos Personales y Cobertura
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${tabActiva === 'anamnesis' ? 'active font-weight-bold text-primary bg-white' : 'text-secondary'}`}
                    onClick={() => setTabActiva('anamnesis')}
                  >
                    <i className="bi bi-heart-pulse-fill me-1 text-danger"></i> 2. Cuestionario de Salud (Anamnesis)
                  </button>
                </li>
              </ul>
            </div>

            <div className="modal-body p-4 flex-grow-1" style={{ overflowY: 'auto', maxHeight: 'calc(92vh - 160px)' }}>
              {errorApi && (
                <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                  <div>{errorApi}</div>
                </div>
              )}

              {/* PESTAÑA 1 */}
              {tabActiva === 'datos' && (
                <div className="row g-3">
                  <div className="col-12 col-sm-4">
                    <label className="form-label font-weight-bold">Historia Clínica Nº</label>
                    <input type="text" className="form-control" {...register('numeroFicha')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-8">
                    <label className="form-label font-weight-bold">Apellido y Nombre <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control ${errors.nombre ? 'is-invalid' : ''}`} {...register('nombre', { required: 'El nombre es obligatorio.' })} disabled={cargando} />
                    {errors.nombre && <div className="invalid-feedback">{errors.nombre.message}</div>}
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label font-weight-bold">Teléfono de contacto</label>
                    <input type="text" className="form-control" {...register('telefono')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label font-weight-bold">Correo Electrónico</label>
                    <input type="email" className="form-control" {...register('emailContact')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label font-weight-bold">Domicilio</label>
                    <input type="text" className="form-control" {...register('direccion')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-3">
                    <label className="form-label font-weight-bold">Localidad</label>
                    <input type="text" className="form-control" {...register('localidad')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-3">
                    <label className="form-label font-weight-bold">C.P.</label>
                    <input type="text" className="form-control" {...register('codigoPostal')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-4">
                    <label className="form-label font-weight-bold">Fecha de Nacimiento</label>
                    <input type="date" className="form-control" {...register('fechaNacimiento')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-2">
                    <label className="form-label font-weight-bold">Edad</label>
                    <input type="number" className="form-control" {...register('edad')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-3">
                    <label className="form-label font-weight-bold">Actividad / Ocupación</label>
                    <input type="text" className="form-control" {...register('actividad')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-3">
                    <label className="form-label font-weight-bold">Deriva (Referido por)</label>
                    <input type="text" className="form-control" {...register('deriva')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label font-weight-bold">Médico Clínico</label>
                    <input type="text" className="form-control" {...register('medicoClinico')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label font-weight-bold">Teléfono del Médico Clínico</label>
                    <input type="text" className="form-control" {...register('medicoClinicoTelefono')} disabled={cargando} />
                  </div>

                  <div className="col-12 mt-4">
                    <h6 className="font-weight-bold text-primary border-bottom pb-2">
                      <i className="bi bi-shield-plus me-1"></i> Cobertura Médica y Emergencias
                    </h6>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label font-weight-bold">Obra Social</label>
                    <div className="d-flex gap-2">
                      <select className="form-select" {...register('obraSocialId')} disabled={cargando}>
                        <option value="">Particular / Sin Obra Social</option>
                        {obrasSociales.map((os) => (
                          <option key={os.id} value={os.id}>{os.nombre}</option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-outline-accent text-nowrap" onClick={() => setMostrarNuevaObra(!mostrarNuevaObra)}>
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>

                    {mostrarNuevaObra && (
                      <div className="card p-2 mt-2 bg-light border">
                        <div className="input-group input-group-sm">
                          <input type="text" className="form-control" placeholder="Nombre nueva obra social" value={nuevaObraNombre} onChange={(e) => setNuevaObraNombre(e.target.value)} />
                          <button className="btn btn-accent text-white" type="button" onClick={handleCrearObraSocial} disabled={creandoObra}>Guardar</button>
                        </div>
                        {errorObra && <small className="text-danger mt-1">{errorObra}</small>}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-sm-3">
                    <label className="form-label font-weight-bold">Nº de Afiliado</label>
                    <input type="text" className="form-control" {...register('numeroAfiliado')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-3">
                    <label className="form-label font-weight-bold">Plan</label>
                    <input type="text" className="form-control" {...register('planObraSocial')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label font-weight-bold">Servicio de Emergencias</label>
                    <input type="text" className="form-control" {...register('servicioEmergencia')} disabled={cargando} />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label font-weight-bold text-danger">
                      <i className="bi bi-telephone-fill me-1"></i> Contacto de Emergencia
                    </label>
                    <input type="text" className="form-control border-danger-subtle" {...register('contactoEmergencia')} disabled={cargando} />
                  </div>

                  <div className="col-12">
                    <label className="form-label font-weight-bold">Aparatología</label>
                    <input type="text" className="form-control" {...register('aparatologia')} disabled={cargando} />
                  </div>
                </div>
              )}

              {/* PESTAÑA 2 */}
              {tabActiva === 'anamnesis' && (
                <div>
                  <div className="alert alert-info py-2 mb-3" style={{ fontSize: '0.88rem' }}>
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Indique si el paciente padece o ha padecido alguna de las siguientes afecciones:
                  </div>

                  <div className="row g-2 p-3 bg-light rounded border mb-4">
                    {LISTA_AFECCIONES.map((item) => (
                      <div key={item.id} className="col-12 col-sm-6">
                        <div className="form-check p-2 rounded bg-white border">
                          <input
                            type="checkbox"
                            className="form-check-input ms-0 me-2 cursor-pointer"
                            id={`afec_edit_${item.id}`}
                            checked={!!afeccionesState[item.id]}
                            onChange={() => toggleAfeccion(item.id)}
                            disabled={cargando}
                          />
                          <label className="form-check-label font-weight-bold cursor-pointer text-dark" htmlFor={`afec_edit_${item.id}`}>
                            {item.label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h6 className="font-weight-bold text-primary border-bottom pb-2 mb-3">
                    <i className="bi bi-clipboard-pulse me-1"></i> Cuestionario Detallado de Salud
                  </h6>

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label font-weight-bold">¿Es alérgico/a a alguna droga o medicamento?</label>
                      <input type="text" className="form-control" {...register('alergiasMedicamentos')} disabled={cargando} />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label font-weight-bold">¿Es propenso/a a las hemorragias?</label>
                      <div className="d-flex gap-4">
                        <div className="form-check">
                          <input type="radio" value="true" className="form-check-input" id="hem_edit_si" {...register('propensoHemorragias')} />
                          <label className="form-check-label" htmlFor="hem_edit_si">Sí</label>
                        </div>
                        <div className="form-check">
                          <input type="radio" value="false" className="form-check-input" id="hem_edit_no" {...register('propensoHemorragias')} />
                          <label className="form-check-label" htmlFor="hem_edit_no">No</label>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label font-weight-bold">¿Fuma?</label>
                      <div className="d-flex gap-4">
                        <div className="form-check">
                          <input type="radio" value="true" className="form-check-input" id="fuma_edit_si" {...register('fuma')} />
                          <label className="form-check-label" htmlFor="fuma_edit_si">Sí</label>
                        </div>
                        <div className="form-check">
                          <input type="radio" value="false" className="form-check-input" id="fuma_edit_no" {...register('fuma')} />
                          <label className="form-check-label" htmlFor="fuma_edit_no">No</label>
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label font-weight-bold">¿Toma algún medicamento actualmente?</label>
                      <input type="text" className="form-control" {...register('medicamentoHabitual')} disabled={cargando} />
                    </div>

                    <div className="col-12">
                      <label className="form-label font-weight-bold">¿Tiene o ha tenido alguna otra enfermedad o afección no mencionada?</label>
                      <input type="text" className="form-control" {...register('otrasEnfermedades')} disabled={cargando} />
                    </div>

                    <div className="col-12">
                      <label className="form-label font-weight-bold">¿Tiene algún antecedente hereditario de importancia?</label>
                      <input type="text" className="form-control" {...register('antecedentesHereditarios')} disabled={cargando} />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label font-weight-bold">Si es mujer, ¿está embarazada?</label>
                      <div className="d-flex gap-4">
                        <div className="form-check">
                          <input type="radio" value="true" className="form-check-input" id="emb_edit_si" {...register('embarazada')} />
                          <label className="form-check-label" htmlFor="emb_edit_si">Sí</label>
                        </div>
                        <div className="form-check">
                          <input type="radio" value="false" className="form-check-input" id="emb_edit_no" {...register('embarazada')} />
                          <label className="form-check-label" htmlFor="emb_edit_no">No / No aplica</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer bg-light d-flex justify-content-between flex-shrink-0 py-3">
              {tabActiva === 'datos' ? (
                <button type="button" className="btn btn-outline-primary font-weight-bold" onClick={() => setTabActiva('anamnesis')}>
                  Ir al Cuestionario de Salud <i className="bi bi-arrow-right ms-1"></i>
                </button>
              ) : (
                <button type="button" className="btn btn-outline-secondary font-weight-bold" onClick={() => setTabActiva('datos')}>
                  <i className="bi bi-arrow-left me-1"></i> Volver a Datos Personales
                </button>
              )}

              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={onHide} disabled={cargando}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-warning text-dark font-weight-bold px-4" disabled={cargando}>
                  {cargando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Actualizando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditarPacienteModal;
