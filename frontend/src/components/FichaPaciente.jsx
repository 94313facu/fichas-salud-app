import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import pacientesService from './services/pacientes.service';
import obrasSocialesService from './services/obrasSociales.service';
import EditarPacienteModal from './EditarPacienteModal';
import EditarSesionModal from './EditarSesionModal';
import Odontograma from './Odontograma';
import CrearTurnoModal from './CrearTurnoModal';
import AdvertenciaFrecuenciaModal from './AdvertenciaFrecuenciaModal';
import practicasService from './services/practicas.service';
import facturacionService from './services/facturacion.service';

const FichaPaciente = () => {
  const { id } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [catalogoPracticas, setCatalogoPracticas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [activeTab, setActiveTab] = useState('evoluciones'); // 'evoluciones' | 'clinica' | 'finanzas' | 'facturacion'
  const [copiadoId, setCopiadoId] = useState(null);

  // Modales
  const [showEditPaciente, setShowEditPaciente] = useState(false);
  const [showEditSesion, setShowEditSesion] = useState(false);
  const [showCrearTurno, setShowCrearTurno] = useState(false);
  const [selectedSesion, setSelectedSesion] = useState(null);

  // Nueva evolución
  const [notas, setNotas] = useState('');
  const [codigoPractica, setCodigoPractica] = useState('');
  const [nombrePractica, setNombrePractica] = useState('');
  const [isNuevaPractica, setIsNuevaPractica] = useState(false);
  const [piezaDental, setPiezaDental] = useState('');
  const [caraDental, setCaraDental] = useState('');
  const [alcanceNew, setAlcanceNew] = useState('paciente');
  const [mesesNew, setMesesNew] = useState('12');
  const [validacionResult, setValidacionResult] = useState(null);
  const [showAdvertencia, setShowAdvertencia] = useState(false);
  const [presupuesto, setPresupuesto] = useState('');
  const [pago, setPago] = useState('');
  const [archivo, setArchivo] = useState(null);
  const fileInputRef = useRef(null);

  // Mensajes de confirmación
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar detalles del paciente, obras sociales y tratamientos
  const cargarDatos = async () => {
    try {
      const [pacienteData, obrasData, practicasData] = await Promise.all([
        pacientesService.getPacienteDetail(id),
        obrasSocialesService.getObrasSociales(),
        practicasService.getPracticas()
      ]);
      setPaciente(pacienteData);
      setObrasSociales(obrasData);
      setCatalogoPracticas(practicasData);
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al cargar la ficha del paciente.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const handleCambiarEstado = async (sesionId, nuevoEstado) => {
    try {
      const result = await facturacionService.updateEstadoFacturacion(sesionId, nuevoEstado);
      setPaciente(prev => ({
        ...prev,
        Sesions: prev.Sesions.map(s => s.id === result.sesion.id ? { ...s, estadoFacturacion: result.sesion.estadoFacturacion, modalidadCobro: result.sesion.modalidadCobro } : s)
      }));
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al cambiar estado.');
    }
  };

  // Manejar cambio de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setErrorMsg('El archivo supera el límite permitido de 50MB.');
        setArchivo(null);
        e.target.value = '';
        return;
      }
      setArchivo(file);
      setErrorMsg('');
    }
  };

  // Enviar sesión con validación de frecuencia de práctica
  const handleGuardarSesion = async (e) => {
    e.preventDefault();
    if (!notas.trim() && !archivo) {
      setErrorMsg('Debes agregar notas o un archivo para guardar la sesión.');
      return;
    }

    try {
      setGuardando(true);
      setErrorMsg('');

      // 1. Guardar o actualizar la práctica en el catálogo si ingresó código y nombre
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

      // 2. Ejecutar validación de frecuencia por Obra Social
      if (codigoPractica.trim()) {
        const val = await practicasService.validarFrecuencia(
          id,
          codigoPractica.trim(),
          piezaDental,
          caraDental,
          null,
          parseInt(mesesNew) || 0,
          alcanceNew,
          nombrePractica.trim()
        );

        if (!val.valido) {
          setValidacionResult(val);
          setShowAdvertencia(true);
          setGuardando(false);
          return;
        }
      }

      await ejecutarGuardarSesion('obra_social');
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al guardar la sesión.');
      setGuardando(false);
    }
  };

  const ejecutarGuardarSesion = async (modalidadCobro = 'obra_social') => {
    try {
      setGuardando(true);
      setErrorMsg('');
      setMensajeExito('');

      await pacientesService.createSesion(
        id,
        notas,
        archivo,
        presupuesto || 0,
        pago || 0,
        codigoPractica,
        piezaDental,
        caraDental,
        modalidadCobro
      );
      
      // Limpiar formulario
      setNotas('');
      setCodigoPractica('');
      setNombrePractica('');
      setIsNuevaPractica(false);
      setPiezaDental('');
      setCaraDental('');
      setPresupuesto('');
      setPago('');
      setArchivo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setMensajeExito('Sesión guardada correctamente.');
      await cargarDatos();

      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al guardar la sesión.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCodigoChange = async (val) => {
    setCodigoPractica(val);
    if (val.trim().length >= 2) {
      const search = await practicasService.buscarCodigo(val, paciente?.obraSocialId, paciente?.planObraSocialId);
      if (search.existe) {
        setNombrePractica(search.practica.nombre);
        setAlcanceNew(search.practica.alcance || 'paciente');
        setMesesNew(search.practica.mesesFrecuencia !== undefined ? search.practica.mesesFrecuencia : 0);
      }
    }
  };

  const handleNombreChange = async (val) => {
    setNombrePractica(val);
    if (val.trim().length >= 3) {
      const practica = catalogoPracticas.find(p => p.nombre.toLowerCase() === val.trim().toLowerCase());
      if (practica) {
        setCodigoPractica(practica.codigo);
        const search = await practicasService.buscarCodigo(practica.codigo, paciente?.obraSocialId, paciente?.planObraSocialId);
        if (search.existe) {
          setAlcanceNew(search.practica.alcance || 'paciente');
          setMesesNew(search.practica.mesesFrecuencia !== undefined ? search.practica.mesesFrecuencia : 0);
        }
      }
    }
  };

  // Formatear fecha legible
  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ==========================
  // FUNCIONES DE FACTURACIÓN
  // ==========================
  const buildDatosFacturacion = (sesion) => {
    const os = paciente.ObraSocial || {};
    const portal = os.PortalFacturacion || {};
    const plan = paciente.PlanObraSocial || {};

    return {
      pacienteNombre: paciente.nombre || '',
      numeroAfiliado: paciente.numeroAfiliado || '',
      planObraSocial: plan.nombre || paciente.planObraSocial || '',
      planCodigo: plan.codigo || '',
      obraSocial: os.nombre || '',
      codigoPractica: sesion.codigoPractica || '',
      nombrePractica: catalogoPracticas.find(p => p.codigo.toLowerCase() === (sesion.codigoPractica || '').toLowerCase())?.nombre || '',
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

    if (datos.portalUrl) window.open(datos.portalUrl, '_blank');

    window.postMessage({ type: 'fichas-salud:datos-facturacion', payload: datos }, '*');
    document.dispatchEvent(new CustomEvent('fichas-salud:datos-facturacion', { detail: datos }));
    document.body.setAttribute('data-facturacion', JSON.stringify(datos));

    if (!datos.portalUrl) {
      setErrorMsg('Esta obra social no tiene un portal con URL configurada.');
    }
  };

  const handleCopiarDatos = async (sesion) => {
    const datos = buildDatosFacturacion(sesion);
    const texto = [
      `Paciente: ${datos.pacienteNombre}`,
      `Nº Afiliado: ${datos.numeroAfiliado}`,
      `Obra Social: ${datos.obraSocial}`,
      `Plan: ${datos.planObraSocial}`,
      `Código de Práctica: ${datos.codigoPractica} ${datos.nombrePractica ? `- ${datos.nombrePractica}` : ''}`,
      datos.piezaDental ? `Pieza Dental: ${datos.piezaDental}` : null,
      datos.caraDental ? `Cara: ${datos.caraDental}` : null,
      `Fecha: ${datos.fecha}`
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(sesion.id);
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {
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

  // Abrir modal de edición de sesión
  const handleAbrirEditarSesion = (sesion) => {
    setSelectedSesion(sesion);
    setShowEditSesion(true);
  };

  // Callback de guardado de paciente
  const handlePacienteGuardado = (pacienteAct) => {
    setPaciente(prev => ({
      ...prev,
      ...pacienteAct
    }));
    setMensajeExito('Datos del paciente actualizados correctamente.');
    setTimeout(() => setMensajeExito(''), 4000);
  };

  // Callback de guardado de sesión
  const handleSesionGuardada = async () => {
    await cargarDatos();
    setMensajeExito('Sesión editada correctamente.');
    setTimeout(() => setMensajeExito(''), 4000);
  };

  if (cargando) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border spinner-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2 text-muted-custom">Cargando ficha del paciente...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
          Paciente no encontrado o no tienes permisos de acceso.
        </div>
        <Link to="/pacientes" className="btn btn-primary">Volver al listado</Link>
      </div>
    );
  }

  // Cálculos globales del paciente
  const totalPresupuestoGlobal = paciente.Sesions?.reduce((sum, s) => sum + (parseFloat(s.presupuesto) || 0), 0) || 0;
  const totalCobradoGlobal = paciente.Sesions?.reduce((sum, s) => sum + (parseFloat(s.pago) || 0), 0) || 0;
  const saldoGlobal = totalPresupuestoGlobal - totalCobradoGlobal;

  // Filtrado de sesiones para el historial clínico
  const sesionesFiltradas = paciente.Sesions || [];

  // Obtener próximo turno activo del paciente
  const turnosFuturos = paciente?.Turnos?.filter(t => 
    t.estado !== 'Cancelado' && new Date(t.fechaHora) >= new Date(new Date().setHours(0,0,0,0))
  ) || [];
  const proximoTurno = turnosFuturos.length > 0 ? turnosFuturos[0] : null;

  return (
    <div className="container py-4">
      {/* Cabecera Ficha */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div className="d-flex align-items-center">
          <Link to="/pacientes" className="btn btn-secondary px-3 me-3" style={{ height: '40px' }} aria-label="Volver">
            <i className="bi bi-arrow-left me-1"></i> Volver
          </Link>
          <h2 className="mb-0 fs-3 d-flex align-items-center text-dark">
            <i className="bi bi-person-fill text-primary me-2"></i>
            {paciente.nombre}
          </h2>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark border p-2 fs-6">
            <i className="bi bi-card-checklist text-accent me-1"></i>
            {paciente.ObraSocial?.nombre || 'Particular'}
            {paciente.PlanObraSocial ? ` - ${paciente.PlanObraSocial.nombre}` : (paciente.planObraSocial ? ` - ${paciente.planObraSocial}` : '')}
          </span>
          <button 
            className="btn btn-primary d-flex align-items-center gap-1"
            onClick={() => setShowEditPaciente(true)}
            style={{ height: '40px', fontSize: '0.95rem' }}
          >
            <i className="bi bi-pencil-square"></i> Editar Paciente
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

      {/* Selector de Pestañas (Tabs) */}
      <ul className="nav nav-tabs mb-4 px-1" role="tablist" style={{ borderBottom: '2px solid #dee2e6' }}>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link font-weight-bold fs-5 px-3 py-2 border-0 ${activeTab === 'evoluciones' ? 'active text-primary border-bottom border-primary border-3' : 'text-secondary'}`}
            onClick={() => setActiveTab('evoluciones')}
            type="button"
            role="tab"
            style={{ backgroundColor: 'transparent', borderBottom: activeTab === 'evoluciones' ? '3px solid var(--primary-color) !important' : 'none' }}
          >
            <i className="bi bi-journal-text me-1"></i> Evoluciones
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link font-weight-bold fs-5 px-3 py-2 border-0 ${activeTab === 'clinica' ? 'active text-primary border-bottom border-primary border-3' : 'text-secondary'}`}
            onClick={() => setActiveTab('clinica')}
            type="button"
            role="tab"
            style={{ backgroundColor: 'transparent', borderBottom: activeTab === 'clinica' ? '3px solid var(--primary-color) !important' : 'none' }}
          >
            <i className="bi bi-file-earmark-medical me-1"></i> Historial Clínico
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link font-weight-bold fs-5 px-3 py-2 border-0 ${activeTab === 'finanzas' ? 'active text-primary border-bottom border-primary border-3' : 'text-secondary'}`}
            onClick={() => setActiveTab('finanzas')}
            type="button"
            role="tab"
            style={{ backgroundColor: 'transparent', borderBottom: activeTab === 'finanzas' ? '3px solid var(--primary-color) !important' : 'none' }}
          >
            <i className="bi bi-currency-dollar me-1"></i> Finanzas por Mes
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link font-weight-bold fs-5 px-3 py-2 border-0 ${activeTab === 'facturacion' ? 'active text-primary border-bottom border-primary border-3' : 'text-secondary'}`}
            onClick={() => setActiveTab('facturacion')}
            type="button"
            role="tab"
            style={{ backgroundColor: 'transparent', borderBottom: activeTab === 'facturacion' ? '3px solid var(--primary-color) !important' : 'none' }}
          >
            <i className="bi bi-receipt-cutoff me-1"></i> Facturación <span className="badge bg-warning text-dark rounded-pill ms-1 fact-tab-badge">{(paciente.Sesions || []).filter(s => s.estadoFacturacion === 'pendiente' && s.codigoPractica && s.modalidadCobro === 'obra_social').length}</span>
          </button>
        </li>
      </ul>

      {/* Contenidos de las Pestañas */}
      <div className="tab-content">
        
        {/* PESTAÑA: EVOLUCIONES */}
        {activeTab === 'evoluciones' && (
          <div className="row g-4">
            {/* Formulario Nueva Evolución */}
            <div className="col-12 col-lg-5">
              <div className="card p-4 border-0 shadow-sm">
                <h3 className="fs-5 mb-3" style={{ color: 'var(--primary-color)' }}>Registrar Evolución</h3>
                
                <form onSubmit={handleGuardarSesion}>
                  {/* Código de Práctica y Facturación Odontológica */}
                  <div className="card p-3 bg-light border mb-3">
                    <h6 className="font-weight-bold text-primary mb-2" style={{ fontSize: '0.92rem' }}>
                      <i className="bi bi-tag-fill me-1"></i> Práctica y Facturación Odontológica
                    </h6>
                    
                    <div className="row g-2">
                      <div className="col-12 col-sm-7">
                        <label className="form-label font-weight-bold mb-1 small">Nombre de la Práctica</label>
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
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '__NUEVA__') {
                                setIsNuevaPractica(true);
                                setNombrePractica('');
                                setCodigoPractica('');
                                setMesesNew(0);
                              } else {
                                handleNombreChange(val);
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
                        <label className="form-label font-weight-bold mb-1 small">Código de Práctica</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Ej. 02.01, 0101"
                          value={codigoPractica}
                          onChange={(e) => handleCodigoChange(e.target.value)}
                          onBlur={(e) => handleCodigoChange(e.target.value)}
                          readOnly={!isNuevaPractica && nombrePractica !== ''}
                        />
                      </div>
                      {/* Reglas de refacturación siempre visibles */}
                      <div className="col-12 mt-2 p-2 bg-light rounded border">
                        <small className="text-secondary font-weight-bold d-block mb-1">
                          <i className="bi bi-gear-fill me-1"></i> Reglas de Refacturación para Obra Social
                          </small>
                          <div className="row g-2">
                            <div className="col-12 col-sm-7">
                              <label className="form-label mb-1 small">Alcance de Restricción</label>
                              <select
                                className="form-select form-select-sm"
                                value={alcanceNew}
                                onChange={(e) => setAlcanceNew(e.target.value)}
                              >
                                <option value="paciente">Por Paciente (global)</option>
                                <option value="diente">Por Diente / Pieza Dental</option>
                                <option value="cara">Por Cara del Diente</option>
                              </select>
                            </div>
                            <div className="col-12 col-sm-5">
                              <label className="form-label mb-1 small">Frecuencia (Meses)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                placeholder="Meses (ej: 12)"
                                value={mesesNew}
                                onChange={(e) => setMesesNew(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                      {/* Pieza y Cara Dental (Opcional) */}
                      <div className="col-6 col-sm-6 mt-2">
                        <label className="form-label font-weight-bold mb-1 small">Pieza Dental (Opcional)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Ej. 18, 21"
                          value={piezaDental}
                          onChange={(e) => setPiezaDental(e.target.value)}
                        />
                      </div>

                      <div className="col-6 col-sm-6 mt-2">
                        <label className="form-label font-weight-bold mb-1 small">Cara (Opcional)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Ej. Oclusal, Mesial"
                          value={caraDental}
                          onChange={(e) => setCaraDental(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="mb-3">
                    <label htmlFor="notas" className="form-label font-weight-bold">Notas de evolución</label>
                    <textarea
                      id="notas"
                      rows="4"
                      className="form-control"
                      placeholder="Escribe las notas clínicas de la sesión..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      disabled={guardando}
                      style={{ fontSize: '1rem', resize: 'vertical' }}
                    ></textarea>
                  </div>

                  {/* Presupuesto y Pago */}
                  <div className="row g-2 mb-3 bg-light p-2 rounded border">
                    <div className="col-6">
                      <label htmlFor="presupuesto" className="form-label font-weight-bold" style={{ fontSize: '0.9rem' }}>Presupuesto ($)</label>
                      <input
                        type="number"
                        id="presupuesto"
                        className="form-control"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={presupuesto}
                        onChange={(e) => setPresupuesto(e.target.value)}
                        disabled={guardando}
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="pago" className="form-label font-weight-bold" style={{ fontSize: '0.9rem' }}>Pago ($)</label>
                      <input
                        type="number"
                        id="pago"
                        className="form-control"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={pago}
                        onChange={(e) => setPago(e.target.value)}
                        disabled={guardando}
                      />
                    </div>
                    {presupuesto !== '' && (
                      <div className="col-12 text-end mt-1 text-muted-custom" style={{ fontSize: '0.85rem' }}>
                        Diferencia de sesión: <strong>${((parseFloat(presupuesto) || 0) - (parseFloat(pago) || 0)).toFixed(2)}</strong>
                      </div>
                    )}
                  </div>

                  {/* Archivo */}
                  <div className="mb-4">
                    <label htmlFor="archivo" className="form-label font-weight-bold">Adjuntar foto/video</label>
                    <input
                      type="file"
                      id="archivo"
                      className="form-control"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      disabled={guardando}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={guardando || (!notas.trim() && !archivo)}
                  >
                    {guardando ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Guardando...</>
                    ) : (
                      <><i className="bi bi-save me-1"></i> Guardar evolución</>
                    )}
                  </button>
                </form>
              </div>

              {/* BLOQUE: PRÓXIMO TURNO */}
              <div className="card p-4 border-0 shadow-sm mt-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h3 className="fs-5 mb-0 text-primary font-weight-bold">
                    <i className="bi bi-calendar-event me-2"></i> Próximo Turno
                  </h3>
                  <button
                    className="btn btn-outline-warning text-dark btn-sm font-weight-bold"
                    onClick={() => setShowCrearTurno(true)}
                  >
                    <i className="bi bi-plus-lg me-1"></i> + Agendar
                  </button>
                </div>

                {proximoTurno ? (
                  <div className="p-3 bg-light rounded border border-warning-subtle">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <span className="badge bg-warning text-dark font-weight-bold me-2">
                          {proximoTurno.estado}
                        </span>
                        <span className="text-dark font-weight-bold fs-6">
                          📅 {new Date(proximoTurno.fechaHora).toLocaleDateString()} a las {new Date(proximoTurno.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                        </span>
                      </div>
                      <span className="badge bg-light text-muted border">
                        ⏱️ {proximoTurno.duracionMinutos || 30} min
                      </span>
                    </div>


                    {proximoTurno.notas && (
                      <div className="text-muted-custom small fst-italic">
                        <strong>Notas:</strong> {proximoTurno.notas}
                      </div>
                    )}

                    <div className="mt-3 border-top pt-2 text-end">
                      <Link to="/turnos" className="btn btn-link btn-sm p-0 text-accent font-weight-bold text-decoration-none">
                        Ver en Agenda de Turnos <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-light rounded border border-dashed">
                    <i className="bi bi-calendar-x text-muted fs-3 d-block mb-1"></i>
                    <p className="text-muted-custom mb-2 font-weight-bold">Sin turnos próximos asociados</p>
                    <button
                      className="btn btn-accent text-white btn-sm px-3"
                      onClick={() => setShowCrearTurno(true)}
                    >
                      <i className="bi bi-calendar-plus me-1"></i> Agendar Turno
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Listado de Evoluciones */}
            <div className="col-12 col-lg-7">
              
              {/* ODONTOGRAMA INTERACTIVO ARRIBA DEL HISTORIAL CLÍNICO */}
              <Odontograma
                pacienteId={paciente.id}
                odontogramaInicial={paciente.odontograma}
                onSave={(nuevoOdontograma) => {
                  setPaciente(prev => ({
                    ...prev,
                    odontograma: nuevoOdontograma
                  }));
                }}
              />

              <div className="card p-4 border-0 shadow-sm">
                
                {/* Cabecera de Evoluciones */}
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
                  <h3 className="fs-5 mb-0" style={{ color: 'var(--primary-color)' }}>Historial Clínico</h3>
                </div>

                {sesionesFiltradas.length > 0 ? (
                  <div className="d-flex flex-column gap-4">
                    {sesionesFiltradas.map((sesion) => (
                      <div key={sesion.id} className="border-bottom pb-4 position-relative">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="badge bg-light text-dark border p-2" style={{ fontSize: '0.85rem' }}>
                            <i className="bi bi-calendar-event text-primary me-1"></i>
                            {formatearFecha(sesion.createdAt)}
                          </span>
                          {sesion.codigoPractica && (
                            <span className="badge bg-white text-dark border ms-2" style={{ fontSize: '0.85rem' }}>
                              <i className="bi bi-tag me-1 text-primary"></i>Cód: <strong>{sesion.codigoPractica}</strong>
                              <span className="ms-1 text-muted">({catalogoPracticas.find(p => p.codigo.toLowerCase() === sesion.codigoPractica.toLowerCase())?.nombre || 'Práctica no catalogada'})</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="d-flex justify-content-end mb-2">
                          <button
                            className="btn btn-sm btn-outline-secondary px-2 py-1 d-flex align-items-center gap-1"
                            onClick={() => handleAbrirEditarSesion(sesion)}
                            style={{ height: '32px', fontSize: '0.85rem' }}
                          >
                            <i className="bi bi-pencil"></i> Editar
                          </button>
                        </div>



                        {sesion.notas && (
                          <div className="text-dark mb-2" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                            {sesion.notas}
                          </div>
                        )}

                        {/* Presupuesto y Pago de la Sesión */}
                        {(parseFloat(sesion.presupuesto) > 0 || parseFloat(sesion.pago) > 0) && (
                          <div className="d-flex flex-wrap gap-2 mb-2" style={{ fontSize: '0.85rem' }}>
                            <span className="badge bg-light border text-dark">
                              Pto: ${parseFloat(sesion.presupuesto).toFixed(2)}
                            </span>
                            <span className="badge bg-success-light border border-success text-success">
                              Pago: ${parseFloat(sesion.pago).toFixed(2)}
                            </span>
                          </div>
                        )}

                        {sesion.archivoUrl && (
                          <div className="mt-2 bg-light p-2 rounded text-center border overflow-hidden">
                            {sesion.archivoTipo === 'video' ? (
                              <video src={sesion.archivoUrl.startsWith('http') ? sesion.archivoUrl : `http://localhost:5000${sesion.archivoUrl}`} controls className="img-fluid rounded" style={{ maxHeight: '300px', width: '100%', objectFit: 'contain' }} />
                            ) : (
                              <a href={sesion.archivoUrl.startsWith('http') ? sesion.archivoUrl : `http://localhost:5000${sesion.archivoUrl}`} target="_blank" rel="noopener noreferrer">
                                <img src={sesion.archivoUrl.startsWith('http') ? sesion.archivoUrl : `http://localhost:5000${sesion.archivoUrl}`} alt="Evolución" className="img-fluid rounded" style={{ maxHeight: '300px', objectFit: 'contain' }} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 bg-light rounded border border-dashed">
                    <i className="bi bi-journal-x fs-1 text-muted"></i>
                    <p className="mt-2 text-muted-custom mb-0">No se encontraron evoluciones registradas para este filtro.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: HISTORIAL CLÍNICO Y ANAMNESIS */}
        {activeTab === 'clinica' && (
          <div className="card p-4 border-0 shadow-sm bg-white">
            <div className="row g-4">
              
              {/* Bloque 1: Datos Personales e Identificación */}
              <div className="col-12 col-md-6 border-end-md pb-3 pb-md-0">
                <h4 className="fs-5 mb-3 text-primary"><i className="bi bi-person-badge-fill me-2"></i> Datos Personales y Filiación</h4>
                <table className="table table-sm table-borderless align-middle mb-0">
                  <tbody>
                    {paciente.numeroFicha && (
                      <tr>
                        <td className="text-muted-custom font-weight-bold" style={{ width: '160px' }}>Historia Clínica Nº:</td>
                        <td className="text-dark font-weight-bold">{paciente.numeroFicha}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="text-muted-custom font-weight-bold" style={{ width: '160px' }}>Nombre completo:</td>
                      <td className="text-dark font-weight-bold">{paciente.nombre}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold">Teléfono:</td>
                      <td className="text-dark">{paciente.telefono || <em className="text-muted">No registrado</em>}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold">Email:</td>
                      <td className="text-dark">{paciente.emailContact || <em className="text-muted">No registrado</em>}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold">Domicilio:</td>
                      <td className="text-dark">{paciente.direccion || <em className="text-muted">No registrado</em>}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold">Localidad / C.P.:</td>
                      <td className="text-dark">
                        {paciente.localidad || '—'} {paciente.codigoPostal ? `(C.P. ${paciente.codigoPostal})` : ''}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold">F. Nacimiento / Edad:</td>
                      <td className="text-dark">
                        {paciente.fechaNacimiento ? new Date(paciente.fechaNacimiento).toLocaleDateString() : '—'} 
                        {paciente.edad ? ` (${paciente.edad} años)` : ''}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold">Actividad / Ocupación:</td>
                      <td className="text-dark">{paciente.actividad || <em className="text-muted">No registrada</em>}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold">Deriva (Referido):</td>
                      <td className="text-dark">{paciente.deriva || <em className="text-muted">No especificado</em>}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold">Médico Clínico:</td>
                      <td className="text-dark">
                        {paciente.medicoClinico || <em className="text-muted">No registrado</em>}
                        {paciente.medicoClinicoTelefono ? ` (Tel: ${paciente.medicoClinicoTelefono})` : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bloque 2: Cobertura Médica y Emergencias */}
              <div className="col-12 col-md-6">
                <h4 className="fs-5 mb-3 text-danger"><i className="bi bi-shield-exclamation me-2"></i> Cobertura y Emergencias</h4>
                <table className="table table-sm table-borderless align-middle mb-4">
                  <tbody>
                    <tr>
                      <td className="text-muted-custom font-weight-bold" style={{ width: '180px' }}>Obra Social:</td>
                      <td>
                        <span className="badge bg-light text-primary border fs-6">
                          {paciente.ObraSocial?.nombre || 'Particular'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold">Nº Afiliado / Plan:</td>
                      <td className="text-dark font-weight-bold">
                        {paciente.numeroAfiliado || '—'} {paciente.planObraSocial ? `(Plan: ${paciente.planObraSocial})` : ''}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold">Servicio Emergencias:</td>
                      <td className="text-dark font-weight-bold">{paciente.servicioEmergencia || <em className="text-muted font-weight-normal">No registrado</em>}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold text-danger">Contacto Emergencia:</td>
                      <td className="text-dark font-weight-bold">{paciente.contactoEmergencia || <em className="text-muted font-weight-normal">No registrado</em>}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-custom font-weight-bold">Aparatología:</td>
                      <td className="text-dark">{paciente.aparatologia || <em className="text-muted">Ninguna</em>}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Resumen de Alertas Rápidas */}
                <div className="p-3 bg-light rounded border">
                  <h6 className="font-weight-bold text-dark mb-2">Indicadores Rápidos de Salud</h6>
                  <div className="d-flex flex-wrap gap-2">
                    <span className={`badge ${paciente.propensoHemorragias ? 'bg-danger text-white' : 'bg-secondary-light text-muted border'}`}>
                      {paciente.propensoHemorragias ? '⚠️ Propenso a Hemorragias' : 'Sin hemorragias frecuentes'}
                    </span>
                    <span className={`badge ${paciente.fuma ? 'bg-warning text-dark' : 'bg-secondary-light text-muted border'}`}>
                      {paciente.fuma ? '🚬 Fumador/a' : 'No fuma'}
                    </span>
                    {paciente.embarazada && (
                      <span className="badge bg-info text-dark">
                        🤰 Embarazada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bloque 3: Cuestionario de Afecciones (Anamnesis - Checkboxes) */}
              <div className="col-12 border-top pt-4">
                <h4 className="fs-5 mb-3 text-primary"><i className="bi bi-heart-pulse-fill me-2"></i> Cuestionario de Afecciones (Anamnesis)</h4>
                
                <div className="row g-2 p-3 bg-light rounded border mb-4">
                  {[
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
                  ].map((item) => {
                    const tieneAfeccion = paciente.afecciones && paciente.afecciones[item.id];
                    return (
                      <div key={item.id} className="col-12 col-sm-6 col-md-4">
                        <div className={`p-2 rounded border d-flex align-items-center ${tieneAfeccion ? 'bg-danger-light border-danger text-danger font-weight-bold' : 'bg-white text-muted'}`}>
                          <i className={`bi ${tieneAfeccion ? 'bi-check-circle-fill text-danger' : 'bi-circle text-muted'} me-2 fs-5`}></i>
                          <span>{item.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bloque 4: Cuestionario Detallado */}
                <h5 className="fs-6 mb-3 font-weight-bold text-dark">Respuestas Detalladas del Cuestionario</h5>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded border border-danger-light" style={{ backgroundColor: '#fff5f5' }}>
                      <strong className="text-danger mb-1 d-block"><i className="bi bi-shield-slash-fill me-1"></i> Alergias a Drogas / Medicamentos</strong>
                      <p className="mb-0 text-dark font-weight-bold" style={{ whiteSpace: 'pre-wrap' }}>
                        {paciente.alergiasMedicamentos || paciente.antecedentesAlergias || 'Sin alergias declaradas.'}
                      </p>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <strong className="text-dark mb-1 d-block"><i className="bi bi-capsule me-1"></i> Medicación Habitual</strong>
                      <p className="mb-0 text-muted-custom" style={{ whiteSpace: 'pre-wrap' }}>
                        {paciente.medicamentoHabitual || paciente.antecedentesMedicacion || 'No toma medicación fija.'}
                      </p>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <strong className="text-dark mb-1 d-block"><i className="bi bi-activity me-1"></i> Otras Enfermedades o Afecciones</strong>
                      <p className="mb-0 text-muted-custom" style={{ whiteSpace: 'pre-wrap' }}>
                        {paciente.otrasEnfermedades || paciente.antecedentesEnfermedades || 'Sin otras afecciones reportadas.'}
                      </p>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <strong className="text-dark mb-1 d-block"><i className="bi bi-dna me-1"></i> Antecedentes Hereditarios de Importancia</strong>
                      <p className="mb-0 text-muted-custom" style={{ whiteSpace: 'pre-wrap' }}>
                        {paciente.antecedentesHereditarios || paciente.antecedentesHereditarias || 'Sin antecedentes familiares reportados.'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* PESTAÑA: FINANZAS Y PRESUPUESTOS (AGRUPADOS POR TRATAMIENTO) */}
        {activeTab === 'finanzas' && (
          <div className="card p-4 border-0 shadow-sm bg-white">
            
            {/* Resumen Global Cuentas del Paciente */}
            <div className="card p-4 border-0 shadow-sm mb-4 bg-light">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 border-bottom pb-3">
                <div>
                  <h3 className="fs-5 mb-1 text-dark font-weight-bold">
                    <i className="bi bi-calculator-fill text-primary me-2"></i> Balance General del Paciente
                  </h3>
                  <span className="text-muted-custom" style={{ fontSize: '0.9rem' }}>
                    Estado de cuenta acumulado consolidado entre todos los tratamientos
                  </span>
                </div>

                <div>
                  {saldoGlobal > 0 ? (
                    <div className="badge bg-danger-light border border-danger text-danger p-3 fs-6 rounded-3">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>
                      Saldo Pendiente Total: <strong className="fs-5">${saldoGlobal.toFixed(2)}</strong>
                    </div>
                  ) : saldoGlobal < 0 ? (
                    <div className="badge bg-warning-light border border-warning text-accent p-3 fs-6 rounded-3">
                      <i className="bi bi-plus-circle-fill me-1"></i>
                      Saldo a Favor Total: <strong className="fs-5">${Math.abs(saldoGlobal).toFixed(2)}</strong>
                    </div>
                  ) : (
                    <div className="badge bg-success-light border border-success text-success p-3 fs-6 rounded-3">
                      <i className="bi bi-check-circle-fill me-1"></i>
                      Cuenta Global al Día (<strong className="fs-5">$0.00</strong>)
                    </div>
                  )}
                </div>
              </div>

              {/* Fila de métricas globales */}
              <div className="row g-3 text-center">
                <div className="col-12 col-md-4">
                  <div className="p-3 bg-white rounded border">
                    <span className="text-muted-custom d-block mb-1" style={{ fontSize: '0.85rem' }}>Total Presupuestado (Global)</span>
                    <span className="fs-4 font-weight-bold text-dark">${totalPresupuestoGlobal.toFixed(2)}</span>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="p-3 bg-white rounded border border-success-light">
                    <span className="text-success d-block mb-1" style={{ fontSize: '0.85rem' }}>Total Cobrado (Global)</span>
                    <span className="fs-4 font-weight-bold text-success">${totalCobradoGlobal.toFixed(2)}</span>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="p-3 bg-white rounded border">
                    <span className="text-muted-custom d-block mb-1" style={{ fontSize: '0.85rem' }}>Diferencia / Balance Global</span>
                    <span className={`fs-4 font-weight-bold ${saldoGlobal > 0 ? 'text-danger' : saldoGlobal < 0 ? 'text-accent' : 'text-success'}`}>
                      {saldoGlobal > 0 ? `$${saldoGlobal.toFixed(2)}` : saldoGlobal < 0 ? `+$${Math.abs(saldoGlobal).toFixed(2)} (A Favor)` : '$0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="fs-5 mb-4 text-dark"><i className="bi bi-calendar3 text-accent me-2"></i> Desglose Mensual</h3>

            {(() => {
              const sesiones = paciente.Sesions || [];
              if (sesiones.length === 0) {
                return (
                  <div className="text-center py-5 bg-light rounded border border-dashed">
                    <i className="bi bi-cash-stack fs-1 text-muted"></i>
                    <p className="mt-2 text-muted-custom mb-0">Registra evoluciones para visualizar las finanzas.</p>
                  </div>
                );
              }

              const grupos = {};
              sesiones.forEach(s => {
                const fecha = new Date(s.createdAt);
                const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                if (!grupos[key]) {
                  const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(fecha);
                  grupos[key] = {
                    mesKey: key,
                    nombreMes: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
                    sesiones: [],
                    pto: 0,
                    pg: 0
                  };
                }
                grupos[key].sesiones.push(s);
                grupos[key].pto += (parseFloat(s.presupuesto) || 0);
                grupos[key].pg += (parseFloat(s.pago) || 0);
              });

              const mesesFinanzas = Object.values(grupos).sort((a, b) => b.mesKey.localeCompare(a.mesKey));

              return (
                <div className="d-flex flex-column gap-5">
                  {mesesFinanzas.map((m) => {
                    const sld = m.pto - m.pg;
                    
                    const sesionesOrdenadasCronologico = [...m.sesiones].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    let acumulado = 0;
                    const sesionesConSaldo = sesionesOrdenadasCronologico.map((s) => {
                      const presupuestoNum = parseFloat(s.presupuesto) || 0;
                      const pagoNum = parseFloat(s.pago) || 0;
                      acumulado += (presupuestoNum - pagoNum);
                      return { ...s, saldoAcumulado: acumulado };
                    });
                    const sesionesParaMostrar = sesionesConSaldo.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    return (
                      <div key={m.mesKey} className="border rounded p-4 bg-light shadow-sm">
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 border-bottom pb-2 mb-3">
                          <div>
                            <h4 className="fs-5 mb-0 text-primary font-weight-bold">
                              <i className="bi bi-calendar-event me-2 text-accent"></i>
                              {m.nombreMes}
                            </h4>
                            <span className="text-muted-custom" style={{ fontSize: '0.85rem' }}>
                              Presupuesto: <strong>${m.pto.toFixed(2)}</strong> | Cobrado: <strong className="text-success">${m.pg.toFixed(2)}</strong>
                            </span>
                          </div>
                          <span className={`badge p-2 fs-6 border ${sld > 0 ? 'bg-danger-light border-danger text-danger' : sld < 0 ? 'bg-warning-light border-warning text-accent' : 'bg-success-light border-success text-success'}`}>
                            {sld > 0 ? `Saldo Pendiente: $${sld.toFixed(2)}` : sld < 0 ? `A Favor: $${Math.abs(sld).toFixed(2)}` : `Al Día ($0.00)`}
                          </span>
                        </div>

                        {sesionesParaMostrar.some(s => parseFloat(s.presupuesto) > 0 || parseFloat(s.pago) > 0) ? (
                          <div className="table-responsive">
                            <table className="table table-hover align-middle border bg-white mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th scope="col" className="px-3" style={{ width: '180px' }}>Fecha Sesión</th>
                                  <th scope="col">Notas de evolución</th>
                                  <th scope="col" className="text-end" style={{ width: '130px' }}>Presupuesto</th>
                                  <th scope="col" className="text-end" style={{ width: '130px' }}>Cobrado</th>
                                  <th scope="col" className="text-end" style={{ width: '170px' }}>Saldo Acumulado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sesionesParaMostrar.filter(s => parseFloat(s.presupuesto) > 0 || parseFloat(s.pago) > 0).map((sesion) => (
                                  <tr key={sesion.id}>
                                    <td className="px-3 text-muted-custom">{formatearFecha(sesion.createdAt)}</td>
                                    <td>
                                      <div className="text-truncate" style={{ maxWidth: '280px' }}>
                                        {sesion.notas || <em className="text-muted">Sin notas de evolución</em>}
                                      </div>
                                    </td>
                                    <td className="text-end text-dark">${parseFloat(sesion.presupuesto).toFixed(2)}</td>
                                    <td className="text-end text-success">${parseFloat(sesion.pago).toFixed(2)}</td>
                                    <td className="text-end font-weight-bold">
                                      {sesion.saldoAcumulado > 0 ? (
                                        <span className="text-danger">${sesion.saldoAcumulado.toFixed(2)}</span>
                                      ) : sesion.saldoAcumulado < 0 ? (
                                        <span className="text-accent font-weight-bold">
                                          +${Math.abs(sesion.saldoAcumulado).toFixed(2)} <small style={{ fontSize: '0.75rem' }}>(A favor)</small>
                                        </span>
                                      ) : (
                                        <span className="text-success">$0.00</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-muted-custom mb-0" style={{ fontSize: '0.95rem' }}>
                            <i className="bi bi-info-circle me-1"></i> No se han registrado movimientos presupuestarios en este mes.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* PESTAÑA: FACTURACIÓN (NUEVA) */}
        {activeTab === 'facturacion' && (
          <div className="card p-4 border-0 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fs-5 mb-0" style={{ color: 'var(--primary-color)' }}>
                <i className="bi bi-receipt-cutoff me-2"></i>Prácticas Facturables
              </h3>
            </div>
            
            {(() => {
              const sesionesFacturables = (paciente.Sesions || []).filter(s => s.codigoPractica && s.codigoPractica.trim() !== '' && s.modalidadCobro === 'obra_social');
              
              if (sesionesFacturables.length === 0) {
                return (
                  <div className="text-center py-5 bg-light rounded border border-dashed">
                    <i className="bi bi-receipt fs-1 text-muted"></i>
                    <p className="mt-2 text-muted-custom mb-0">No hay prácticas registradas con código para facturar.</p>
                  </div>
                );
              }

              const ESTADOS = {
                pendiente: { label: 'Pendiente', bg: 'bg-warning', text: 'text-dark', icon: 'bi-clock' },
                facturado: { label: 'Facturado', bg: 'bg-success', text: 'text-white', icon: 'bi-check-circle' },
                particular: { label: 'Particular', bg: 'bg-info', text: 'text-white', icon: 'bi-person' },
                debitado: { label: 'Debitado', bg: 'bg-primary', text: 'text-white', icon: 'bi-bank' }
              };
              
              const portal = paciente.ObraSocial?.PortalFacturacion || {};

              return (
                <div className="d-flex flex-column gap-3">
                  {sesionesFacturables.map(sesion => {
                    const estadoInfo = ESTADOS[sesion.estadoFacturacion] || ESTADOS.pendiente;

                    return (
                      <div key={sesion.id} className="card border-0 shadow-sm fact-session-card bg-light border">
                        <div className="card-body p-3">
                          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                            {/* Info principal */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                <span className={`badge ${estadoInfo.bg} ${estadoInfo.text} py-1 px-2`}>
                                  <i className={`bi ${estadoInfo.icon} me-1`}></i>{estadoInfo.label}
                                </span>
                                <span className="badge bg-white text-dark border">{formatearFecha(sesion.createdAt)}</span>
                                {sesion.Tratamiento && (
                                  <span className="badge bg-secondary-subtle text-secondary border">
                                    <i className="bi bi-folder2-open me-1"></i>{sesion.Tratamiento.nombre}
                                  </span>
                                )}
                              </div>

                              <div className="d-flex flex-wrap gap-2" style={{ fontSize: '0.95rem' }}>
                                <span className="badge bg-white text-dark border">
                                  <i className="bi bi-tag me-1 text-primary"></i>Cód: <strong>{sesion.codigoPractica}</strong>
                                  <span className="ms-1 text-muted">({catalogoPracticas.find(p => p.codigo.toLowerCase() === sesion.codigoPractica.toLowerCase())?.nombre || 'Práctica no catalogada'})</span>
                                </span>
                                {sesion.piezaDental && (
                                  <span className="badge bg-white text-dark border">
                                    Pieza: <strong>{sesion.piezaDental}</strong>
                                  </span>
                                )}
                                {sesion.caraDental && (
                                  <span className="badge bg-white text-dark border">
                                    Cara: <strong>{sesion.caraDental}</strong>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Acciones */}
                            <div className="d-flex flex-column gap-2 flex-shrink-0 fact-actions" style={{ minWidth: '220px' }}>
                              <button
                                className="btn btn-accent btn-sm d-flex align-items-center justify-content-center gap-1 w-100 fact-btn-portal"
                                onClick={() => handleFacturarEnPortal(sesion)}
                                disabled={!portal.url}
                                title={portal.url ? `Abrir ${portal.nombre}` : 'Sin portal configurado'}
                              >
                                <i className="bi bi-box-arrow-up-right"></i>
                                {portal.nombre ? `Facturar en ${portal.nombre}` : 'Sin portal'}
                              </button>

                              <button
                                className={`btn btn-sm d-flex align-items-center justify-content-center gap-1 w-100 ${copiadoId === sesion.id ? 'btn-success' : 'btn-outline-secondary'}`}
                                onClick={() => handleCopiarDatos(sesion)}
                                style={{ backgroundColor: copiadoId !== sesion.id ? 'white' : undefined }}
                              >
                                <i className={`bi ${copiadoId === sesion.id ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                                {copiadoId === sesion.id ? '¡Copiado!' : 'Copiar datos'}
                              </button>

                              <select
                                className="form-select form-select-sm fact-estado-select"
                                value={sesion.estadoFacturacion || 'pendiente'}
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
              );
            })()}
          </div>
        )}

      </div>

      {/* MODAL: EDITAR PACIENTE */}
      <EditarPacienteModal
        show={showEditPaciente}
        onHide={() => setShowEditPaciente(false)}
        paciente={paciente}
        obrasSociales={obrasSociales}
        onSave={handlePacienteGuardado}
      />

      {/* MODAL: EDITAR SESIÓN */}
      <EditarSesionModal
        show={showEditSesion}
        onHide={() => {
          setShowEditSesion(false);
          setSelectedSesion(null);
        }}
        pacienteId={paciente.id}
        sesion={selectedSesion}
        onSave={handleSesionGuardada}
      />

      {/* MODAL: ADVERTENCIA DE FRECUENCIA DE FACTURACIÓN */}
      <AdvertenciaFrecuenciaModal
        show={showAdvertencia}
        onHide={() => setShowAdvertencia(false)}
        resultadoValidacion={validacionResult}
        onConfirmParticular={async () => {
          setShowAdvertencia(false);
          await ejecutarGuardarSesion('particular');
        }}
        onConfirmObraSocial={async () => {
          setShowAdvertencia(false);
          await ejecutarGuardarSesion('obra_social');
        }}
      />

      {/* MODAL: CREAR TURNO RÁPIDO */}
      <CrearTurnoModal
        show={showCrearTurno}
        onHide={() => setShowCrearTurno(false)}
        paciente={paciente}
        onSave={async () => {
          await cargarDatos();
          setMensajeExito('Turno agendado y sincronizado con éxito.');
          setTimeout(() => setMensajeExito(''), 4000);
        }}
      />
    </div>
  );
};

export default FichaPaciente;
