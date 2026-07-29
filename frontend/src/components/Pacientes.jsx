import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import pacientesService from './services/pacientes.service';
import obrasSocialesService from './services/obrasSociales.service';
import CrearPacienteModal from './CrearPacienteModal';

const Pacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [showCrearModal, setShowCrearModal] = useState(false);
  
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
    
    // Recargar lista
    try {
      const pacientesData = await pacientesService.getPacientes();
      setPacientes(pacientesData);
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => setMensajeExito(''), 4000);
  };

  // Filtrado de pacientes
  const pacientesFiltrados = pacientes.filter(paciente =>
    paciente.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

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

      {/* Buscador y Listado en ancho completo */}
      <div className="row">
        <div className="col-12">
          <div className="card p-4 shadow-sm border-0">
            {/* Buscador Simple */}
            <div className="mb-4">
              <label htmlFor="buscador" className="form-label font-weight-bold">
                Buscar paciente por nombre
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  id="buscador"
                  className="form-control border-start-0"
                  placeholder="Escribe el nombre del paciente aquí..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  disabled={cargando}
                />
              </div>
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
                        <span className="text-muted-custom" style={{ fontSize: '0.85rem' }}>
                          <i className="bi bi-card-checklist me-1"></i>
                          Obra Social: {paciente.ObraSocial?.nombre || 'Particular'}
                        </span>
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
                  {busqueda ? 'No se encontraron pacientes que coincidan.' : 'Aún no registras ningún paciente.'}
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
