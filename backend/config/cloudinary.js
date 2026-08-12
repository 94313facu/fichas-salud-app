const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { subirArchivoMediaDrive } = require('./googleServices');
require('dotenv').config();

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('Cloudinary: Falta configuración. La subida de archivos usará almacenamiento en Google Drive o local en backend/uploads/');
}

/**
 * Sube un archivo (prioriza Google Drive del profesional, luego Cloudinary, luego almacenamiento local)
 * @param {Object} file - Objeto de archivo de Multer (buffer, originalname, mimetype)
 * @param {number} pacienteId - ID del paciente
 * @param {number} profesionalId - ID del profesional para verificar si tiene Google vinculado
 * @returns {Promise<{url: string, tipo: string}>}
 */
const uploadFile = async (file, pacienteId, profesionalId = null) => {
  const isVideo = file.mimetype.startsWith('video/');
  const tipo = isVideo ? 'video' : 'imagen';

  // 1. Intentar subida a Google Drive si el profesional tiene cuenta vinculada
  if (profesionalId) {
    try {
      const driveResult = await subirArchivoMediaDrive(profesionalId, pacienteId, file);
      if (driveResult && driveResult.url) {
        console.log(`✓ Archivo subido exitosamente a Google Drive del profesional (Paciente ${pacienteId}).`);
        return {
          url: driveResult.url,
          tipo: driveResult.tipo
        };
      }
    } catch (driveErr) {
      console.warn('Google Drive Media Upload omitido o falló:', driveErr.message);
    }
  }

  // 2. Si no tiene Google vinculado o falla, intentar Cloudinary
  if (isConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `pacientes/${pacienteId}`,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            tipo
          });
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // 3. Fallback: Almacenamiento Local en Servidor
  const uploadDir = path.join(__dirname, '..', 'uploads', `paciente_${pacienteId}`);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const fileExt = path.extname(file.originalname) || (isVideo ? '.mp4' : '.jpg');
  const fileName = `${Date.now()}${fileExt}`;
  const filePath = path.join(uploadDir, fileName);
  
  fs.writeFileSync(filePath, file.buffer);
  
  const localUrl = `/uploads/paciente_${pacienteId}/${fileName}`;
  return {
    url: localUrl,
    tipo
  };
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadFile
};
