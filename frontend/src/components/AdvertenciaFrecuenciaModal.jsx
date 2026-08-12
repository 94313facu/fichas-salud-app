import React from 'react';

const AdvertenciaFrecuenciaModal = ({ show, onHide, resultadoValidacion, onConfirmParticular, onConfirmObraSocial }) => {
  if (!show || !resultadoValidacion) return null;

  const {
    practicaNombre,
    codigo,
    alcance,
    mesesFrecuencia,
    obraSocialNombre,
    fechaUltima,
    fechaHabilitacion,
    piezaDental,
    caraDental
  } = resultadoValidacion;

  const getAlcanceTexto = (alc) => {
    if (alc === 'paciente') return 'por Paciente (global)';
    if (alc === 'diente') return `por Diente (Pieza ${piezaDental || 'especificada'})`;
    if (alc === 'cara') return `por Cara de Diente (Pieza ${piezaDental || ''} - Cara ${caraDental || ''})`;
    return 'por Paciente';
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          
          <div className="modal-header bg-danger text-white py-3">
            <h5 className="modal-title font-weight-bold d-flex align-items-center fs-5">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
              Advertencia de Refacturación por Obra Social
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>

          <div className="modal-body p-4">
            
            <div className="alert alert-warning py-2 mb-3 border-warning" style={{ fontSize: '0.92rem' }}>
              <i className="bi bi-shield-exclamation me-2 fs-5"></i>
              <strong>{obraSocialNombre}</strong> rechazará este débito por no cumplir la periodicidad permitida.
            </div>

            <div className="card p-3 bg-light border mb-3">
              <div className="mb-2">
                <span className="badge bg-dark text-white font-weight-bold me-2">Código: {codigo}</span>
                <span className="text-dark font-weight-bold fs-6">{practicaNombre}</span>
              </div>

              <div className="small text-secondary mb-1">
                <strong>Alcance de Restricción:</strong> {getAlcanceTexto(alcance)}
              </div>
              <div className="small text-secondary mb-1">
                <strong>Frecuencia Mínima Exigida:</strong> 1 vez cada <strong>{mesesFrecuencia} meses</strong>
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6">
                <div className="p-2 bg-white rounded border text-center">
                  <small className="text-muted d-block font-weight-bold">Última Realización</small>
                  <span className="text-danger font-weight-bold fs-6">📅 {fechaUltima}</span>
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <div className="p-2 bg-white rounded border text-center">
                  <small className="text-muted d-block font-weight-bold">Habilitado para Refacturar</small>
                  <span className="text-success font-weight-bold fs-6">🗓️ {fechaHabilitacion}</span>
                </div>
              </div>
            </div>

            <p className="small text-muted mb-0">
              ¿Cómo deseas proceder con el registro de esta práctica?
            </p>
          </div>

          <div className="modal-footer bg-light p-3 d-flex flex-column gap-2">
            <button
              type="button"
              className="btn btn-warning text-dark w-100 font-weight-bold d-flex align-items-center justify-content-center gap-2"
              onClick={onConfirmParticular}
            >
              <i className="bi bi-currency-dollar"></i> Cobrar como Particular (Sin Obra Social)
            </button>

            <button
              type="button"
              className="btn btn-outline-danger w-100 font-weight-bold d-flex align-items-center justify-content-center gap-2"
              onClick={onConfirmObraSocial}
            >
              <i className="bi bi-exclamation-diamond-fill"></i> Guardar de todas formas (Pendiente de facturar)
            </button>

            <button
              type="button"
              className="btn btn-secondary w-100"
              onClick={onHide}
            >
              Cancelar Carga
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdvertenciaFrecuenciaModal;
