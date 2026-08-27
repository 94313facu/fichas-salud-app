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

// Definición de colores según norma odontológica argentina
const COLORES = {
  rojo: { key: 'rojo', label: 'A Realizar', hex: '#dc3545', text: '#ffffff', icon: '🔴', desc: 'Lo que hay que hacer' },
  azul: { key: 'azul', label: 'Realizado', hex: '#0d6efd', text: '#ffffff', icon: '🔵', desc: 'Lo que ya le hicieron' },
  violeta: { key: 'violeta', label: 'A Rehacer', hex: '#7b2cbf', text: '#ffffff', icon: '🟣', desc: 'Lo que hay que rehacer' },
  ninguno: { key: 'ninguno', label: 'Sin marcar / Sano', hex: '#ffffff', text: '#212529', icon: '⚪', desc: 'Normal' }
};

// Catálogo de 11 formas y simbologías odontológicas estándar
const SIMBOLOGIAS = [
  { id: 'ninguno', label: 'Sin Simbología', desc: 'Diente natural / Sano', iconClass: 'bi-circle' },
  { id: 'corona', label: 'Corona', desc: 'Círculo envolvente', iconClass: 'bi-circle' },
  { id: 'extraido', label: 'Diente Extraído', desc: 'Cruz diagonal (X)', iconClass: 'bi-x-lg' },
  { id: 'sellador', label: 'Sellador', desc: 'Letra S inferior', iconClass: 'bi-type-bold' },
  { id: 'ppr_acrilico', label: 'PPR Acrílico', desc: 'Prótesis Parcial Removible Acrílico (2 líneas horiz.)', iconClass: 'bi-distribute-horizontal' },
  { id: 'ppr_crco', label: 'PPR Cr-Co', desc: 'Prótesis Parcial Removible Cromo-Cobalto (barra gruesa)', iconClass: 'bi-dash-square-fill' },
  { id: 'endodoncia', label: 'Endodoncia', desc: 'Tratamiento de conducto (2 líneas vert.)', iconClass: 'bi-distribute-vertical' },
  { id: 'tramo_ceramico', label: 'Tramo Puente Cerámico', desc: 'Corchete superior simple', iconClass: 'bi-chevron-compact-up' },
  { id: 'tramo_metalico', label: 'Tramo Puente Metálico', desc: 'Corchete superior metálico doble', iconClass: 'bi-window-stack' },
  { id: 'ausente', label: 'Diente Ausente', desc: 'Sombreado completo', iconClass: 'bi-square-fill' },
  { id: 'perno', label: 'Perno', desc: 'Perno / Muñón / Espiga', iconClass: 'bi-pin-fill' },
  { id: 'implante', label: 'Implante', desc: 'Implante osteointegrado', iconClass: 'bi-nut-fill' }
];

// Helper para convertir datos anteriores o resolver color de una cara
const getSurfaceHex = (colorValue) => {
  if (!colorValue || colorValue === 'ninguno' || colorValue === 'sano') return '#ffffff';
  if (colorValue === 'rojo' || colorValue === 'caries') return COLORES.rojo.hex;
  if (colorValue === 'azul' || colorValue === 'obturado') return COLORES.azul.hex;
  if (colorValue === 'violeta' || colorValue === 'tratamiento') return COLORES.violeta.hex;
  return colorValue; // Si ya es un código hex
};

// Componente SVG para un Diente Individual con soporte completo de 5 caras y las 11 simbologías
const ToothSvg = ({ num, data, onClick, isInteractive = true, size = 44 }) => {
  const superficies = data?.superficies || {};
  const simbologia = data?.simbologia || (data?.estado === 'corona' ? 'corona' : data?.estado === 'ausente' ? 'ausente' : 'ninguno');
  const estadoColor = data?.estadoColor || (data?.estado === 'caries' ? 'rojo' : data?.estado === 'obturado' ? 'azul' : data?.estado === 'corona' ? 'violeta' : 'rojo');
  const mainColorHex = COLORES[estadoColor]?.hex || COLORES.rojo.hex;
  const isAusente = simbologia === 'ausente';

  const getColor = (cara) => {
    if (isAusente) return '#e9ecef';
    const val = superficies[cara];
    return getSurfaceHex(val);
  };

  return (
    <div
      className={`d-flex flex-column align-items-center ${isInteractive ? 'cursor-pointer' : ''} p-1 rounded transition-all position-relative`}
      style={{ width: `${size}px`, userSelect: 'none' }}
      onClick={() => onClick && onClick(num)}
      title={`Pieza ${num}: ${simbologia !== 'ninguno' ? SIMBOLOGIAS.find(s => s.id === simbologia)?.label : 'Normal'} ${data?.notas ? `(${data.notas})` : ''}`}
    >
      <span className="text-dark font-weight-bold" style={{ fontSize: size < 50 ? '0.76rem' : '0.9rem' }}>
        {num}
      </span>

      <div className="position-relative my-1" style={{ width: `${size - 6}px`, height: `${size - 6}px` }}>
        <svg viewBox="0 0 40 40" width={size - 6} height={size - 6} style={{ overflow: 'visible', filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.12))' }}>
          
          {/* Cara Superior (Vestibular / Palatino) */}
          <polygon
            points="0,0 40,0 28,12 12,12"
            fill={getColor('top')}
            stroke="#212529"
            strokeWidth="1.2"
          />
          {/* Cara Inferior (Palatino / Lingual) */}
          <polygon
            points="12,28 28,28 40,40 0,40"
            fill={getColor('bottom')}
            stroke="#212529"
            strokeWidth="1.2"
          />
          {/* Cara Izquierda (Mesial / Distal) */}
          <polygon
            points="0,0 12,12 12,28 0,40"
            fill={getColor('left')}
            stroke="#212529"
            strokeWidth="1.2"
          />
          {/* Cara Derecha (Distal / Mesial) */}
          <polygon
            points="40,0 28,12 28,28 40,40"
            fill={getColor('right')}
            stroke="#212529"
            strokeWidth="1.2"
          />
          {/* Cara Central (Oclusal / Incisal) */}
          <rect
            x="12"
            y="12"
            width="16"
            height="16"
            fill={getColor('center')}
            stroke="#212529"
            strokeWidth="1.2"
          />

          {/* SIMBOLOGÍAS ODONTOLÓGICAS VECTORIALES */}

          {/* 1. Corona: Círculo exterior circunscrito */}
          {simbologia === 'corona' && (
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke={mainColorHex}
              strokeWidth="2.2"
            />
          )}

          {/* 2. Diente Extraído: Cruz diagonal (X) */}
          {simbologia === 'extraido' && (
            <g stroke={mainColorHex} strokeWidth="2.8" strokeLinecap="round">
              <line x1="2" y1="2" x2="38" y2="38" />
              <line x1="38" y1="2" x2="2" y2="38" />
            </g>
          )}

          {/* 3. Sellador: Letra 'S' debajo */}
          {simbologia === 'sellador' && (
            <text
              x="20"
              y="50"
              textAnchor="middle"
              fill={mainColorHex}
              fontSize="12"
              fontWeight="900"
              fontFamily="Arial, sans-serif"
            >
              S
            </text>
          )}

          {/* 4. Prótesis Parcial Removible de Acrílico: 2 líneas horizontales */}
          {simbologia === 'ppr_acrilico' && (
            <g stroke={mainColorHex} strokeWidth="2" strokeLinecap="round">
              <line x1="-3" y1="16" x2="43" y2="16" />
              <line x1="-3" y1="24" x2="43" y2="24" />
            </g>
          )}

          {/* 5. Prótesis Parcial Removible Cr-Co (Cromo cobalto): Barra gruesa / franja horizontal */}
          {simbologia === 'ppr_crco' && (
            <rect
              x="-3"
              y="14"
              width="46"
              height="12"
              fill="#212529"
              opacity="0.85"
            />
          )}

          {/* 6. Endodoncia: 2 líneas verticales paralelas en el centro */}
          {simbologia === 'endodoncia' && (
            <g stroke={mainColorHex} strokeWidth="2" strokeLinecap="round">
              <line x1="16" y1="-2" x2="16" y2="42" />
              <line x1="24" y1="-2" x2="24" y2="42" />
            </g>
          )}

          {/* 7. Tramo de Puente Cerámico: Corchete superior simple */}
          {simbologia === 'tramo_ceramico' && (
            <path
              d="M 1 6 L 1 0 L 39 0 L 39 6"
              fill="none"
              stroke="#d97706"
              strokeWidth="2.5"
              strokeLinecap="square"
            />
          )}

          {/* 8. Tramo de Puente Metálico: Corchete superior metálico doble */}
          {simbologia === 'tramo_metalico' && (
            <g stroke="#495057" strokeWidth="1.8" fill="none">
              <path d="M 0 7 L 0 -2 L 40 -2 L 40 7" />
              <path d="M 2 7 L 2 1 L 38 1 L 38 7" />
            </g>
          )}

          {/* 9. Diente Ausente: Sombreado gris sólido completo */}
          {simbologia === 'ausente' && (
            <rect
              x="0"
              y="0"
              width="40"
              height="40"
              fill="#495057"
              opacity="0.88"
            />
          )}

          {/* 10. Perno: Cabeza circular con espiga vertical */}
          {simbologia === 'perno' && (
            <g fill={mainColorHex} stroke="#212529" strokeWidth="0.8">
              <circle cx="20" cy="14" r="4.2" />
              <rect x="18" y="14" width="4" height="15" rx="1" />
            </g>
          )}

          {/* 11. Implante: Tornillo/espiga roscada central */}
          {simbologia === 'implante' && (
            <g stroke={mainColorHex} strokeWidth="1.6" fill="none">
              <path d="M 14 10 L 26 10 L 23 30 L 20 34 L 17 30 Z" fill="rgba(0,0,0,0.05)" />
              <line x1="14" y1="14" x2="26" y2="14" />
              <line x1="15" y1="19" x2="25" y2="19" />
              <line x1="16" y1="24" x2="24" y2="24" />
              <line x1="18" y1="29" x2="22" y2="29" />
            </g>
          )}
        </svg>
      </div>

      {data?.notas ? (
        <span
          className="badge bg-dark text-white p-0 px-1 mt-1"
          style={{ fontSize: '0.62rem', maxWidth: '42px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {data.notas}
        </span>
      ) : (
        <span style={{ height: '12px' }}></span>
      )}
    </div>
  );
};

const Odontograma = ({ pacienteId, odontogramaInicial, onSave }) => {
  const [odontogramaState, setOdontogramaState] = useState(odontogramaInicial || {});
  const [selectedTooth, setSelectedTooth] = useState(null);
  
  // Estados del modal de edición de diente
  const [activeColorChoice, setActiveColorChoice] = useState('rojo'); // 'rojo' | 'azul' | 'violeta'
  const [toothSimbologia, setToothSimbologia] = useState('ninguno');
  const [toothSimbologiaColor, setToothSimbologiaColor] = useState('rojo');
  const [toothNotas, setToothNotas] = useState('');
  const [superficiesState, setSuperficiesState] = useState({});

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [verTemporarios, setVerTemporarios] = useState(false);
  const [showGuiaSimbologia, setShowGuiaSimbologia] = useState(false);

  useEffect(() => {
    setOdontogramaState(odontogramaInicial || {});
  }, [odontogramaInicial]);

  const handleOpenTooth = (num) => {
    setSelectedTooth(num);
    const data = odontogramaState[num] || {};
    setToothSimbologia(data.simbologia || (data.estado === 'corona' ? 'corona' : data.estado === 'ausente' ? 'ausente' : 'ninguno'));
    setToothSimbologiaColor(data.estadoColor || (data.estado === 'obturado' ? 'azul' : data.estado === 'corona' ? 'violeta' : 'rojo'));
    setToothNotas(data.notas || '');
    setSuperficiesState(data.superficies || {});
  };

  // Pintar cara con el color activo seleccionado o desmarcar si ya tiene ese color
  const handleToggleCara = (cara) => {
    setSuperficiesState(prev => {
      const actual = prev[cara];
      if (actual === activeColorChoice) {
        const copy = { ...prev };
        delete copy[cara];
        return copy;
      }
      return {
        ...prev,
        [cara]: activeColorChoice
      };
    });
  };

  const handlePintarTodas = (colorKey) => {
    if (colorKey === 'ninguno') {
      setSuperficiesState({});
    } else {
      setSuperficiesState({
        top: colorKey,
        bottom: colorKey,
        left: colorKey,
        right: colorKey,
        center: colorKey
      });
    }
  };

  const handleLimpiarDiente = () => {
    setToothSimbologia('ninguno');
    setToothSimbologiaColor('rojo');
    setSuperficiesState({});
    setToothNotas('');
  };

  const handleApplyToothState = () => {
    if (!selectedTooth) return;

    setOdontogramaState(prev => ({
      ...prev,
      [selectedTooth]: {
        simbologia: toothSimbologia,
        estadoColor: toothSimbologiaColor,
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
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 border-bottom pb-3">
          <div>
            <h3 className="fs-5 mb-1 text-primary font-weight-bold d-flex align-items-center">
              <i className="bi bi-grid-3x3-gap-fill me-2"></i> Odontograma Clínico Anatómico FDI (5 Caras)
            </h3>
            <span className="text-muted-custom" style={{ fontSize: '0.88rem' }}>
              Sistema estandarizado por colores: <strong>Rojo</strong> (A realizar), <strong>Azul</strong> (Realizado), <strong>Violeta</strong> (A rehacer).
            </span>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-info"
              onClick={() => setShowGuiaSimbologia(!showGuiaSimbologia)}
            >
              <i className="bi bi-journal-medical me-1"></i>
              {showGuiaSimbologia ? 'Ocultar Referencias' : 'Ver Guía de Marcas'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${verTemporarios ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setVerTemporarios(!verTemporarios)}
            >
              <i className="bi bi-person-heart me-1"></i>
              {verTemporarios ? 'Ocultar Niños' : 'Dentición Niños'}
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

        {/* LEYENDA PRINCIPAL DE CÓDIGO DE COLORES */}
        <div className="d-flex flex-wrap gap-2 mb-3 p-2 bg-light rounded border align-items-center justify-content-center">
          <small className="font-weight-bold text-dark me-2">Código de Colores:</small>
          <span className="badge px-3 py-2 text-white font-weight-bold" style={{ backgroundColor: COLORES.rojo.hex, fontSize: '0.82rem' }}>
            🔴 Rojo = A Realizar (Lo que hay que hacer)
          </span>
          <span className="badge px-3 py-2 text-white font-weight-bold" style={{ backgroundColor: COLORES.azul.hex, fontSize: '0.82rem' }}>
            🔵 Azul = Realizado (Lo que ya le hicieron)
          </span>
          <span className="badge px-3 py-2 text-white font-weight-bold" style={{ backgroundColor: COLORES.violeta.hex, fontSize: '0.82rem' }}>
            🟣 Violeta = A Rehacer (Lo que hay que rehacer)
          </span>
        </div>

        {/* GUÍA DESPLEGABLE CON LAS 11 FORMAS CLÍNICAS */}
        {showGuiaSimbologia && (
          <div className="mb-4 p-3 bg-white rounded border border-primary shadow-sm">
            <h6 className="font-weight-bold text-primary mb-3">
              <i className="bi bi-bookmark-check-fill me-1"></i> Simbologías Clínicas del Odontograma
            </h6>
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-2">
              {SIMBOLOGIAS.filter(s => s.id !== 'ninguno').map(s => (
                <div key={s.id} className="col">
                  <div className="p-2 border rounded bg-light d-flex align-items-center gap-2 h-100">
                    <div style={{ width: '36px', height: '36px' }}>
                      <ToothSvg
                        num=""
                        data={{ simbologia: s.id, estadoColor: 'rojo' }}
                        isInteractive={false}
                        size={36}
                      />
                    </div>
                    <div>
                      <strong className="d-block text-dark" style={{ fontSize: '0.82rem' }}>{s.label}</strong>
                      <span className="text-muted small" style={{ fontSize: '0.74rem' }}>{s.desc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              
              <div className="modal-header bg-primary text-white py-2">
                <h5 className="modal-title fs-6 font-weight-bold d-flex align-items-center">
                  <i className="bi bi-pencil-square me-2"></i> Edición Pieza Dental Nº {selectedTooth}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedTooth(null)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-4">

                  {/* COLUMNA IZQUIERDA: MARCACIÓN DE CARAS Y VISTA PREVIA */}
                  <div className="col-12 col-md-6 border-end-md">
                    
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="font-weight-bold text-primary mb-0">
                        1. Carillas y Centro (5 Caras)
                      </h6>
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm py-0"
                          onClick={() => handlePintarTodas('rojo')}
                          title="Pintar todas las caras en rojo"
                        >
                          Todas 🔴
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm py-0"
                          onClick={() => handlePintarTodas('azul')}
                          title="Pintar todas las caras en azul"
                        >
                          Todas 🔵
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm py-0"
                          onClick={() => handlePintarTodas('ninguno')}
                          title="Limpiar todas las caras"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>

                    <div className="p-2 mb-3 bg-light rounded border text-center">
                      <small className="text-muted d-block mb-1 font-weight-bold">
                        Selecciona el color del pincel:
                      </small>
                      <div className="btn-group w-100">
                        <button
                          type="button"
                          className={`btn btn-sm ${activeColorChoice === 'rojo' ? 'btn-danger font-weight-bold' : 'btn-outline-danger'}`}
                          onClick={() => setActiveColorChoice('rojo')}
                        >
                          🔴 Rojo (A hacer)
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${activeColorChoice === 'azul' ? 'btn-primary font-weight-bold' : 'btn-outline-primary'}`}
                          onClick={() => setActiveColorChoice('azul')}
                        >
                          🔵 Azul (Hecho)
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${activeColorChoice === 'violeta' ? 'btn-purple text-white font-weight-bold' : 'btn-outline-purple'}`}
                          style={{
                            backgroundColor: activeColorChoice === 'violeta' ? COLORES.violeta.hex : 'transparent',
                            borderColor: COLORES.violeta.hex,
                            color: activeColorChoice === 'violeta' ? '#fff' : COLORES.violeta.hex
                          }}
                          onClick={() => setActiveColorChoice('violeta')}
                        >
                          🟣 Violeta (Rehacer)
                        </button>
                      </div>
                    </div>

                    {/* VISTA PREVIA INTERACTIVA DE LAS 5 CARAS CON CLICK DIRECTO */}
                    <div className="d-flex flex-column align-items-center justify-content-center p-3 bg-white rounded border shadow-sm mb-3">
                      <span className="small text-muted mb-2 font-weight-bold">
                        Haz clic en una cara para pintarla con el color seleccionado:
                      </span>
                      
                      <div style={{ width: '130px', height: '130px' }} className="position-relative">
                        <svg viewBox="0 0 40 40" width="130" height="130" style={{ cursor: 'pointer' }}>
                          {/* Cara Superior */}
                          <polygon
                            points="0,0 40,0 28,12 12,12"
                            fill={getSurfaceHex(superficiesState.top)}
                            stroke="#212529"
                            strokeWidth="1.2"
                            onClick={() => handleToggleCara('top')}
                          >
                            <title>Cara Superior (Vestibular / Palatino)</title>
                          </polygon>
                          {/* Cara Inferior */}
                          <polygon
                            points="12,28 28,28 40,40 0,40"
                            fill={getSurfaceHex(superficiesState.bottom)}
                            stroke="#212529"
                            strokeWidth="1.2"
                            onClick={() => handleToggleCara('bottom')}
                          >
                            <title>Cara Inferior (Palatino / Lingual)</title>
                          </polygon>
                          {/* Cara Izquierda */}
                          <polygon
                            points="0,0 12,12 12,28 0,40"
                            fill={getSurfaceHex(superficiesState.left)}
                            stroke="#212529"
                            strokeWidth="1.2"
                            onClick={() => handleToggleCara('left')}
                          >
                            <title>Cara Izquierda (Mesial / Distal)</title>
                          </polygon>
                          {/* Cara Derecha */}
                          <polygon
                            points="40,0 28,12 28,28 40,40"
                            fill={getSurfaceHex(superficiesState.right)}
                            stroke="#212529"
                            strokeWidth="1.2"
                            onClick={() => handleToggleCara('right')}
                          >
                            <title>Cara Derecha (Distal / Mesial)</title>
                          </polygon>
                          {/* Cara Central */}
                          <rect
                            x="12"
                            y="12"
                            width="16"
                            height="16"
                            fill={getSurfaceHex(superficiesState.center)}
                            stroke="#212529"
                            strokeWidth="1.2"
                            onClick={() => handleToggleCara('center')}
                          >
                            <title>Cara Central (Oclusal / Incisal)</title>
                          </rect>
                        </svg>
                      </div>
                    </div>

                    {/* BOTONES RÁPIDOS PARA CADA CARA */}
                    <div className="d-flex flex-wrap justify-content-between gap-1">
                      {[
                        { key: 'top', label: 'Superior' },
                        { key: 'bottom', label: 'Inferior' },
                        { key: 'left', label: 'Izquierda' },
                        { key: 'right', label: 'Derecha' },
                        { key: 'center', label: 'Centro' }
                      ].map(cara => (
                        <button
                          key={cara.key}
                          type="button"
                          className="btn btn-sm btn-light border flex-grow-1"
                          style={{
                            borderLeft: `4px solid ${getSurfaceHex(superficiesState[cara.key]) !== '#ffffff' ? getSurfaceHex(superficiesState[cara.key]) : '#ced4da'}`
                          }}
                          onClick={() => handleToggleCara(cara.key)}
                        >
                          {cara.label}
                        </button>
                      ))}
                    </div>

                  </div>

                  {/* COLUMNA DERECHA: SELECCIÓN DE SIMBOLOGÍA Y ESTADO */}
                  <div className="col-12 col-md-6">
                    
                    <h6 className="font-weight-bold text-primary mb-2">
                      2. Simbología / Forma Odontológica
                    </h6>

                    {/* Color del procedimiento de la simbología */}
                    {toothSimbologia !== 'ninguno' && toothSimbologia !== 'ausente' && (
                      <div className="p-2 mb-2 bg-light rounded border">
                        <small className="text-muted d-block mb-1 font-weight-bold">
                          Estado de la Simbología:
                        </small>
                        <div className="btn-group btn-group-sm w-100">
                          <button
                            type="button"
                            className={`btn ${toothSimbologiaColor === 'rojo' ? 'btn-danger font-weight-bold' : 'btn-outline-danger'}`}
                            onClick={() => setToothSimbologiaColor('rojo')}
                          >
                            🔴 A Realizar
                          </button>
                          <button
                            type="button"
                            className={`btn ${toothSimbologiaColor === 'azul' ? 'btn-primary font-weight-bold' : 'btn-outline-primary'}`}
                            onClick={() => setToothSimbologiaColor('azul')}
                          >
                            🔵 Realizado
                          </button>
                          <button
                            type="button"
                            className={`btn ${toothSimbologiaColor === 'violeta' ? 'btn-purple text-white font-weight-bold' : 'btn-outline-purple'}`}
                            style={{
                              backgroundColor: toothSimbologiaColor === 'violeta' ? COLORES.violeta.hex : 'transparent',
                              borderColor: COLORES.violeta.hex,
                              color: toothSimbologiaColor === 'violeta' ? '#fff' : COLORES.violeta.hex
                            }}
                            onClick={() => setToothSimbologiaColor('violeta')}
                          >
                            🟣 A Rehacer
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Listado de Simbologías con botones */}
                    <div className="row g-2 mb-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {SIMBOLOGIAS.map(s => (
                        <div key={s.id} className="col-6">
                          <button
                            type="button"
                            className={`btn btn-sm w-100 text-start d-flex align-items-center justify-content-between p-2 ${toothSimbologia === s.id ? 'btn-primary font-weight-bold shadow-sm' : 'btn-light border'}`}
                            onClick={() => setToothSimbologia(s.id)}
                          >
                            <span style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>{s.label}</span>
                            {toothSimbologia === s.id && <i className="bi bi-check-circle-fill"></i>}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Observaciones */}
                    <label className="form-label font-weight-bold small mb-1">Observaciones / Notas de la pieza:</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Ej. Reemplazo de amalgama por composite, etc."
                      value={toothNotas}
                      onChange={(e) => setToothNotas(e.target.value)}
                    />

                  </div>

                </div>
              </div>

              <div className="modal-footer py-2 bg-light d-flex justify-content-between">
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleLimpiarDiente}>
                  <i className="bi bi-trash me-1"></i> Resetear Pieza
                </button>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedTooth(null)}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-primary btn-sm px-4 font-weight-bold" onClick={handleApplyToothState}>
                    <i className="bi bi-check-lg me-1"></i> Aplicar al Odontograma
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Odontograma;
