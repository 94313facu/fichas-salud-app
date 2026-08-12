const { google } = require('googleapis');
const { Readable } = require('stream');
const path = require('path');
const { Profesional, Paciente, Sesion, ObraSocial, Tratamiento } = require('../models');
require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000';

/**
 * Genera cliente OAuth2 de Google para un profesional
 */
async function getOAuth2Client(profesionalId) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  if (profesionalId) {
    const profesional = await Profesional.findByPk(profesionalId);
    if (profesional && profesional.googleRefreshToken) {
      oauth2Client.setCredentials({
        refresh_token: profesional.googleRefreshToken
      });
      return oauth2Client;
    }
  }

  return oauth2Client;
}

/**
 * Google Calendar: Crear Evento para un Turno
 */
async function crearEventoCalendar(profesionalId, turno, pacienteNombre, tratamientoNombre = '') {
  try {
    const auth = await getOAuth2Client(profesionalId);
    if (!auth || !auth.credentials || !auth.credentials.refresh_token) {
      return null;
    }

    const calendar = google.calendar({ version: 'v3', auth });
    const startTime = new Date(turno.fechaHora);
    const endTime = new Date(startTime.getTime() + (turno.duracionMinutos || 30) * 60000);

    const summary = `Turno: ${pacienteNombre}${tratamientoNombre ? ` (${tratamientoNombre})` : ''}`;
    const description = `Consulta de Salud / Ficha Médica\nPaciente: ${pacienteNombre}\nNotas: ${turno.notas || 'Sin notas adicionadas.'}`;

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        description,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'popup', minutes: 120 }
          ]
        }
      }
    });

    return res.data.id;
  } catch (error) {
    console.error('Error al sincronizar evento en Google Calendar:', error.message);
    return null;
  }
}

/**
 * Google Calendar: Actualizar Evento de Turno
 */
async function actualizarEventoCalendar(profesionalId, googleEventId, turno, pacienteNombre, tratamientoNombre = '') {
  if (!googleEventId) return null;
  try {
    const auth = await getOAuth2Client(profesionalId);
    if (!auth || !auth.credentials || !auth.credentials.refresh_token) return null;

    const calendar = google.calendar({ version: 'v3', auth });
    const startTime = new Date(turno.fechaHora);
    const endTime = new Date(startTime.getTime() + (turno.duracionMinutos || 30) * 60000);

    const summary = `Turno: ${pacienteNombre}${tratamientoNombre ? ` (${tratamientoNombre})` : ''}`;
    const description = `Consulta de Salud / Ficha Médica\nPaciente: ${pacienteNombre}\nNotas: ${turno.notas || 'Sin notas.'}\nEstado: ${turno.estado}`;

    await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: {
        summary,
        description,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() }
      }
    });

    return googleEventId;
  } catch (error) {
    console.error('Error al actualizar evento en Google Calendar:', error.message);
    return null;
  }
}

/**
 * Google Calendar: Eliminar/Cancelar Evento
 */
async function eliminarEventoCalendar(profesionalId, googleEventId) {
  if (!googleEventId) return false;
  try {
    const auth = await getOAuth2Client(profesionalId);
    if (!auth || !auth.credentials || !auth.credentials.refresh_token) return false;

    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId
    });
    return true;
  } catch (error) {
    console.error('Error al borrar evento en Google Calendar:', error.message);
    return false;
  }
}

/**
 * Google Drive: Subir/Actualizar el Respaldo JSON en el Drive del Profesional
 */
async function subirRespaldoDrive(profesionalId) {
  try {
    const auth = await getOAuth2Client(profesionalId);
    if (!auth || !auth.credentials || !auth.credentials.refresh_token) {
      return { success: false, mensaje: 'Profesional no ha vinculado su cuenta de Google.' };
    }

    const profesional = await Profesional.findByPk(profesionalId);
    if (!profesional) return { success: false, mensaje: 'Profesional no encontrado.' };

    const pacientes = await Paciente.findAll({
      where: { profesionalId },
      include: [
        { model: Sesion, required: false, include: [{ model: Tratamiento, attributes: ['nombre'], required: false }] },
        { model: Tratamiento, required: false },
        { model: ObraSocial, attributes: ['nombre'], required: false }
      ],
      order: [['nombre', 'ASC']]
    });

    const jsonContent = JSON.stringify(pacientes, null, 2);
    const drive = google.drive({ version: 'v3', auth });

    const folderSearch = await drive.files.list({
      q: "name = 'FichasDeSalud_Respaldos' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id, name)'
    });

    let folderId = null;
    if (folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
    } else {
      const folderCreate = await drive.files.create({
        requestBody: {
          name: 'FichasDeSalud_Respaldos',
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      folderId = folderCreate.data.id;
    }

    const fileName = `respaldo_fichas_salud_${profesional.nombre.replace(/\s+/g, '_')}_diario.json`;

    const fileSearch = await drive.files.list({
      q: `name = '${fileName}' and '${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, webViewLink)'
    });

    const media = {
      mimeType: 'application/json',
      body: jsonContent
    };

    let fileRes = null;
    if (fileSearch.data.files.length > 0) {
      const existingFileId = fileSearch.data.files[0].id;
      fileRes = await drive.files.update({
        fileId: existingFileId,
        media: media,
        fields: 'id, name, webViewLink, modifiedTime'
      });
    } else {
      fileRes = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId]
        },
        media: media,
        fields: 'id, name, webViewLink, modifiedTime'
      });
    }

    return {
      success: true,
      fileId: fileRes.data.id,
      fileName: fileRes.data.name,
      webViewLink: fileRes.data.webViewLink,
      modifiedTime: fileRes.data.modifiedTime
    };

  } catch (error) {
    console.error('Error al subir respaldo a Google Drive:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Google Drive: Subir Archivo Multimedia (Foto, Video, PDF) a la carpeta 'FichasDeSalud_Archivos'
 */
async function subirArchivoMediaDrive(profesionalId, pacienteId, file) {
  try {
    const auth = await getOAuth2Client(profesionalId);
    if (!auth || !auth.credentials || !auth.credentials.refresh_token) {
      return null;
    }

    const drive = google.drive({ version: 'v3', auth });

    // 1. Buscar o crear carpeta 'FichasDeSalud_Archivos'
    const folderSearch = await drive.files.list({
      q: "name = 'FichasDeSalud_Archivos' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id, name)'
    });

    let folderId = null;
    if (folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
    } else {
      const folderCreate = await drive.files.create({
        requestBody: {
          name: 'FichasDeSalud_Archivos',
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      folderId = folderCreate.data.id;
    }

    // 2. Definir nombre y tipo
    const isVideo = file.mimetype.startsWith('video/');
    const tipo = isVideo ? 'video' : 'imagen';
    const fileExt = path.extname(file.originalname) || (isVideo ? '.mp4' : '.jpg');
    const fileName = `paciente_${pacienteId}_${Date.now()}${fileExt}`;

    const media = {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer)
    };

    const fileCreate = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId]
      },
      media: media,
      fields: 'id, name, webViewLink, webContentLink'
    });

    const fileId = fileCreate.data.id;

    // 3. Permiso de lectura pública para la visualización en la app
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
    } catch (permErr) {
      console.warn('Permisos de lectura en Drive:', permErr.message);
    }

    // URL directa de renderizado
    const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

    return {
      url: directUrl,
      fileId: fileId,
      webViewLink: fileCreate.data.webViewLink,
      tipo
    };

  } catch (error) {
    console.error('Error al subir archivo a Google Drive:', error.message);
    return null;
  }
}

module.exports = {
  getOAuth2Client,
  crearEventoCalendar,
  actualizarEventoCalendar,
  eliminarEventoCalendar,
  subirRespaldoDrive,
  subirArchivoMediaDrive
};
