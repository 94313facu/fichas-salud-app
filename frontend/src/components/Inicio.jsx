import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import authService from './services/auth.service';
import pacientesService from './services/pacientes.service';

const Inicio = () => {
  const user = authService.getCurrentUser();
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState(null);
  const [exitoExportar, setExitoExportar] = useState(null);

  // Estados para Importación
  const [importando, setImportando] = useState(false);
  const [errorImportar, setErrorImportar] = useState(null);
  const [exitoImportar, setExitoImportar] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Estados para Google Drive Sync
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [necesitaVincular, setNecesitaVincular] = useState(false);

  // Hook para solicitar permisos de Google Drive / Calendar (auth-code)
  const vincularGoogleAuthCode = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setSyncingDrive(true);
        setErrorExportar(null);
        setExitoExportar(null);
        setNecesitaVincular(false);

        // 1. Vincular tokens con el backend
        await authService.linkGoogle(codeResponse.code);
        
        // 2. Ejecutar la sincronización a Drive inmediatamente
        const resultado = await authService.syncDriveNow();
        setExitoExportar(`¡Excelente! Cuenta de Google vinculada y respaldo guardado en tu Google Drive.`);
        setTimeout(() => setExitoExportar(null), 7000);
      } catch (err) {
        setErrorExportar(err.mensaje || 'Error al vincular permisos con Google.');
      } finally {
        setSyncingDrive(false);
      }
    },
    onError: () => {
      setErrorExportar('No se concedieron permisos de acceso a Google Drive/Calendar.');
      setSyncingDrive(false);
    },
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.file'
  });

  // Exportar respaldo JSON local
  const handleExportarBackup = async () => {
    try {
      setExportando(true);
      setErrorExportar(null);
      setExitoExportar(null);

      const blob = await pacientesService.exportarDatos();
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `respaldo_pacientes_${user?.nombre.replace(/\s+/g, '_')}_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExitoExportar('Copia de seguridad descargada correctamente.');
      setTimeout(() => setExitoExportar(null), 4000);
    } catch (err) {
      console.error('Error al exportar respaldo:', err);
      setErrorExportar(err.mensaje || 'Ocurrió un error al descargar la copia de seguridad.');
    } finally {
      setExportando(false);
    }
  };

  // Sincronizar respaldo a Google Drive manualmente
  const handleSyncDriveNow = async () => {
    try {
      setSyncingDrive(true);
      setErrorExportar(null);
      setExitoExportar(null);
      setNecesitaVincular(false);

      const resultado = await authService.syncDriveNow();
      setExitoExportar(`¡Sincronizado! Tu respaldo fue guardado en Google Drive en la carpeta "FichasDeSalud_Respaldos".`);
      setTimeout(() => setExitoExportar(null), 6000);
    } catch (err) {
      // Si la cuenta aún no otorgó permisos offline a Drive/Calendar, lanzar la ventana de permisos
      setNecesitaVincular(true);
      setErrorExportar('Para guardar respaldos automáticos en tu Google Drive, haz clic en el botón de abajo para conceder permisos.');
    } finally {
      setSyncingDrive(false);
    }
  };

  // Seleccionar archivo JSON para importar
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        setErrorImportar('Por favor selecciona un archivo en formato .json válido.');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setErrorImportar(null);
      setShowConfirmModal(true);
    }
  };

  // Confirmar y procesar la restauración
  const handleConfirmarImportacion = async () => {
    if (!selectedFile) return;

    try {
      setImportando(true);
      setErrorImportar(null);
      setExitoImportar(null);
      setShowConfirmModal(false);

      const resultado = await pacientesService.importarDatos(selectedFile);

      setExitoImportar(
        `¡Restauración exitosa! Se restauraron ${resultado.cantPacientes} pacientes, ${resultado.cantTratamientos} planes de tratamiento y ${resultado.cantSesiones} evoluciones.`
      );

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => setExitoImportar(null), 7000);
    } catch (err) {
      console.error('Error al restaurar respaldo:', err);
      setErrorImportar(err.mensaje || 'Ocurrió un error al procesar el archivo de copia de seguridad.');
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Saludo personalizado */}
      <div className="row mb-5">
        <div className="col-12 text-center text-md-start">
          <h1 className="display-5 mb-1" style={{ fontWeight: 700 }}>
            ¡Bienvenido, {user?.nombre || 'Profesional'}!
          </h1>
          {user?.especialidad && (
            <p className="lead text-muted-custom">
              <i className="bi bi-patch-check-fill text-accent me-2"></i>
              Especialidad: {user.especialidad}
            </p>
          )}
        </div>
      </div>

      {/* Tarjetas de Acceso Rápido */}
      <div className="row g-4 justify-content-center justify-content-md-start">
        {/* Acceso a Pacientes */}
        <div className="col-12 col-md-6 col-lg-5">
          <div className="card h-100 p-4 d-flex flex-column justify-content-between border-0 shadow-sm" style={{ borderLeft: '6px solid var(--primary-color)' }}>
            <div>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-light p-3 rounded-circle text-primary me-3">
                  <i className="bi bi-people-fill fs-3 text-primary"></i>
                </div>
                <h3 className="mb-0 fs-4" style={{ color: 'var(--primary-color)' }}>Fichas de Pacientes</h3>
              </div>
              <p className="text-muted-custom mb-4">
                Accede al listado de tus pacientes, crea nuevas fichas de consulta, registra evoluciones y adjunta fotos o videos de progreso.
              </p>
            </div>
            <Link to="/pacientes" className="btn btn-primary w-100 py-3 mt-auto">
              Ver fichas de pacientes
            </Link>
          </div>
        </div>

        {/* Acceso a Turnos */}
        <div className="col-12 col-md-6 col-lg-5">
          <div className="card h-100 p-4 d-flex flex-column justify-content-between border-0 shadow-sm" style={{ borderLeft: '6px solid var(--accent-color)' }}>
            <div>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-light p-3 rounded-circle text-accent me-3">
                  <i className="bi bi-calendar3 fs-3 text-accent"></i>
                </div>
                <h3 className="mb-0 fs-4 text-dark d-flex align-items-center gap-2">
                  <span>Turnos y Agenda</span>
                  <span className="badge bg-success font-weight-bold" style={{ fontSize: '0.75rem' }}>Google Calendar</span>
                </h3>
              </div>
              <p className="text-muted-custom mb-4">
                Administra tus citas diarias, agenda nuevas consultas y sincroniza automáticamente tus turnos con tu cuenta de Google Calendar.
              </p>
            </div>
            <Link to="/turnos" className="btn btn-accent text-white w-100 py-3 mt-auto">
              Gestionar turnos y agenda
            </Link>
          </div>
        </div>
      </div>

      {/* Sección de Copia de Seguridad y Respaldos */}
      <div className="row mt-5 justify-content-center justify-content-md-start">
        <div className="col-12 col-lg-10">
          <div className="card p-4 border-0 shadow-sm" style={{ borderLeft: '6px solid var(--accent-color)' }}>
            <div className="mb-3">
              <h3 className="fs-5 mb-1 text-dark d-flex align-items-center">
                <i className="bi bi-database-fill-gear text-accent me-2"></i>
                Gestión de Respaldos (JSON y Google Drive)
              </h3>
              <p className="text-muted-custom mb-0">
                Descarga un respaldo local, restaura tus datos o sincroniza tus fichas con tu cuenta personal de Google Drive.
              </p>
            </div>

            {/* Aviso de Respaldo Diario Automático */}
            <div className="bg-light p-2 rounded border mb-3 text-muted-custom d-flex align-items-center" style={{ fontSize: '0.88rem' }}>
              <i className="bi bi-shield-check text-success me-2 fs-5"></i>
              <span>
                <strong>Respaldo Diario Automático</strong>: Se ejecuta automáticamente todas las noches (02:00 AM) guardando tu copia actualizada en tu Google Drive.
              </span>
            </div>

            <div className="d-flex flex-column flex-md-row gap-2 pt-1">
              {/* Botón Descargar Respaldo */}
              <button
                onClick={handleExportarBackup}
                className="btn btn-accent text-white px-3 d-flex align-items-center justify-content-center flex-fill"
                disabled={exportando || importando || syncingDrive}
                style={{ minHeight: '44px' }}
              >
                {exportando ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Generando...</>
                ) : (
                  <><i className="bi bi-download me-2"></i> Descargar JSON</>
                )}
              </button>

              {/* Botón Sincronizar Google Drive Ahora */}
              <button
                onClick={handleSyncDriveNow}
                className="btn btn-outline-success px-3 d-flex align-items-center justify-content-center flex-fill"
                disabled={exportando || importando || syncingDrive}
                style={{ minHeight: '44px' }}
              >
                {syncingDrive ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Sincronizando...</>
                ) : (
                  <><i className="bi bi-google me-2"></i> Guardar en Drive ahora</>
                )}
              </button>

              {/* Botón Restaurar Respaldo */}
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="btn btn-outline-primary px-3 d-flex align-items-center justify-content-center flex-fill"
                disabled={exportando || importando || syncingDrive}
                style={{ minHeight: '44px' }}
              >
                {importando ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Restaurando...</>
                ) : (
                  <><i className="bi bi-upload me-2"></i> Restaurar JSON</>
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json,application/json"
                onChange={handleFileSelect}
              />
            </div>

            {/* Alerta si requiere vincular Google */}
            {necesitaVincular && (
              <div className="mt-3 text-center p-3 bg-light border rounded">
                <p className="text-dark font-weight-bold mb-2">
                  <i className="bi bi-google me-2 text-success"></i> Autorizar acceso a Google Drive y Calendar
                </p>
                <p className="text-muted-custom mb-3" style={{ fontSize: '0.9rem' }}>
                  Para poder guardar automáticamente tus respaldos en tu Google Drive, autoriza a la app haciendo clic en el siguiente botón:
                </p>
                <button
                  className="btn btn-success px-4 font-weight-bold"
                  onClick={() => vincularGoogleAuthCode()}
                >
                  <i className="bi bi-shield-lock-fill me-2"></i> Otorgar permisos de Google Drive
                </button>
              </div>
            )}

            {/* Alertas */}
            {errorExportar && !necesitaVincular && (
              <div className="alert alert-danger d-flex align-items-center mt-3 mb-0" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>{errorExportar}</div>
              </div>
            )}

            {exitoExportar && (
              <div className="alert alert-success d-flex align-items-center mt-3 mb-0" role="alert">
                <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                <div>{exitoExportar}</div>
              </div>
            )}

            {errorImportar && (
              <div className="alert alert-danger d-flex align-items-center mt-3 mb-0" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>{errorImportar}</div>
              </div>
            )}

            {exitoImportar && (
              <div className="alert alert-success d-flex align-items-center mt-3 mb-0" role="alert">
                <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                <div>{exitoImportar}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE RESTAURACIÓN */}
      {showConfirmModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 rounded-3 shadow-lg">
              <div className="modal-header bg-danger text-white py-3">
                <h5 className="modal-title font-weight-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> Confirmar Restauración de Datos
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirmModal(false)} aria-label="Cerrar"></button>
              </div>

              <div className="modal-body p-4 bg-light">
                <p className="text-dark font-weight-bold mb-2">
                  ¿Estás seguro de que deseas restaurar la copia de seguridad?
                </p>
                <p className="text-muted-custom mb-3" style={{ fontSize: '0.95rem' }}>
                  Esta acción actualizará tus registros actuales e importará los pacientes, planes de tratamiento y evoluciones contenidos en el archivo:
                </p>
                <div className="p-2 bg-white rounded border font-weight-bold text-primary text-truncate">
                  <i className="bi bi-file-earmark-code me-2"></i>
                  {selectedFile?.name}
                </div>
              </div>

              <div className="modal-footer bg-light border-top">
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  style={{ height: '44px' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={handleConfirmarImportacion}
                  style={{ height: '44px' }}
                >
                  Sí, Restaurar Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inicio;
