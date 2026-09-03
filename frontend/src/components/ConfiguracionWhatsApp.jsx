import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import whatsappService from './services/whatsapp.service';

const ConfiguracionWhatsApp = () => {
  const [statusInfo, setStatusInfo] = useState({ status: 'LOADING', qr: null });
  const [config, setConfig] = useState({ activo: false, horaEnvio: '18:00', mensajePlantilla: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar estado inicial y configuración
  useEffect(() => {
    cargarDatos();
    
    // Polling del estado de whatsapp si está esperando QR o inicializando
    const interval = setInterval(async () => {
      if (statusInfo.status === 'INITIALIZING' || statusInfo.status === 'QR_READY') {
        const res = await whatsappService.getStatus();
        setStatusInfo(res);
      }
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [statusInfo.status]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const statusRes = await whatsappService.getStatus();
      setStatusInfo(statusRes);

      const configRes = await whatsappService.getConfig();
      if (configRes) {
        setConfig(configRes);
      }
    } catch (error) {
      setErrorMsg('Error al cargar la configuración de WhatsApp.');
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarConfig = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      setErrorMsg('');
      await whatsappService.updateConfig(config);
      setMensajeExito('Configuración guardada correctamente.');
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      setErrorMsg('Error al guardar configuración.');
    } finally {
      setGuardando(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('¿Seguro que deseas cerrar sesión de WhatsApp?')) return;
    try {
      await whatsappService.logout();
      const res = await whatsappService.getStatus();
      setStatusInfo(res);
    } catch (error) {
      setErrorMsg('Error al cerrar sesión.');
    }
  };

  const handleRestart = async () => {
    try {
      await whatsappService.restart();
      setStatusInfo({ status: 'INITIALIZING', qr: null });
    } catch (error) {
      setErrorMsg('Error al reiniciar.');
    }
  };

  if (cargando && statusInfo.status === 'LOADING') {
    return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">
        <i className="bi bi-whatsapp text-success me-2"></i> 
        Configuración de Recordatorios por WhatsApp
      </h2>

      {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      <div className="row g-4">
        {/* Columna de Conexión */}
        <div className="col-12 col-md-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="card-title font-weight-bold">Estado de Conexión</h5>
            </div>
            <div className="card-body text-center d-flex flex-column align-items-center justify-content-center">
              
              {statusInfo.status === 'INITIALIZING' && (
                <div>
                  <div className="spinner-border text-primary mb-3"></div>
                  <p>Iniciando servicio de WhatsApp...</p>
                </div>
              )}

              {statusInfo.status === 'DISCONNECTED' && (
                <div>
                  <i className="bi bi-phone-vibrate text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-3">WhatsApp desconectado.</p>
                  <button className="btn btn-primary mt-2" onClick={handleRestart}>
                    <i className="bi bi-power me-1"></i> Conectar
                  </button>
                </div>
              )}

              {statusInfo.status === 'QR_READY' && statusInfo.qr && (
                <div>
                  <p className="text-muted small mb-3">Escanea este código con tu celular para vincular WhatsApp Web.</p>
                  <div className="bg-white p-2 d-inline-block rounded shadow-sm">
                    <QRCode value={statusInfo.qr} size={200} />
                  </div>
                  <p className="mt-3 mb-0 text-primary">Esperando conexión...</p>
                </div>
              )}

              {statusInfo.status === 'CONNECTED' && (
                <div>
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                  <h4 className="mt-3 text-success">¡Conectado!</h4>
                  <p className="text-muted">Los mensajes automáticos saldrán desde este número.</p>
                  <button className="btn btn-outline-danger mt-3" onClick={handleLogout}>
                    Desvincular WhatsApp
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Columna de Ajustes */}
        <div className="col-12 col-md-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="card-title font-weight-bold">Ajustes Automáticos</h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info small">
                <i className="bi bi-info-circle me-1"></i>
                Para que los recordatorios automáticos se envíen, el sistema (servidor) debe estar encendido a la hora configurada. Si lo prefieres, también puedes enviarlos manualmente desde la agenda.
              </div>

              <form onSubmit={handleGuardarConfig}>
                <div className="form-check form-switch mb-4">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="switchActivo" 
                    checked={config.activo}
                    onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                  />
                  <label className="form-check-label fw-bold" htmlFor="switchActivo">
                    Activar recordatorios automáticos
                  </label>
                </div>

                <div className="mb-3">
                  <label className="form-label font-weight-bold">Hora de envío (para turnos de mañana)</label>
                  <input 
                    type="time" 
                    className="form-control w-50"
                    value={config.horaEnvio}
                    onChange={(e) => setConfig({ ...config, horaEnvio: e.target.value })}
                    disabled={!config.activo}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label font-weight-bold">Plantilla del mensaje</label>
                  <textarea 
                    className="form-control" 
                    rows="4"
                    value={config.mensajePlantilla}
                    onChange={(e) => setConfig({ ...config, mensajePlantilla: e.target.value })}
                  ></textarea>
                  <div className="form-text mt-2">
                    <strong>Variables disponibles:</strong><br />
                    <code>{'{nombrePaciente}'}</code>: Se reemplazará por el nombre del paciente.<br />
                    <code>{'{fechaHora}'}</code>: Se reemplazará por el día y hora del turno.
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionWhatsApp;
