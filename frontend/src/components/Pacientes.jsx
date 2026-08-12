import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import pacientesService from './services/pacientes.service';
import obrasSocialesService from './services/obrasSociales.service';
import CrearPacienteModal from './CrearPacienteModal';

const Pacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showCrearModal, setShowCrearModal] = useState(false);
  
  // Filtros y Búsqueda Avanzada
  const [busqueda, setBusqueda] = useState('');
  const [filtroObraSocial, setFiltroObraSocial] = useState('TODAS');
  const [ordenamiento, setOrdenamiento] = useState('NOMBRE_ASC');

  // Mensajes de éxito y error
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar lista de pacientes y obras sociales
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [pacientesData, obrasData] = await Promise.all([
        pacientesService.getPacientes(),
        obrasSocialesService.getObrasSociales()
      ]);
      setPacientes(pacientesData);
      setObrasSociales(obrasData);
    } catch (err) {
      setErrorMsg(err.mensaje || 'No se pudieron cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Callback al registrar exitosamente un paciente
  const handlePacienteRegistrado = async (nuevoPaciente) => {
    setMensajeExito(`Paciente "${nuevoPaciente.nombre}" registrado correctamente.`);
    
    try {
      const pacientesData = await pacientesService.getPacientes();
      setPacientes(pacientesData);
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => setMensajeExito(''), 4000);
  };

  // Filtrado Multicriterio y Ordenamiento
  const pacientesFiltrados = pacientes
    .filter(paciente => {
      // 1. Filtro por Búsqueda de Texto (Nombre, Teléfono, Email, Dirección, Contacto Emergencia)
      const q = busqueda.toLowerCase().trim();
      const coincideTexto = !q || (
        (paciente.nombre && paciente.nombre.toLowerCase().includes(q)) ||
        (paciente.telefono && paciente.telefono.toLowerCase().includes(q)) ||
        (paciente.emailContact && paciente.emailContact.toLowerCase().includes(q)) ||
        (paciente.direccion && paciente.direccion.toLowerCase().includes(q)) ||
        (paciente.servicioEmergencia && paciente.servicioEmergencia.toLowerCase().includes(q)) ||
        (paciente.contactoEmergencia && paciente.contactoEmergencia.toLowerCase().includes(q))
      );

      // 2. Filtro por Obra Social
      let coincideObra = true;
      if (filtroObraSocial === 'PARTICULAR') {
        coincideObra = !paciente.obraSocialId;
      } else if (filtroObraSocial !== 'TODAS') {
        coincideObra = paciente.obraSocialId === parseInt(filtroObraSocial);
      }

      return coincideTexto && coincideObra;
    })
    .sort((a, b) => {
      // 3. Ordenamiento
      if (ordenamiento === 'NOMBRE_ASC') {
        return a.nombre.localeCompare(b.nombre);
      }
      if (ordenamiento === 'NOMBRE_DESC') {
        return b.nombre.localeCompare(a.nombre);
      }
      if (ordenamiento === 'RECIENTES') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (ordenamiento === 'ANTIGUOS') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroObraSocial('TODAS');
    setOrdenamiento('NOMBRE_ASC');
  };

  return (
    <div className="container py-4">
      {/* Cabecera de Página */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div className="d-flex align-items-center">
          <Link to="/" className="btn btn-secondary px-3 me-3" style={{ height: '40px' }} aria-label="Volver">
            <i className="bi bi-arrow-left me-1"></i> Volver
          </Link>
          <h2 className="mb-0 fs-3">Listado de Pacientes</h2>
        </div>
        
        {/* Botón para abrir modal de registro */}
        <button
          className="btn btn-accent text-white px-4 d-flex align-items-center justify-content-center"
          onClick={() => setShowCrearModal(true)}
          style={{ minHeight: '44px' }}
        >
          <i className="bi bi-person-plus-fill me-2"></i> Registrar Nuevo Paciente
        </button>
      </div>

      {/* Confirmaciones y Alertas */}
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

      {/* Tarjeta con Búsqueda Avanzada y Listado */}
      <div className="row">
        <div className="col-12">
          <div className="card p-4 shadow-sm border-0">
            
            {/* PANEL DE BÚSQUEDA Y FILTROS AVANZADOS */}
            <div className="row g-3 mb-4 align-items-end">
              {/* Buscador de Texto Multicriterio */}
              <div className="col-12 col-md-5">
                <label htmlFor="buscador" className="form-label font-weight-bold">
                  Búsqueda rápida por nombre, teléfono o email
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    id="buscador"
                    className="form-control border-start-0"
                    placeholder="Ej. Juan, 351555..., correo@mail.com"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    disabled={cargando}
                  />
                  {busqueda && (
                    <button className="btn btn-outline-secondary border-start-0" onClick={() => setBusqueda('')}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro por Obra Social */}
              <div className="col-12 col-sm-6 col-md-4">
                <label htmlFor="filtroObra" className="form-label font-weight-bold">
                  Filtrar por Obra Social
                </label>
                <select
                  id="filtroObra"
                  className="form-select"
                  value={filtroObraSocial}
                  onChange={(e) => setFiltroObraSocial(e.target.value)}
                  disabled={cargando}
                >
                  <option value="TODAS">Todas las obras sociales</option>
                  <option value="PARTICULAR">Particular (Sin obra social)</option>
                  {obrasSociales.map(os => (
                    <option key={os.id} value={os.id}>{os.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Ordenamiento */}
              <div className="col-12 col-sm-6 col-md-3">
                <label htmlFor="orden" className="form-label font-weight-bold">
                  Ordenar lista
                </label>
                <select
                  id="orden"
                  className="form-select"
                  value={ordenamiento}
                  onChange={(e) => setOrdenamiento(e.target.value)}
                  disabled={cargando}
                >
                  <option value="NOMBRE_ASC">Nombre (A-Z)</option>
                  <option value="NOMBRE_DESC">Nombre (Z-A)</option>
                  <option value="RECIENTES">Más recientes primero</option>
                  <option value="ANTIGUOS">Más antiguos primero</option>
                </select>
              </div>
            </div>

            {/* BARRA DE ESTADO DE FILTROS Y CONTADOR */}
            <div className="d-flex flex-wrap justify-content-between align-items-center bg-light p-2 px-3 rounded border mb-3 text-muted-custom" style={{ fontSize: '0.9rem' }}>
              <div>
                <i className="bi bi-people-fill me-2 text-primary"></i>
                Mostrando <strong>{pacientesFiltrados.length}</strong> de <strong>{pacientes.length}</strong> paciente(s) registrado(s).
              </div>
              {(busqueda || filtroObraSocial !== 'TODAS' || ordenamiento !== 'NOMBRE_ASC') && (
                <button
                  className="btn btn-link btn-sm p-0 text-decoration-none text-accent font-weight-bold mt-1 mt-sm-0"
                  onClick={limpiarFiltros}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Limpiar filtros
                </button>
              )}
            </div>

            {/* Listado de Pacientes */}
            {cargando ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-2 text-muted-custom">Cargando pacientes...</p>
              </div>
            ) : pacientesFiltrados.length > 0 ? (
              <div className="list-group list-group-flush border-top">
                {pacientesFiltrados.map((paciente) => (
                  <Link
                    key={paciente.id}
                    to={`/pacientes/${paciente.id}`}
                    className="list-group-item list-group-item-action py-3 d-flex align-items-center justify-content-between px-2"
                  >
                    <div className="d-flex align-items-center">
                      <div className="bg-light p-2 rounded-circle text-primary me-3">
                        <i className="bi bi-person fs-5"></i>
                      </div>
                      <div>
                        <span className="font-weight-bold fs-5 text-dark d-block">{paciente.nombre}</span>
                        <div className="d-flex flex-wrap gap-2 align-items-center text-muted-custom mt-1" style={{ fontSize: '0.85rem' }}>
                          <span className="badge bg-light text-primary border">
                            <i className="bi bi-shield-check me-1"></i>
                            {paciente.ObraSocial?.nombre || 'Particular'}
                          </span>
                          {paciente.telefono && (
                            <span><i className="bi bi-telephone me-1"></i>{paciente.telefono}</span>
                          )}
                          {paciente.emailContact && (
                            <span><i className="bi bi-envelope me-1"></i>{paciente.emailContact}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <i className="bi bi-chevron-right text-muted fs-5"></i>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 bg-light rounded">
                <i className="bi bi-person-x fs-1 text-muted"></i>
                <p className="mt-2 text-muted-custom mb-0">
                  {busqueda || filtroObraSocial !== 'TODAS'
                    ? 'No se encontraron pacientes que coincidan con los filtros aplicados.'
                    : 'Aún no registras ningún paciente.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: REGISTRAR PACIENTE */}
      <CrearPacienteModal
        show={showCrearModal}
        onHide={() => setShowCrearModal(false)}
        obrasSociales={obrasSociales}
        setObrasSociales={setObrasSociales}
        onSave={handlePacienteRegistrado}
      />
    </div>
  );
};

export default Pacientes;
