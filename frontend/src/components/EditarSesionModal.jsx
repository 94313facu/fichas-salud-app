import React, { useEffect, useState, useRef } from 'react';
import pacientesService from './services/pacientes.service';
import practicasService from './services/practicas.service';
import AdvertenciaFrecuenciaModal from './AdvertenciaFrecuenciaModal';

const EditarSesionModal = ({ show, onHide, pacienteId, sesion, paciente, obrasSociales, catalogoPracticas = [], onSave }) => {
  const [notas, setNotas] = useState('');
  const [presupuesto, setPresupuesto] = useState(0);
  const [pago, setPago] = useState(0);
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  // Estados para validación de frecuencia
  const [showAdvertencia, setShowAdvertencia] = useState(false);
  const [validacionResult, setValidacionResult] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  // Campos de facturación y prácticas
  const [sesionObraSocialId, setSesionObraSocialId] = useState('');
  const [practicasSesion, setPracticasSesion] = useState([]);
  const [codigoPractica, setCodigoPractica] = useState('');
  const [nombrePractica, setNombrePractica] = useState('');
  const [isNuevaPractica, setIsNuevaPractica] = useState(false);
  const [piezaDental, setPiezaDental] = useState('');
  const [caraDental, setCaraDental] = useState('');

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

      setSesionObraSocialId(sesion.obraSocialId || '');
      let p = [];
      if (sesion.practicasMultiples) {
        try { p = JSON.parse(sesion.practicasMultiples); } catch(e){}
      } else if (sesion.codigoPractica) {
        p = [{ 
          codigoPractica: sesion.codigoPractica,
          nombrePractica: catalogoPracticas.find(c => c.codigo.toLowerCase() === (sesion.codigoPractica || '').toLowerCase())?.nombre || '',
          piezaDental: sesion.piezaDental,
          caraDental: sesion.caraDental
        }];
      }
      setPracticasSesion(p);
      
      setCodigoPractica('');
      setNombrePractica('');
      setPiezaDental('');
      setCaraDental('');
      setIsNuevaPractica(false);
    }
  }, [sesion, catalogoPracticas]);

  if (!show || !sesion) return null;

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

  const handleCodigoChange = async (val) => {
    setCodigoPractica(val);
    if (val.trim().length >= 2) {
      const search = await practicasService.buscarCodigo(val, paciente?.obraSocialId, paciente?.planObraSocialId);
      if (search.existe) {
        setNombrePractica(search.practica.nombre);
      }
    }
  };

  const handleNombreChange = async (val) => {
    setNombrePractica(val);
    if (val.trim().length >= 3) {
      const practica = catalogoPracticas.find(p => p.nombre.toLowerCase() === val.trim().toLowerCase());
      if (practica) {
        setCodigoPractica(practica.codigo);
      }
    }
  };

  const handleQuitarPractica = (index) => {
    setPracticasSesion(prev => prev.filter((_, i) => i !== index));
  };

  const handleAgregarPractica = async (e) => {
    e.preventDefault();
    if (!codigoPractica.trim() && !nombrePractica.trim()) {
      setErrorMsg('Debes seleccionar o ingresar una práctica.');
      return;
    }
    if (practicasSesion.length >= 5) {
      setErrorMsg('Solo puedes registrar hasta 5 prácticas por sesión.');
      return;
    }

    try {
      setGuardando(true);
      setErrorMsg('');

      if (isNuevaPractica) {
        try {
          await practicasService.savePractica({
            codigo: codigoPractica.trim(),
            nombre: nombrePractica.trim(),
            alcance: 'paciente',
            mesesFrecuencia: 0
          });
        } catch (e) {
          console.error('Error al guardar la nueva práctica en el catálogo:', e);
        }
      }

      if (codigoPractica.trim() && sesionObraSocialId) {
        const val = await practicasService.validarFrecuencia(
          pacienteId,
          codigoPractica.trim(),
          piezaDental,
          caraDental,
          sesion.fechaHora || sesion.createdAt,
          parseInt(sesionObraSocialId),
          sesion.id,
          practicasSesion
        );

        if (!val.valido) {
          setValidacionResult(val);
          setPendingAction({
            type: 'agregar',
            practica: {
              codigoPractica: codigoPractica.trim(),
              nombrePractica: nombrePractica.trim(),
              piezaDental: piezaDental.trim(),
              caraDental: caraDental.trim()
            }
          });
          setShowAdvertencia(true);
          setGuardando(false);
          return;
        }
      }

      setPracticasSesion(prev => [...prev, {
        codigoPractica: codigoPractica.trim(),
        nombrePractica: nombrePractica.trim(),
        piezaDental: piezaDental.trim(),
        caraDental: caraDental.trim()
      }]);

      setCodigoPractica('');
      setNombrePractica('');
      setIsNuevaPractica(false);
      setPiezaDental('');
      setCaraDental('');
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.mensaje || 'Error al validar la práctica.');
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarUpdate = async (practicasFinales, forcedModalidad, forcedOSId) => {
    try {
      setGuardando(true);
      setErrorMsg(null);

      let planId = null;
      const finalOSId = forcedOSId !== undefined ? forcedOSId : (sesionObraSocialId ? parseInt(sesionObraSocialId) : null);
      
      if (finalOSId && paciente) {
        if (paciente.ObrasSocialesAsociadas) {
          const osAsoc = paciente.ObrasSocialesAsociadas.find(o => o.obraSocialId == finalOSId);
          if (osAsoc) planId = osAsoc.planObraSocialId;
        } else if (paciente.obraSocialId == finalOSId) {
          planId = paciente.planObraSocialId;
        }
      }

      const modalidadPrincipal = forcedModalidad || (finalOSId ? 'obra_social' : 'particular');

      const practicasPrincipal = [];
      const practicasSecundaria = [];

      practicasFinales.forEach(p => {
        const pModalidad = p.modalidadCobro || modalidadPrincipal;
        if (pModalidad === modalidadPrincipal) {
          practicasPrincipal.push(p);
        } else {
          practicasSecundaria.push(p);
        }
      });

      // 1. Actualizamos la sesión original
      const sesionActualizada = await pacientesService.updateSesion(
        pacienteId,
        sesion.id,
        notas,
        archivo,
        presupuesto,
        pago,
        practicasPrincipal,
        modalidadPrincipal,
        finalOSId,
        planId ? parseInt(planId) : null
      );

      // 2. Si hay prácticas secundarias (que tienen distinta modalidad), creamos una nueva sesión
      if (practicasSecundaria.length > 0) {
        const modalidadSecundaria = modalidadPrincipal === 'obra_social' ? 'particular' : 'obra_social';
        await pacientesService.createSesion(
          pacienteId,
          notas,
          null, // Sin duplicar archivo
          practicasPrincipal.length > 0 ? 0 : presupuesto,
          practicasPrincipal.length > 0 ? 0 : pago,
          practicasSecundaria,
          modalidadSecundaria,
          modalidadSecundaria === 'obra_social' ? finalOSId : null,
          modalidadSecundaria === 'obra_social' ? (planId ? parseInt(planId) : null) : null
        );
      }

      onSave(sesionActualizada);
      onHide();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.mensaje || 'Ocurrió un error al actualizar la sesión.');
    } finally {
      setGuardando(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      setGuardando(true);
      setErrorMsg(null);
      
      let practicasFinales = [...practicasSesion];

      // Auto-agregar si quedaron inputs sin agregar
      if (codigoPractica.trim() && nombrePractica.trim()) {
        if (isNuevaPractica) {
          try {
            await practicasService.savePractica({
              codigo: codigoPractica.trim(),
              nombre: nombrePractica.trim(),
              alcance: 'paciente',
              mesesFrecuencia: 0
            });
          } catch (e) {
            console.error('Error al guardar la nueva práctica en el catálogo:', e);
          }
        }

        if (practicasFinales.length >= 5) {
          setErrorMsg('Solo puedes registrar hasta 5 prácticas por sesión.');
          setGuardando(false);
          return;
        }

        if (sesionObraSocialId) {
          const val = await practicasService.validarFrecuencia(
            pacienteId,
            codigoPractica.trim(),
            piezaDental,
            caraDental,
            sesion.fechaHora || sesion.createdAt,
            parseInt(sesionObraSocialId),
            sesion.id,
            practicasFinales
          );

          if (!val.valido) {
            setValidacionResult(val);
            setPendingAction({ 
              type: 'submit',
              practicasFinales: [...practicasFinales, {
                codigoPractica: codigoPractica.trim(),
                nombrePractica: nombrePractica.trim(),
                piezaDental: piezaDental.trim(),
                caraDental: caraDental.trim()
              }]
            });
            setShowAdvertencia(true);
            setGuardando(false);
            return;
          }
        }

        practicasFinales.push({
          codigoPractica: codigoPractica.trim(),
          nombrePractica: nombrePractica.trim(),
          piezaDental: piezaDental.trim(),
          caraDental: caraDental.trim()
        });
      }

      await ejecutarUpdate(practicasFinales);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.mensaje || 'Ocurrió un error al validar la sesión.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
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
              <div className="row g-4">
                
                {/* Lado Izquierdo: Prácticas y Obra Social */}
                <div className="col-12 col-lg-6">
                  <div className="card p-3 bg-white border shadow-sm">
                    <h6 className="font-weight-bold text-primary mb-3">
                      <i className="bi bi-tag-fill me-1"></i> Práctica y Facturación Odontológica
                    </h6>
                    
                    <div className="row g-2">
                      {paciente && ((paciente.ObrasSocialesAsociadas && paciente.ObrasSocialesAsociadas.length > 0) || paciente.obraSocialId) && (
                        <div className="col-12 mb-2">
                          <label className="form-label font-weight-bold mb-1 small">Facturar a Obra Social</label>
                          <select 
                            className="form-select form-select-sm" 
                            value={sesionObraSocialId}
                            onChange={e => setSesionObraSocialId(e.target.value)}
                          >
                            <option value="">Particular / Sin Facturar a OS</option>
                            {(paciente.ObrasSocialesAsociadas && paciente.ObrasSocialesAsociadas.length > 0) 
                              ? paciente.ObrasSocialesAsociadas.map(os => (
                                <option key={os.id} value={os.obraSocialId}>{os.ObraSocial?.nombre}</option>
                              ))
                              : (paciente.ObraSocial && <option value={paciente.ObraSocial.id}>{paciente.ObraSocial.nombre}</option>)
                            }
                          </select>
                        </div>
                      )}

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
                        <label className="form-label font-weight-bold mb-1 small">Código</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Ej. 0101"
                          value={codigoPractica}
                          onChange={(e) => handleCodigoChange(e.target.value)}
                          onBlur={(e) => handleCodigoChange(e.target.value)}
                          readOnly={!isNuevaPractica && nombrePractica !== ''}
                        />
                      </div>

                      <div className="col-6 col-sm-6 mt-2">
                        <label className="form-label font-weight-bold mb-1 small">Pieza Dental (Opcional)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Ej. 18"
                          value={piezaDental}
                          onChange={(e) => setPiezaDental(e.target.value)}
                        />
                      </div>

                      <div className="col-6 col-sm-6 mt-2">
                        <label className="form-label font-weight-bold mb-1 small">Cara (Opcional)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Ej. Oclusal"
                          value={caraDental}
                          onChange={(e) => setCaraDental(e.target.value)}
                        />
                      </div>
                      
                      <div className="col-12 mt-3">
                        <button 
                          type="button" 
                          className="btn btn-outline-primary btn-sm w-100" 
                          onClick={handleAgregarPractica}
                          disabled={guardando || (!codigoPractica && !nombrePractica) || practicasSesion.length >= 5}
                        >
                          <i className="bi bi-plus-circle me-1"></i> Agregar Práctica
                        </button>
                      </div>
                    </div>
                  </div>

                  {practicasSesion.length > 0 && (
                    <div className="mt-3">
                      <h6 className="font-weight-bold text-primary mb-2 small">Prácticas de la sesión ({practicasSesion.length}/5)</h6>
                      <ul className="list-group list-group-flush border rounded">
                        {practicasSesion.map((prac, idx) => (
                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center py-1 px-2 small bg-light">
                            <div>
                              <strong>{prac.codigoPractica}</strong> - {prac.nombrePractica}
                              {prac.piezaDental && <span className="badge bg-secondary ms-1">P: {prac.piezaDental}</span>}
                              {prac.caraDental && <span className="badge bg-secondary ms-1">C: {prac.caraDental}</span>}
                            </div>
                            <button type="button" className="btn btn-sm btn-link text-danger p-0 m-0" onClick={() => handleQuitarPractica(idx)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Lado Derecho: Evolución y Finanzas */}
                <div className="col-12 col-lg-6">
                  <div className="mb-3">
                    <label htmlFor="editNotas" className="form-label font-weight-bold">Notas de la sesión / Evolución</label>
                    <textarea
                      id="editNotas"
                      className="form-control"
                      rows="4"
                      placeholder="Escribe la evolución aquí..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      disabled={guardando}
                      style={{ resize: 'vertical' }}
                    ></textarea>
                  </div>

                  <div className="bg-white p-3 rounded border mb-3">
                    <h6 className="border-bottom pb-2 mb-3 text-primary font-weight-bold">
                      <i className="bi bi-currency-dollar me-1"></i> Control de Presupuestos y Pagos
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label htmlFor="editPresupuesto" className="form-label font-weight-bold small">Presupuesto ($)</label>
                        <input
                          type="number"
                          id="editPresupuesto"
                          className="form-control form-control-sm"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={presupuesto}
                          onChange={(e) => setPresupuesto(e.target.value)}
                          disabled={guardando}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label htmlFor="editPago" className="form-label font-weight-bold small">Pago realizado ($)</label>
                        <input
                          type="number"
                          id="editPago"
                          className="form-control form-control-sm"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={pago}
                          onChange={(e) => setPago(e.target.value)}
                          disabled={guardando}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label font-weight-bold small">Saldo ($)</label>
                        <input
                          type="text"
                          className={`form-control form-control-sm font-weight-bold ${saldo > 0 ? 'text-danger bg-light' : 'text-success bg-light'}`}
                          value={saldo.toFixed(2)}
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div>
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
                      <div className="form-text mt-1 text-muted-custom small">
                        <i className="bi bi-info-circle me-1"></i> Ya existe un archivo adjunto. Subir uno nuevo lo reemplazará.
                      </div>
                    )}
                  </div>
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
    <AdvertenciaFrecuenciaModal
      show={showAdvertencia}
      onHide={() => setShowAdvertencia(false)}
      resultadoValidacion={validacionResult}
      onConfirmParticular={async () => {
        setShowAdvertencia(false);
        if (pendingAction.type === 'agregar') {
          const prac = { ...pendingAction.practica, modalidadCobro: 'particular' };
          setPracticasSesion(prev => [...prev, prac]);
          setCodigoPractica('');
          setNombrePractica('');
          setPiezaDental('');
          setCaraDental('');
          setIsNuevaPractica(false);
        } else if (pendingAction.type === 'submit') {
          const finales = pendingAction.practicasFinales.map((p, idx) => {
            if (idx === pendingAction.practicasFinales.length - 1) {
              return { ...p, modalidadCobro: 'particular' };
            }
            return p;
          });
          await ejecutarUpdate(finales);
        }
      }}
      onConfirmObraSocial={async () => {
        setShowAdvertencia(false);
        if (pendingAction.type === 'agregar') {
          setPracticasSesion(prev => [...prev, pendingAction.practica]);
          setCodigoPractica('');
          setNombrePractica('');
          setPiezaDental('');
          setCaraDental('');
          setIsNuevaPractica(false);
        } else if (pendingAction.type === 'submit') {
          await ejecutarUpdate(pendingAction.practicasFinales);
        }
      }}
    />
    </>
  );
};

export default EditarSesionModal;
