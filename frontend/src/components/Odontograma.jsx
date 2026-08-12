import React, { useState, useEffect } from 'react';
import pacientesService from './services/pacientes.service';

const DENTITION = {
  permSuperiorDer: [18, 17, 16, 15, 14, 13, 12, 11],
  permSuperiorIzq: [21, 22, 23, 24, 25, 26, 27, 28],
  tempSuperiorDer: [55, 54, 53, 52, 51],
  tempSuperiorIzq: [61, 62, 63, 64, 65],
  tempInferiorDer: [85, 84, 83, 82, 81],
  tempInferiorIzq: [71, 72, 73, 74, 75],
  permInferiorDer: [48, 47, 46, 45, 44, 43, 42, 41],
  permInferiorIzq: [31, 32, 33, 34, 35, 36, 37, 38]
};

const ESTADOS = [
  { id: 'sano', label: '⚪ Sano', color: '#ffffff', textColor: '#212529' },
  { id: 'caries', label: '🔴 Caries', color: '#dc3545', textColor: '#ffffff' },
  { id: 'obturado', label: '🔵 Obturado / Arreglado', color: '#0d6efd', textColor: '#ffffff' },
  { id: 'ausente', label: '❌ Ausente / Extraído', color: '#6c757d', textColor: '#ffffff' },
  { id: 'tratamiento', label: '🟡 En Tratamiento', color: '#ffc107', textColor: '#000000' },
  { id: 'corona', label: '🟣 Corona / Prótesis', color: '#6f42c1', textColor: '#ffffff' }
];

// Componente SVG individual para cada diente anatómico de 5 caras (Cruz Odontológica)
const ToothSvg = ({ num, data, onClick }) => {
  const estado = data?.estado || 'sano';
  const superficies = data?.superficies || {};
  const isAusente = estado === 'ausente';
  const isCorona = estado === 'corona';
  const isTratamiento = estado === 'tratamiento';

  const getSurfaceColor = (caraname) => {
    if (isAusente) return '#e9ecef';
    if (superficies[caraname]) {
      return superficies[caraname] === 'caries' ? '#dc3545' : '#0d6efd';
    }
    if (estado === 'caries') return '#dc3545';
    if (estado === 'obturado') return '#0d6efd';
    if (estado === 'tratamiento') return '#ffc107';
    if (estado === 'corona') return '#6f42c1';
    return '#ffffff';
  };

  return (
    <div
      className="d-flex flex-column align-items-center cursor-pointer p-1 rounded transition-all position-relative"
      style={{ width: '44px', userSelect: 'none' }}
      onClick={() => onClick(num)}
      title={`Pieza ${num}: ${estado.toUpperCase()}${data?.notas ? ` (${data.notas})` : ''}`}
    >
      <span className="text-dark font-weight-bold" style={{ fontSize: '0.78rem' }}>{num}</span>
      
      <div className="position-relative my-1" style={{ width: '38px', height: '38px' }}>
        <svg viewBox="0 0 40 40" width="38" height="38" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.15))' }}>
          {/* Cara Superior (Vestibular / Palatino) */}
          <polygon
            points="0,0 40,0 28,12 12,12"
            fill={getSurfaceColor('top')}
            stroke="#212529"
            strokeWidth="1.2"
          />
          {/* Cara Inferior (Palatino / Lingual) */}
          <polygon
            points="12,28 28,28 40,40 0,40"
            fill={getSurfaceColor('bottom')}
            stroke="#212529"
            strokeWidth="1.2"
          />
          {/* Cara Izquierda (Mesial / Distal) */}
          <polygon
            points="0,0 12,12 12,28 0,40"
            fill={getSurfaceColor('left')}
            stroke="#212529"
            strokeWidth="1.2"
          />
          {/* Cara Derecha (Distal / Mesial) */}
          <polygon
            points="40,0 28,12 28,28 40,40"
            fill={getSurfaceColor('right')}
            stroke="#212529"
            strokeWidth="1.2"
          />
          {/* Cara Central (Oclusal / Incisal) */}
          <rect
            x="12"
            y="12"
            width="16"
            height="16"
            fill={getSurfaceColor('center')}
            stroke="#212529"
            strokeWidth="1.2"
          />

          {/* Cruz de Ausente / Extraído */}
          {isAusente && (
            <>
              <line x1="2" y1="2" x2="38" y2="38" stroke="#dc3545" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="38" y1="2" x2="2" y2="38" stroke="#dc3545" strokeWidth="3.5" strokeLinecap="round" />
            </>
          )}

          {/* Círculo de Corona */}
          {isCorona && (
            <circle cx="20" cy="20" r="17" fill="none" stroke="#6f42c1" strokeWidth="2.5" strokeDasharray="3,2" />
          )}

          {/* Marca de En tratamiento */}
          {isTratamiento && (
            <circle cx="20" cy="20" r="6" fill="#ffc107" stroke="#212529" strokeWidth="1" />
          )}
        </svg>
      </div>

      {data?.notas ? (
        <span className="badge bg-dark text-white p-0 px-1" style={{ fontSize: '0.65rem', maxWidth: '42px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.notas}
        </span>
      ) : (
        <span style={{ height: '14px' }}></span>
      )}
    </div>
  );
};

const Odontograma = ({ pacienteId, odontogramaInicial, onSave }) => {
  const [odontogramaState, setOdontogramaState] = useState(odontogramaInicial || {});
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [toothStatus, setToothStatus] = useState('sano');
  const [toothNotas, setToothNotas] = useState('');
  const [superficiesState, setSuperficiesState] = useState({});
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [verTemporarios, setVerTemporarios] = useState(false);

  useEffect(() => {
    setOdontogramaState(odontogramaInicial || {});
  }, [odontogramaInicial]);

  const handleOpenTooth = (num) => {
    setSelectedTooth(num);
    const data = odontogramaState[num] || {};
    setToothStatus(data.estado || 'sano');
    setToothNotas(data.notas || '');
    setSuperficiesState(data.superficies || {});
  };

  const toggleSuperficie = (cara, estadoTipo) => {
    setSuperficiesState(prev => {
      const actual = prev[cara];
      if (actual === estadoTipo) {
        const copy = { ...prev };
        delete copy[cara];
        return copy;
      }
      return {
        ...prev,
        [cara]: estadoTipo
      };
    });
  };

  const handleApplyToothState = () => {
    if (!selectedTooth) return;

    setOdontogramaState(prev => ({
      ...prev,
      [selectedTooth]: {
        estado: toothStatus,
        superficies: superficiesState,
        notas: toothNotas.trim()
      }
    }));

    setSelectedTooth(null);
  };

  const handleGuardar = async () => {
    try {
      setCargando(true);
      setMensaje('');
      await pacientesService.updateOdontograma(pacienteId, odontogramaState);
      setMensaje('✓ Odontograma guardado correctamente.');
      if (onSave) onSave(odontogramaState);
      setTimeout(() => setMensaje(''), 4000);
    } catch (err) {
      setMensaje('Error al guardar el odontograma.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm mb-4 bg-white">
      <div className="card-body p-4">
        
        {/* Cabecera del Odontograma */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 border-bottom pb-3">
          <div>
            <h3 className="fs-5 mb-1 text-primary font-weight-bold">
              <i className="bi bi-grid-3x3-gap-fill me-2"></i> Odontograma Anatómico FDI (5 Caras)
            </h3>
            <span className="text-muted-custom" style={{ fontSize: '0.88rem' }}>
              Idéntico a la ficha médica en papel. Haz clic en cualquier diente para marcar caras o su estado clínico.
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className={`btn btn-sm ${verTemporarios ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setVerTemporarios(!verTemporarios)}
            >
              <i className="bi bi-person-heart me-1"></i>
              {verTemporarios ? 'Ocultar Dentición Primaria (Niños)' : 'Ver Dentición Primaria (Niños)'}
            </button>
            <button
              type="button"
              className="btn btn-accent text-white btn-sm px-3 font-weight-bold"
              onClick={handleGuardar}
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-save-fill me-1"></i> Guardar Odontograma
                </>
              )}
            </button>
          </div>
        </div>

        {mensaje && (
          <div className={`alert ${mensaje.includes('✓') ? 'alert-success' : 'alert-danger'} py-2 mb-3`} role="alert">
            {mensaje}
          </div>
        )}

        {/* LEYENDA DE ESTADOS */}
        <div className="d-flex flex-wrap gap-2 mb-4 p-2 bg-light rounded border align-items-center justify-content-center">
          <small className="font-weight-bold text-muted me-2">Referencias:</small>
          {ESTADOS.map(est => (
            <span
              key={est.id}
              className="badge d-flex align-items-center gap-1 border px-2 py-1"
              style={{ backgroundColor: est.color, color: est.textColor, borderColor: '#ced4da', fontSize: '0.8rem' }}
            >
              {est.label}
            </span>
          ))}
        </div>

        {/* CONTENEDOR VISUAL DE ARCADAS DENTALES (FDI ANATÓMICO DE 5 CARAS) */}
        <div className="p-3 bg-light rounded border text-center overflow-x-auto">
          
          {/* MAXILAR SUPERIOR PERMANENTE */}
          <div className="mb-4">
            <div className="text-muted font-weight-bold mb-2" style={{ fontSize: '0.85rem' }}>
              --- MAXILAR SUPERIOR (PERMANENTES) ---
            </div>
            <div className="d-flex justify-content-center align-items-center gap-1 flex-nowrap">
              <div className="d-flex gap-1 pe-2 border-end border-2 border-secondary">
                {DENTITION.permSuperiorDer.map(num => (
                  <ToothSvg key={num} num={num} data={odontogramaState[num]} onClick={handleOpenTooth} />
                ))}
              </div>
              <div className="d-flex gap-1 ps-2">
                {DENTITION.permSuperiorIzq.map(num => (
                  <ToothSvg key={num} num={num} data={odontogramaState[num]} onClick={handleOpenTooth} />
                ))}
              </div>
            </div>
          </div>

          {/* DENTICIÓN TEMPORARIA (SI ESTÁ ACTIVADA) */}
          {verTemporarios && (
            <div className="mb-4 p-2 bg-white rounded border border-warning-subtle">
              <div className="text-warning font-weight-bold mb-2" style={{ fontSize: '0.85rem' }}>
                --- DENTICIÓN PRIMARIA / TEMPORARIA (NIÑOS) ---
              </div>
              {/* Superior Temporario */}
              <div className="d-flex justify-content-center align-items-center gap-1 flex-nowrap mb-2">
                <div className="d-flex gap-1 pe-2 border-end border-2 border-warning">
                  {DENTITION.tempSuperiorDer.map(num => (
                    <ToothSvg key={num} num={num} data={odontogramaState[num]} onClick={handleOpenTooth} />
                  ))}
                </div>
                <div className="d-flex gap-1 ps-2">
                  {DENTITION.tempSuperiorIzq.map(num => (
                    <ToothSvg key={num} num={num} data={odontogramaState[num]} onClick={handleOpenTooth} />
                  ))}
                </div>
              </div>
              {/* Inferior Temporario */}
              <div className="d-flex justify-content-center align-items-center gap-1 flex-nowrap">
                <div className="d-flex gap-1 pe-2 border-end border-2 border-warning">
                  {DENTITION.tempInferiorDer.map(num => (
                    <ToothSvg key={num} num={num} data={odontogramaState[num]} onClick={handleOpenTooth} />
                  ))}
                </div>
                <div className="d-flex gap-1 ps-2">
                  {DENTITION.tempInferiorIzq.map(num => (
                    <ToothSvg key={num} num={num} data={odontogramaState[num]} onClick={handleOpenTooth} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MAXILAR INFERIOR PERMANENTE */}
          <div>
            <div className="d-flex justify-content-center align-items-center gap-1 flex-nowrap">
              <div className="d-flex gap-1 pe-2 border-end border-2 border-secondary">
                {DENTITION.permInferiorDer.map(num => (
                  <ToothSvg key={num} num={num} data={odontogramaState[num]} onClick={handleOpenTooth} />
                ))}
              </div>
              <div className="d-flex gap-1 ps-2">
                {DENTITION.permInferiorIzq.map(num => (
                  <ToothSvg key={num} num={num} data={odontogramaState[num]} onClick={handleOpenTooth} />
                ))}
              </div>
            </div>
            <div className="text-muted font-weight-bold mt-2" style={{ fontSize: '0.85rem' }}>
              --- MAXILAR INFERIOR (PERMANENTES) ---
            </div>
          </div>

        </div>

      </div>

      {/* MODAL PARA MARCAR ESTADO GLOBAL O CARAS ANATÓMICAS ESPECÍFICAS DE UN DIENTE */}
      {selectedTooth && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white py-2">
                <h5 className="modal-title fs-6 font-weight-bold">
                  Pieza Dental Nº {selectedTooth} (Diagrama Anatómico)
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedTooth(null)}></button>
              </div>
              <div className="modal-body p-4">
                
                {/* Marcado por Caras Individuales */}
                <h6 className="font-weight-bold text-dark border-bottom pb-2 mb-3">
                  1. Marcado por Caras Anatómicas
                </h6>
                <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                  {[
                    { key: 'top', label: 'Superior (V/P)' },
                    { key: 'bottom', label: 'Inferior (P/L)' },
                    { key: 'left', label: 'Izquierda (M/D)' },
                    { key: 'right', label: 'Derecha (D/M)' },
                    { key: 'center', label: 'Centro (Oclusal)' }
                  ].map(cara => (
                    <div key={cara.key} className="d-flex flex-column align-items-center p-2 bg-light rounded border">
                      <span className="small font-weight-bold mb-1">{cara.label}</span>
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className={`btn btn-sm ${superficiesState[cara.key] === 'caries' ? 'btn-danger' : 'btn-outline-danger'}`}
                          onClick={() => toggleSuperficie(cara.key, 'caries')}
                        >
                          🔴 Caries
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${superficiesState[cara.key] === 'obturado' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => toggleSuperficie(cara.key, 'obturado')}
                        >
                          🔵 Obturado
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Marcado de Estado General */}
                <h6 className="font-weight-bold text-dark border-bottom pb-2 mb-2">
                  2. Estado General de la Pieza Dental
                </h6>
                <div className="row g-2 mb-3">
                  {ESTADOS.map(est => (
                    <div key={est.id} className="col-6">
                      <button
                        type="button"
                        className={`btn w-100 text-start d-flex align-items-center justify-content-between p-2 btn-sm ${toothStatus === est.id ? 'border-2 border-dark font-weight-bold' : ''}`}
                        style={{ backgroundColor: est.color, color: est.textColor, borderColor: '#ced4da' }}
                        onClick={() => setToothStatus(est.id)}
                      >
                        <span>{est.label}</span>
                        {toothStatus === est.id && <i className="bi bi-check-lg"></i>}
                      </button>
                    </div>
                  ))}
                </div>

                <label className="form-label font-weight-bold">Observaciones / Notas adicionales:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Trátamiento de conducto, Perno, Prótesis..."
                  value={toothNotas}
                  onChange={(e) => setToothNotas(e.target.value)}
                />
              </div>
              <div className="modal-footer py-2 bg-light d-flex justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedTooth(null)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary btn-sm px-4 font-weight-bold" onClick={handleApplyToothState}>
                  Aplicar al Odontograma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Odontograma;
