import React, { useEffect, useState, useRef } from 'react';
import pacientesService from './services/pacientes.service';

const EditarSesionModal = ({ show, onHide, pacienteId, sesion, onSave }) => {
  const [notas, setNotas] = useState('');
  const [presupuesto, setPresupuesto] = useState(0);
  const [pago, setPago] = useState(0);
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  // Inicializar estados cuando cambie la sesión seleccionada
  useEffect(() => {
    if (sesion) {
      setNotas(sesion.notas || '');
      setPresupuesto(parseFloat(sesion.presupuesto) || 0);
      setPago(parseFloat(sesion.pago) || 0);
      setArchivo(null);
      setErrorMsg(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [sesion]);

  if (!show || !sesion) return null;

  // Saldo auto-calculado dinámicamente en el cliente
  const saldo = (parseFloat(presupuesto) || 0) - (parseFloat(pago) || 0);



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
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setGuardando(true);
      setErrorMsg(null);
      
      const sesionActualizada = await pacientesService.updateSesion(
        pacienteId,
        sesion.id,
        notas,
        archivo,
        presupuesto,
        pago
      );

      onSave(sesionActualizada);
      onHide();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.mensaje || 'Ocurrió un error al actualizar la sesión.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content border-0 rounded-3 shadow-lg">
          <div className="modal-header bg-primary text-white py-3">
            <h5 className="modal-title font-weight-bold">
              <i className="bi bi-journal-medical me-2"></i> Editar Registro de Sesión
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide} aria-label="Cerrar"></button>
          </div>

          <div className="modal-body p-4 bg-light">
            {errorMsg && (
              <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} id="form-editar-sesion">
              <div className="row g-3">
                {/* Notas de la sesión */}
                <div className="col-12 col-md-6">
                  <label htmlFor="editNotas" className="form-label font-weight-bold">Notas de la sesión / Evolución</label>
                  <textarea
                    id="editNotas"
                    className="form-control"
                    rows="6"
                    placeholder="Escribe la evolución aquí..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    disabled={guardando}
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>


                {/* Presupuesto, Pago y Saldo */}
                <div className="col-12 bg-white p-3 rounded border">
                  <h6 className="border-bottom pb-2 mb-3 text-primary font-weight-bold">
                    <i className="bi bi-currency-dollar me-1"></i> Control de Presupuestos y Pagos
                  </h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label htmlFor="editPresupuesto" className="form-label font-weight-bold">Presupuesto ($)</label>
                      <input
                        type="number"
                        id="editPresupuesto"
                        className="form-control"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={presupuesto}
                        onChange={(e) => setPresupuesto(e.target.value)}
                        disabled={guardando}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label htmlFor="editPago" className="form-label font-weight-bold">Pago realizado ($)</label>
                      <input
                        type="number"
                        id="editPago"
                        className="form-control"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={pago}
                        onChange={(e) => setPago(e.target.value)}
                        disabled={guardando}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label font-weight-bold">Saldo restante ($)</label>
                      <input
                        type="text"
                        className={`form-control font-weight-bold ${saldo > 0 ? 'text-danger bg-light' : 'text-success bg-light'}`}
                        value={saldo.toFixed(2)}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Archivo de progreso */}
                <div className="col-12">
                  <label htmlFor="editArchivo" className="form-label font-weight-bold">Reemplazar foto o video de progreso</label>
                  <input
                    type="file"
                    id="editArchivo"
                    className="form-control"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={guardando}
                  />
                  {sesion.archivoUrl && (
                    <div className="form-text mt-1 text-muted-custom">
                      <i className="bi bi-info-circle me-1"></i> Ya existe un archivo adjunto. Subir uno nuevo lo reemplazará.
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          <div className="modal-footer bg-light border-top">
            <button type="button" className="btn btn-secondary px-4" onClick={onHide} style={{ height: '44px' }} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" form="form-editar-sesion" className="btn btn-primary px-4" style={{ height: '44px' }} disabled={guardando}>
              {guardando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Guardando cambios...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarSesionModal;
