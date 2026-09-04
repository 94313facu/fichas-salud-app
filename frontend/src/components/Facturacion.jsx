import React, { useState, useEffect } from 'react';
import facturacionService from './services/facturacion.service';
import obrasSocialesService from './services/obrasSociales.service';

const ESTADOS = {
  pendiente: { label: 'Pendiente', bg: 'bg-warning', text: 'text-dark', icon: 'bi-clock' },
  facturado: { label: 'Facturado', bg: 'bg-success', text: 'text-white', icon: 'bi-check-circle' },
  particular: { label: 'Particular', bg: 'bg-info', text: 'text-white', icon: 'bi-person' },
  debitado: { label: 'Debitado', bg: 'bg-primary', text: 'text-white', icon: 'bi-bank' }
};

const Facturacion = () => {
  const [sesiones, setSesiones] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiadoId, setCopiadoId] = useState(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [filtroOS, setFiltroOS] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [sesionesData, resumenData, obrasData] = await Promise.all([
        facturacionService.getPendientes({
          estado: filtroEstado || 'todos',
          obraSocialId: filtroOS || undefined,
          desde: filtroDesde || undefined,
          hasta: filtroHasta || undefined
        }),
        facturacionService.getResumen(),
        obrasSocialesService.getObrasSociales()
      ]);
      setSesiones(sesionesData);
      setResumen(resumenData);
      setObrasSociales(obrasData);
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al cargar datos de facturación.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [filtroEstado, filtroOS, filtroDesde, filtroHasta]);

  const showExito = (msg) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(''), 4000);
  };

  const handleCambiarEstado = async (sesionId, nuevoEstado) => {
    try {
      setErrorMsg('');
      await facturacionService.cambiarEstado(sesionId, nuevoEstado);
      showExito(`Estado cambiado a "${ESTADOS[nuevoEstado].label}".`);
      await cargarDatos();
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al cambiar el estado.');
    }
  };

  // Construir datos de facturación para el portal y la extensión
  const buildDatosFacturacion = (sesion) => {
    const pac = sesion.Paciente || {};
    const os = pac.ObraSocial || {};
    const portal = os.PortalFacturacion || {};
    const plan = pac.PlanObraSocial || {};

    return {
      pacienteNombre: pac.nombre || '',
      numeroAfiliado: pac.numeroAfiliado || '',
      planObraSocial: plan.nombre || pac.planObraSocial || '',
      planCodigo: plan.codigo || '',
      obraSocial: os.nombre || '',
      codigoPractica: sesion.codigoPractica || '',
      piezaDental: sesion.piezaDental || '',
      caraDental: sesion.caraDental || '',
      fecha: sesion.createdAt ? new Date(sesion.createdAt).toLocaleDateString('es-AR') : '',
      fechaISO: sesion.createdAt || '',
      portalNombre: portal.nombre || '',
      portalUrl: portal.url || '',
      sesionId: sesion.id,
      presupuesto: sesion.presupuesto || 0
    };
  };

  const handleFacturarEnPortal = (sesion) => {
    const datos = buildDatosFacturacion(sesion);

    // 1. Abrir portal en nueva pestaña
    if (datos.portalUrl) {
      window.open(datos.portalUrl, '_blank');
    }

    // 2. Exponer datos para extensión de navegador vía postMessage
    window.postMessage({
      type: 'fichas-salud:datos-facturacion',
      payload: datos
    }, '*');

    // 3. CustomEvent como alternativa
    document.dispatchEvent(new CustomEvent('fichas-salud:datos-facturacion', {
      detail: datos
    }));

    // 4. Data attribute como respaldo
    document.body.setAttribute('data-facturacion', JSON.stringify(datos));

    if (!datos.portalUrl) {
      setErrorMsg('Esta obra social no tiene un portal con URL configurada. Podés configurarlo en Gestión de Obras Sociales.');
    }
  };

  const handleCopiarDatos = async (sesion) => {
    const datos = buildDatosFacturacion(sesion);
    
    let practicas = [];
    if (sesion.practicasMultiples) {
      try { practicas = JSON.parse(sesion.practicasMultiples); } catch(e){}
    } else if (sesion.codigoPractica) {
      practicas = [{ 
        codigoPractica: sesion.codigoPractica,
        piezaDental: sesion.piezaDental,
        caraDental: sesion.caraDental
      }];
    }
    
    const practicasTexto = practicas.map(p => {
      const nombre = p.nombrePractica || '';
      return [
        `Código de Práctica: ${p.codigoPractica} ${nombre ? `- ${nombre}` : ''}`,
        p.piezaDental ? `Pieza Dental: ${p.piezaDental}` : null,
        p.caraDental ? `Cara: ${p.caraDental}` : null
      ].filter(Boolean).join('\n');
    }).join('\n\n');

    const texto = [
      `Paciente: ${datos.pacienteNombre}`,
      `Nº Afiliado: ${datos.numeroAfiliado}`,
      `Obra Social: ${datos.obraSocial}`,
      `Plan: ${datos.planObraSocial}`,
      practicasTexto,
      `Fecha: ${datos.fecha}`
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(sesion.id);
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = texto;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiadoId(sesion.id);
      setTimeout(() => setCopiadoId(null), 2000);
    }
  };

  const formatearFecha = (fechaStr) => {
    return new Date(fechaStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (cargando) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border spinner-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2 text-muted-custom">Cargando módulo de facturación...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Cabecera */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <h2 className="mb-0 fs-3 d-flex align-items-center">
          <i className="bi bi-receipt-cutoff me-2 text-primary"></i>
          Facturación de Prácticas
        </h2>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2 fs-5"></i><div>{mensajeExito}</div>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i><div>{errorMsg}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setErrorMsg('')}></button>
        </div>
      )}

      {/* Resumen global */}
      {resumen && (
        <div className="row g-3 mb-4">
          {[
            { label: 'Pendientes', valor: resumen.total.pendientes, color: 'warning', icon: 'bi-clock' },
            { label: 'Facturadas', valor: resumen.total.facturados, color: 'success', icon: 'bi-check-circle' },
            { label: 'Debitadas', valor: resumen.total.debitados, color: 'primary', icon: 'bi-bank' },
            { label: 'Particulares', valor: resumen.total.particulares, color: 'info', icon: 'bi-person' }
          ].map((item, idx) => (
            <div key={idx} className="col-6 col-md-3">
              <div className={`card border-0 shadow-sm p-3 text-center fact-counter-card fact-counter-${item.color}`}>
                <i className={`bi ${item.icon} fs-3 mb-1 text-${item.color}`}></i>
                <span className={`fs-2 fw-bold text-${item.color}`}>{item.valor}</span>
                <span className="text-muted-custom small">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="card border-0 shadow-sm p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-sm-6 col-md-3">
            <label className="form-label fw-bold small mb-1">Estado</label>
            <select className="form-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="facturado">Facturado</option>
              <option value="debitado">Debitado</option>
              <option value="particular">Particular</option>
            </select>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <label className="form-label fw-bold small mb-1">Obra Social</label>
            <select className="form-select" value={filtroOS} onChange={e => setFiltroOS(e.target.value)}>
              <option value="">Todas</option>
              {obrasSociales.map(os => (
                <option key={os.id} value={os.id}>{os.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label fw-bold small mb-1">Desde</label>
            <input type="date" className="form-control" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label fw-bold small mb-1">Hasta</label>
            <input type="date" className="form-control" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Listado de sesiones */}
      {sesiones.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-receipt fs-1 text-muted d-block mb-2"></i>
            <p className="text-muted-custom mb-0">No se encontraron prácticas con los filtros aplicados.</p>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {sesiones.map(sesion => {
            const pac = sesion.Paciente || {};
            // Usar OS/Plan de la sesión, fallback a la del paciente (legacy)
            const os = sesion.ObraSocialSesion || pac.ObraSocial || {};
            const portal = os.PortalFacturacion || {};
            const plan = sesion.PlanObraSocialSesion || pac.PlanObraSocial || {};
            
            // Para obtener afiliado buscar en ObrasSocialesAsociadas o fallback legacy
            let afil = pac.numeroAfiliado;
            if (pac.ObrasSocialesAsociadas) {
               const osAsoc = pac.ObrasSocialesAsociadas.find(o => o.obraSocialId === os.id);
               if (osAsoc) afil = osAsoc.numeroAfiliado;
            }

            const estadoInfo = ESTADOS[sesion.estadoFacturacion] || ESTADOS.pendiente;

            return (
              <div key={sesion.id} className="card border-0 shadow-sm fact-session-card">
                <div className="card-body p-3">
                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                    {/* Info principal */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        <span className={`badge ${estadoInfo.bg} ${estadoInfo.text} py-1 px-2`}>
                          <i className={`bi ${estadoInfo.icon} me-1`}></i>{estadoInfo.label}
                        </span>
                        <span className="badge bg-light text-dark border">{formatearFecha(sesion.createdAt)}</span>
                        {os.nombre && (
                          <span className="badge bg-accent-light text-accent border border-accent-subtle">
                            <i className="bi bi-building me-1"></i>{os.nombre}
                          </span>
                        )}
                      </div>

                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <span className="fw-bold text-dark">
                          <i className="bi bi-person me-1 text-primary"></i>{pac.nombre || 'Paciente'}
                        </span>
                        {afil && (
                          <span className="text-muted-custom small">Nº Afil: <strong>{afil}</strong></span>
                        )}
                        {(plan.nombre || pac.planObraSocial) && (
                          <span className="text-muted-custom small">Plan: <strong>{plan.nombre || pac.planObraSocial}</strong></span>
                        )}
                      </div>

                      <div className="d-flex flex-wrap gap-2" style={{ fontSize: '0.9rem' }}>
                        {(() => {
                          let practicas = [];
                          if (sesion.practicasMultiples) {
                            try { practicas = JSON.parse(sesion.practicasMultiples); } catch(e){}
                          } else if (sesion.codigoPractica) {
                            practicas = [{ 
                              codigoPractica: sesion.codigoPractica,
                              piezaDental: sesion.piezaDental,
                              caraDental: sesion.caraDental
                            }];
                          }
                          
                          if (practicas.length === 0) {
                            return <span className="text-muted small">Sin prácticas registradas</span>;
                          }

                          return practicas.map((p, idx) => (
                            <div key={idx} className="d-flex align-items-center gap-1 border rounded px-2 py-1 bg-light text-dark">
                              <i className="bi bi-tag text-primary"></i>
                              <span>Cód: <strong>{p.codigoPractica}</strong></span>
                              {p.piezaDental && <span className="ms-1 border-start ps-1 border-secondary">P: <strong>{p.piezaDental}</strong></span>}
                              {p.caraDental && <span className="ms-1 border-start ps-1 border-secondary">C: <strong>{p.caraDental}</strong></span>}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="d-flex flex-column gap-2 flex-shrink-0 fact-actions" style={{ minWidth: '220px' }}>
                      {/* Botón Facturar en Portal */}
                      <button
                        className="btn btn-accent btn-sm d-flex align-items-center justify-content-center gap-1 w-100 fact-btn-portal"
                        onClick={() => handleFacturarEnPortal(sesion)}
                        disabled={!portal.url}
                        title={portal.url ? `Abrir ${portal.nombre}` : 'Sin portal configurado'}
                      >
                        <i className="bi bi-box-arrow-up-right"></i>
                        {portal.nombre ? `Facturar en ${portal.nombre}` : 'Sin portal'}
                      </button>

                      {/* Botón Copiar datos */}
                      <button
                        className={`btn btn-sm d-flex align-items-center justify-content-center gap-1 w-100 ${copiadoId === sesion.id ? 'btn-success' : 'btn-outline-secondary'}`}
                        onClick={() => handleCopiarDatos(sesion)}
                      >
                        <i className={`bi ${copiadoId === sesion.id ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                        {copiadoId === sesion.id ? '¡Copiado!' : 'Copiar datos'}
                      </button>

                      {/* Selector de estado */}
                      <select
                        className="form-select form-select-sm fact-estado-select"
                        value={sesion.estadoFacturacion}
                        onChange={e => handleCambiarEstado(sesion.id, e.target.value)}
                      >
                        {Object.entries(ESTADOS).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Facturacion;
