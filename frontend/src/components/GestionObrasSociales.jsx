import React, { useState, useEffect } from 'react';
import obrasSocialesService from './services/obrasSociales.service';
import practicasService from './services/practicas.service';

const GestionObrasSociales = () => {
  const [obrasSociales, setObrasSociales] = useState([]);
  const [portales, setPortales] = useState([]);
  const [practicas, setPracticas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal OS
  const [showModalOS, setShowModalOS] = useState(false);
  const [editandoOS, setEditandoOS] = useState(null);
  const [formOS, setFormOS] = useState({ nombre: '', portalFacturacionId: '', notas: '', limitePracticasMensual: '', limitePracticasAnual: '' });

  // Modal Portal
  const [showModalPortal, setShowModalPortal] = useState(false);
  const [editandoPortal, setEditandoPortal] = useState(null);
  const [formPortal, setFormPortal] = useState({ nombre: '', url: '' });

  // Modal Plan
  const [showModalPlan, setShowModalPlan] = useState(false);
  const [editandoPlan, setEditandoPlan] = useState(null);
  const [planOSId, setPlanOSId] = useState(null);
  const [formPlan, setFormPlan] = useState({ nombre: '', codigo: '' });

  // Modal Practica
  const [showModalPractica, setShowModalPractica] = useState(false);
  const [practicaOSId, setPracticaOSId] = useState(null);
  const [formPractica, setFormPractica] = useState({ codigo: '', nombre: '', alcance: 'paciente', mesesFrecuencia: '' });

  // OS expandida (para ver planes)
  const [expandedOS, setExpandedOS] = useState(null);

  // Portal Inline (desde el modal de OS)
  const [mostrarNuevoPortalInline, setMostrarNuevoPortalInline] = useState(false);
  const [nuevoPortalNombre, setNuevoPortalNombre] = useState('');
  const [nuevoPortalUrl, setNuevoPortalUrl] = useState('');
  const [creandoPortalInline, setCreandoPortalInline] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [obrasData, portalesData, practicasData] = await Promise.all([
        obrasSocialesService.getObrasSociales(),
        obrasSocialesService.getPortales(),
        practicasService.getPracticas()
      ]);
      setObrasSociales(obrasData);
      setPortales(portalesData);
      setPracticas(practicasData);
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const showExito = (msg) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(''), 4000);
  };

  // ========================
  // PORTALES CRUD
  // ========================
  const handleAbrirModalPortal = (portal = null) => {
    setEditandoPortal(portal);
    setFormPortal(portal ? { nombre: portal.nombre, url: portal.url || '' } : { nombre: '', url: '' });
    setShowModalPortal(true);
    setErrorMsg('');
  };

  const handleGuardarPortal = async () => {
    if (!formPortal.nombre.trim()) {
      setErrorMsg('El nombre del portal es obligatorio.');
      return;
    }
    try {
      setErrorMsg('');
      if (editandoPortal) {
        await obrasSocialesService.updatePortal(editandoPortal.id, formPortal);
        showExito('Portal actualizado correctamente.');
      } else {
        await obrasSocialesService.createPortal(formPortal);
        showExito('Portal creado correctamente.');
      }
      setShowModalPortal(false);
      await cargarDatos();
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al guardar el portal.');
    }
  };

  const handleEliminarPortal = async (portalId) => {
    if (!window.confirm('¿Eliminar este portal? Las obras sociales asociadas perderán su portal asignado.')) return;
    try {
      await obrasSocialesService.deletePortal(portalId);
      showExito('Portal eliminado.');
      await cargarDatos();
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al eliminar el portal.');
    }
  };

  const handleCrearPortalInline = async () => {
    if (!nuevoPortalNombre.trim()) {
      setErrorMsg('El nombre del portal es obligatorio.');
      return;
    }
    try {
      setCreandoPortalInline(true);
      setErrorMsg('');
      const creado = await obrasSocialesService.createPortal({ 
        nombre: nuevoPortalNombre.trim(),
        url: nuevoPortalUrl.trim()
      });
      setPortales([...portales, creado]);
      setFormOS({ ...formOS, portalFacturacionId: creado.id });
      setNuevoPortalNombre('');
      setNuevoPortalUrl('');
      setMostrarNuevoPortalInline(false);
      showExito('Portal creado y asignado.');
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al crear el portal.');
    } finally {
      setCreandoPortalInline(false);
    }
  };

  // ========================
  // OBRAS SOCIALES CRUD
  // ========================
  const handleAbrirModalOS = (os = null) => {
    setEditandoOS(os);
    setFormOS(os
      ? { 
          nombre: os.nombre, 
          portalFacturacionId: os.portalFacturacionId || '', 
          notas: os.notas || '',
          limitePracticasMensual: os.limitePracticasMensual || '',
          limitePracticasAnual: os.limitePracticasAnual || ''
        }
      : { nombre: '', portalFacturacionId: '', notas: '', limitePracticasMensual: '', limitePracticasAnual: '' }
    );
    setShowModalOS(true);
    setErrorMsg('');
  };

  const handleGuardarOS = async () => {
    if (!formOS.nombre.trim()) {
      setErrorMsg('El nombre de la obra social es obligatorio.');
      return;
    }
    try {
      setErrorMsg('');
      const payload = {
        nombre: formOS.nombre.trim(),
        portalFacturacionId: formOS.portalFacturacionId ? parseInt(formOS.portalFacturacionId) : null,
        notas: formOS.notas.trim() || null,
        limitePracticasMensual: formOS.limitePracticasMensual ? parseInt(formOS.limitePracticasMensual) : null,
        limitePracticasAnual: formOS.limitePracticasAnual ? parseInt(formOS.limitePracticasAnual) : null
      };
      if (editandoOS) {
        await obrasSocialesService.updateObraSocial(editandoOS.id, payload);
        showExito('Obra social actualizada.');
      } else {
        await obrasSocialesService.createObraSocial(payload);
        showExito('Obra social creada.');
      }
      setShowModalOS(false);
      await cargarDatos();
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al guardar la obra social.');
    }
  };

  const handleToggleOS = async (osId) => {
    try {
      await obrasSocialesService.toggleObraSocial(osId);
      await cargarDatos();
      showExito('Estado actualizado.');
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al cambiar estado.');
    }
  };

  const handleEliminarOS = async (osId) => {
    if (!window.confirm('¿Eliminar esta obra social? Si tiene pacientes asociados, será pausada.')) return;
    try {
      const result = await obrasSocialesService.deleteObraSocial(osId);
      showExito(result.mensaje);
      await cargarDatos();
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al eliminar.');
    }
  };

  // ========================
  // PLANES CRUD
  // ========================
  const handleAbrirModalPlan = (obraSocialId, plan = null) => {
    setPlanOSId(obraSocialId);
    setEditandoPlan(plan);
    setFormPlan(plan ? { nombre: plan.nombre, codigo: plan.codigo || '' } : { nombre: '', codigo: '' });
    setShowModalPlan(true);
    setErrorMsg('');
  };

  const handleGuardarPlan = async () => {
    if (!formPlan.nombre.trim()) {
      setErrorMsg('El nombre del plan es obligatorio.');
      return;
    }
    try {
      setErrorMsg('');
      if (editandoPlan) {
        await obrasSocialesService.updatePlan(planOSId, editandoPlan.id, formPlan);
        showExito('Plan actualizado.');
      } else {
        await obrasSocialesService.createPlan(planOSId, formPlan);
        showExito('Plan creado.');
      }
      setShowModalPlan(false);
      await cargarDatos();
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al guardar el plan.');
    }
  };

  const handleEliminarPlan = async (obraSocialId, planId) => {
    if (!window.confirm('¿Eliminar este plan? Los pacientes asociados perderán su plan asignado.')) return;
    try {
      await obrasSocialesService.deletePlan(obraSocialId, planId);
      showExito('Plan eliminado.');
      await cargarDatos();
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al eliminar el plan.');
    }
  };

  // ========================
  // PRACTICAS CRUD (Restricciones)
  // ========================
  const handleAbrirModalPractica = (obraSocialId) => {
    setPracticaOSId(obraSocialId);
    setFormPractica({ codigo: '', nombre: '', alcance: 'paciente', mesesFrecuencia: '' });
    setShowModalPractica(true);
    setErrorMsg('');
  };

  const handleGuardarPractica = async () => {
    if (!formPractica.codigo.trim() || !formPractica.nombre.trim()) {
      setErrorMsg('Código y nombre son obligatorios.');
      return;
    }
    try {
      setErrorMsg('');
      await practicasService.savePractica({
        codigo: formPractica.codigo.trim(),
        nombre: formPractica.nombre.trim(),
        alcance: formPractica.alcance,
        mesesFrecuencia: parseInt(formPractica.mesesFrecuencia) || 0,
        obraSocialId: practicaOSId
      });
      showExito('Restricción de práctica guardada.');
      setShowModalPractica(false);
      await cargarDatos();
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al guardar la práctica.');
    }
  };

  const handleEliminarPractica = async (practicaId) => {
    if (!window.confirm('¿Eliminar esta restricción?')) return;
    try {
      await practicasService.deletePractica(practicaId);
      showExito('Restricción eliminada.');
      await cargarDatos();
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al eliminar.');
    }
  };

  if (cargando) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border spinner-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2 text-muted-custom">Cargando gestión de obras sociales...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Cabecera */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <h2 className="mb-0 fs-3 d-flex align-items-center">
          <i className="bi bi-building me-2 text-primary"></i>
          Gestión de Obras Sociales
        </h2>
        <div className="d-flex gap-2">
          <button className="btn btn-accent d-flex align-items-center gap-1" onClick={() => handleAbrirModalPortal()} style={{ height: '42px' }}>
            <i className="bi bi-globe2"></i> Nuevo Portal
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-1" onClick={() => handleAbrirModalOS()} style={{ height: '42px' }}>
            <i className="bi bi-plus-lg"></i> Nueva Obra Social
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

      {/* Sección: Portales de Facturación */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fs-6 text-primary">
            <i className="bi bi-globe2 me-2"></i>Portales de Facturación
          </h5>
          <span className="badge bg-light text-dark border">{portales.length} portal(es)</span>
        </div>
        <div className="card-body">
          {portales.length === 0 ? (
            <div className="text-center py-4 text-muted-custom">
              <i className="bi bi-globe fs-1 d-block mb-2 opacity-50"></i>
              <p className="mb-2">No tienes portales de facturación configurados.</p>
              <button className="btn btn-accent btn-sm" onClick={() => handleAbrirModalPortal()}>
                <i className="bi bi-plus-lg me-1"></i> Crear primer portal
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {portales.map(portal => (
                <div key={portal.id} className="col-12 col-sm-6 col-lg-4">
                  <div className="p-3 bg-light rounded border d-flex justify-content-between align-items-start os-portal-card">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="fw-bold text-dark d-flex align-items-center gap-1">
                        <i className="bi bi-box-arrow-up-right text-accent"></i>
                        {portal.nombre}
                      </div>
                      {portal.url ? (
                        <a href={portal.url} target="_blank" rel="noopener noreferrer" className="text-muted-custom small text-truncate d-block" style={{ maxWidth: '200px' }}>
                          {portal.url}
                        </a>
                      ) : (
                        <span className="text-muted small fst-italic">Sin URL configurada</span>
                      )}
                    </div>
                    <div className="d-flex gap-1 ms-2">
                      <button className="btn btn-sm btn-outline-secondary px-2 py-1" onClick={() => handleAbrirModalPortal(portal)} title="Editar">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger px-2 py-1" onClick={() => handleEliminarPortal(portal.id)} title="Eliminar">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sección: Obras Sociales */}
      {obrasSociales.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-building fs-1 text-muted d-block mb-2"></i>
            <p className="text-muted-custom mb-3">No tienes obras sociales registradas.</p>
            <button className="btn btn-primary" onClick={() => handleAbrirModalOS()}>
              <i className="bi bi-plus-lg me-1"></i> Crear primera Obra Social
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {obrasSociales.map(os => (
            <div key={os.id} className={`card border-0 shadow-sm os-card ${!os.activa ? 'os-card-paused' : ''}`}>
              <div className="card-body p-4">
                {/* Fila principal */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div className="d-flex align-items-center gap-3" style={{ minWidth: 0, flex: 1 }}>
                    <div className={`os-status-dot ${os.activa ? 'os-status-active' : 'os-status-paused'}`}></div>
                    <div style={{ minWidth: 0 }}>
                      <h5 className={`mb-1 fs-5 fw-bold ${!os.activa ? 'text-muted' : 'text-dark'}`}>
                        {os.nombre}
                      </h5>
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        {os.PortalFacturacion ? (
                          <span className="badge bg-accent-light text-accent border border-accent-subtle os-badge-portal">
                            <i className="bi bi-globe2 me-1"></i>{os.PortalFacturacion.nombre}
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border">
                            <i className="bi bi-globe2 me-1"></i>Sin portal
                          </span>
                        )}
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-people-fill me-1"></i>{os.cantidadPacientes} paciente(s)
                        </span>
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-list-ul me-1"></i>{os.PlanObraSocials?.length || 0} plan(es)
                        </span>
                        {!os.activa && (
                          <span className="badge bg-warning text-dark">
                            <i className="bi bi-pause-circle me-1"></i>Pausada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="d-flex gap-2 flex-shrink-0">
                    <button
                      className="btn btn-sm btn-outline-primary px-2 py-1 d-flex align-items-center gap-1"
                      onClick={() => setExpandedOS(expandedOS === os.id ? null : os.id)}
                      title="Ver planes"
                    >
                      <i className={`bi ${expandedOS === os.id ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i> Planes
                    </button>
                    <button className="btn btn-sm btn-outline-secondary px-2 py-1" onClick={() => handleAbrirModalOS(os)} title="Editar">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className={`btn btn-sm px-2 py-1 ${os.activa ? 'btn-outline-warning' : 'btn-outline-success'}`}
                      onClick={() => handleToggleOS(os.id)}
                      title={os.activa ? 'Pausar' : 'Activar'}
                    >
                      <i className={`bi ${os.activa ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger px-2 py-1" onClick={() => handleEliminarOS(os.id)} title="Eliminar">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                {/* Notas */}
                {os.notas && (
                  <div className="mt-2 text-muted-custom small fst-italic">
                    <i className="bi bi-chat-left-text me-1"></i>{os.notas}
                  </div>
                )}

                {/* Planes expandidos */}
                {expandedOS === os.id && (
                  <div className="mt-3 pt-3 border-top os-plans-section">
                    <div className="row">
                      <div className="col-12 col-md-6 mb-3 mb-md-0">
                        {/* SECCIÓN PLANES */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0 fw-bold text-primary" style={{ fontSize: '0.95rem' }}>
                            <i className="bi bi-list-ul me-1"></i>Planes
                          </h6>
                          <button
                            className="btn btn-sm btn-outline-primary px-2 py-1 d-flex align-items-center gap-1"
                            onClick={() => handleAbrirModalPlan(os.id)}
                          >
                            <i className="bi bi-plus-lg"></i> Agregar Plan
                          </button>
                        </div>

                        {(!os.PlanObraSocials || os.PlanObraSocials.length === 0) ? (
                          <div className="text-center py-3 bg-light rounded border text-muted-custom">
                            <i className="bi bi-clipboard-x me-1"></i> Sin planes definidos.
                          </div>
                        ) : (
                          <div className="d-flex flex-column gap-2">
                            {os.PlanObraSocials.map(plan => (
                              <div key={plan.id} className="d-flex justify-content-between align-items-center p-2 bg-light rounded border os-plan-item">
                                <div>
                                  <span className="fw-bold text-dark">{plan.nombre}</span>
                                  {plan.codigo && (
                                    <span className="badge bg-white text-muted border ms-2" style={{ fontSize: '0.78rem' }}>
                                      Cód: {plan.codigo}
                                    </span>
                                  )}
                                </div>
                                <div className="d-flex gap-1">
                                  <button className="btn btn-sm btn-outline-secondary px-2 py-0" onClick={() => handleAbrirModalPlan(os.id, plan)} title="Editar plan">
                                    <i className="bi bi-pencil" style={{ fontSize: '0.78rem' }}></i>
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger px-2 py-0" onClick={() => handleEliminarPlan(os.id, plan.id)} title="Eliminar plan">
                                    <i className="bi bi-trash" style={{ fontSize: '0.78rem' }}></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="col-12 col-md-6 border-md-start ps-md-3">
                        {/* SECCIÓN RESTRICCIONES DE PRÁCTICAS */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0 fw-bold text-danger" style={{ fontSize: '0.95rem' }}>
                            <i className="bi bi-slash-circle me-1"></i>Restricciones
                          </h6>
                          <button
                            className="btn btn-sm btn-outline-danger px-2 py-1 d-flex align-items-center gap-1"
                            onClick={() => handleAbrirModalPractica(os.id)}
                          >
                            <i className="bi bi-plus-lg"></i> Agregar Restricción
                          </button>
                        </div>
                        
                        {(() => {
                          const pracsOS = practicas.filter(p => p.obraSocialId === os.id);
                          if (pracsOS.length === 0) {
                            return (
                              <div className="text-center py-3 bg-light rounded border text-muted-custom">
                                <i className="bi bi-check-circle me-1"></i> Sin restricciones configuradas.
                              </div>
                            );
                          }
                          return (
                            <div className="d-flex flex-column gap-2">
                              {pracsOS.map(p => (
                                <div key={p.id} className="p-2 bg-light rounded border" style={{ fontSize: '0.85rem' }}>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <span className="fw-bold text-dark me-2">{p.codigo}</span>
                                      <span className="text-muted">{p.nombre}</span>
                                    </div>
                                    <button className="btn btn-sm btn-link text-danger p-0 m-0" onClick={() => handleEliminarPractica(p.id)}>
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                  <div className="mt-1 d-flex gap-2">
                                    <span className="badge bg-white text-secondary border">Alcance: {p.alcance}</span>
                                    {p.mesesFrecuencia > 0 && (
                                      <span className="badge bg-white text-danger border">Frec: {p.mesesFrecuencia} meses</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ MODAL: OBRA SOCIAL ============ */}
      {showModalOS && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModalOS(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title text-primary fw-bold">
                  <i className="bi bi-building me-2"></i>
                  {editandoOS ? 'Editar Obra Social' : 'Nueva Obra Social'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModalOS(false)}></button>
              </div>
              <div className="modal-body pt-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. OSDE, Swiss Medical, DASPU..."
                    value={formOS.nombre}
                    onChange={e => setFormOS({ ...formOS, nombre: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Portal de Facturación</label>
                  <div className="d-flex gap-2">
                    <select
                      className="form-select"
                      value={formOS.portalFacturacionId}
                      onChange={e => setFormOS({ ...formOS, portalFacturacionId: e.target.value })}
                    >
                      <option value="">— Sin portal asignado —</option>
                      {portales.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}{p.url ? ` (${p.url})` : ''}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-secondary text-nowrap"
                      onClick={() => setMostrarNuevoPortalInline(!mostrarNuevoPortalInline)}
                      title="Nuevo portal"
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                  {portales.length === 0 && !mostrarNuevoPortalInline && (
                    <small className="text-muted fst-italic mt-1 d-block">
                      <i className="bi bi-info-circle me-1"></i>Aún no creaste portales. Podés crearlos con el botón "+".
                    </small>
                  )}
                </div>

                {mostrarNuevoPortalInline && (
                  <div className="p-3 mb-3 bg-light border shadow-sm rounded">
                    <label className="form-label small fw-bold mb-1">Nombre del Portal</label>
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder="Ej. FOPC"
                      value={nuevoPortalNombre}
                      onChange={e => setNuevoPortalNombre(e.target.value)}
                    />
                    <label className="form-label small fw-bold mb-1">URL (Opcional)</label>
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder="https://..."
                      value={nuevoPortalUrl}
                      onChange={e => setNuevoPortalUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary w-100 mt-1"
                      onClick={handleCrearPortalInline}
                      disabled={creandoPortalInline}
                    >
                      Registrar Portal y Asignar
                    </button>
                  </div>
                )}

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold">Límite Mensual</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Ej. 2"
                      value={formOS.limitePracticasMensual}
                      onChange={e => setFormOS({ ...formOS, limitePracticasMensual: e.target.value })}
                    />
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>Prácticas max. por mes</small>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold">Límite Anual</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Ej. 10"
                      value={formOS.limitePracticasAnual}
                      onChange={e => setFormOS({ ...formOS, limitePracticasAnual: e.target.value })}
                    />
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>Prácticas max. por año</small>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Notas internas</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Notas sobre el convenio (opcional)"
                    value={formOS.notas}
                    onChange={e => setFormOS({ ...formOS, notas: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button className="btn btn-secondary" onClick={() => setShowModalOS(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleGuardarOS}>
                  <i className="bi bi-check-lg me-1"></i> {editandoOS ? 'Guardar Cambios' : 'Crear Obra Social'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: PORTAL ============ */}
      {showModalPortal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModalPortal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title text-accent fw-bold">
                  <i className="bi bi-globe2 me-2"></i>
                  {editandoPortal ? 'Editar Portal' : 'Nuevo Portal de Facturación'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModalPortal(false)}></button>
              </div>
              <div className="modal-body pt-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Nombre del portal *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. FOPC, OSDE Extranet, Traditum..."
                    value={formPortal.nombre}
                    onChange={e => setFormPortal({ ...formPortal, nombre: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">URL de acceso</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://www.ejemplo.com"
                    value={formPortal.url}
                    onChange={e => setFormPortal({ ...formPortal, url: e.target.value })}
                  />
                  <small className="text-muted">URL del portal donde se carga la facturación. Se usará para el botón "Facturar en Portal".</small>
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button className="btn btn-secondary" onClick={() => setShowModalPortal(false)}>Cancelar</button>
                <button className="btn btn-accent" onClick={handleGuardarPortal}>
                  <i className="bi bi-check-lg me-1"></i> {editandoPortal ? 'Guardar Cambios' : 'Crear Portal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: PLAN ============ */}
      {showModalPlan && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModalPlan(false)}>
          <div className="modal-dialog modal-dialog-centered modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title text-primary fw-bold" style={{ fontSize: '1rem' }}>
                  <i className="bi bi-list-ul me-2"></i>
                  {editandoPlan ? 'Editar Plan' : 'Nuevo Plan'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModalPlan(false)}></button>
              </div>
              <div className="modal-body pt-3">
                <div className="mb-3">
                  <label className="form-label fw-bold">Nombre del plan *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Plan 210, PMO, Plan Familiar"
                    value={formPlan.nombre}
                    onChange={e => setFormPlan({ ...formPlan, nombre: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Código (opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Código interno"
                    value={formPlan.codigo}
                    onChange={e => setFormPlan({ ...formPlan, codigo: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowModalPlan(false)}>Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={handleGuardarPlan}>
                  <i className="bi bi-check-lg me-1"></i> {editandoPlan ? 'Guardar' : 'Crear Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: PRACTICA (RESTRICCION) ============ */}
      {showModalPractica && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModalPractica(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title text-danger fw-bold" style={{ fontSize: '1rem' }}>
                  <i className="bi bi-slash-circle me-2"></i>
                  Nueva Restricción
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModalPractica(false)}></button>
              </div>
              <div className="modal-body pt-3">
                <div className="row g-2 mb-3">
                  <div className="col-4">
                    <label className="form-label fw-bold small">Código *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. 02.01"
                      value={formPractica.codigo}
                      onChange={e => setFormPractica({ ...formPractica, codigo: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="col-8">
                    <label className="form-label fw-bold small">Nombre / Descripción *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nombre de la práctica"
                      value={formPractica.nombre}
                      onChange={e => setFormPractica({ ...formPractica, nombre: e.target.value })}
                    />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-8">
                    <label className="form-label fw-bold small">Alcance de Restricción</label>
                    <select
                      className="form-select"
                      value={formPractica.alcance}
                      onChange={e => setFormPractica({ ...formPractica, alcance: e.target.value })}
                    >
                      <option value="paciente">Por Paciente (global)</option>
                      <option value="diente">Por Diente / Pieza Dental</option>
                      <option value="cara">Por Cara del Diente</option>
                    </select>
                  </div>
                  <div className="col-4">
                    <label className="form-label fw-bold small">Frec. (Meses)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Ej. 12"
                      value={formPractica.mesesFrecuencia}
                      onChange={e => setFormPractica({ ...formPractica, mesesFrecuencia: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowModalPractica(false)}>Cancelar</button>
                <button className="btn btn-danger btn-sm" onClick={handleGuardarPractica}>
                  <i className="bi bi-check-lg me-1"></i> Guardar Restricción
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionObrasSociales;
