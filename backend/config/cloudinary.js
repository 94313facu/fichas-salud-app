const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
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
  console.warn('Cloudinary: Falta configuración. La subida de archivos usará almacenamiento local en backend/uploads/');
}

/**
 * Sube un archivo a Cloudinary o localmente si Cloudinary no está configurado.
 * @param {Object} file - Objeto de archivo de Multer (con buffer y originalname)
 * @param {number} pacienteId - ID del paciente para organizar los archivos
 * @returns {Promise<{url: string, tipo: string}>}
 */
const uploadFile = (file, pacienteId) => {
  return new Promise((resolve, reject) => {
    const isVideo = file.mimetype.startsWith('video/');
    const tipo = isVideo ? 'video' : 'imagen';

    if (isConfigured) {
      // Subida a Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `pacientes/${pacienteId}`,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            tipo: tipo
          });
        }
      );
      uploadStream.end(file.buffer);
    } else {
      // Fallback: Guardado Local
      try {
        const uploadDir = path.join(__dirname, '..', 'uploads', `paciente_${pacienteId}`);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}${fileExt}`;
        const filePath = path.join(uploadDir, fileName);
        
        fs.writeFileSync(filePath, file.buffer);
        
        // URL relativa que el frontend consumirá desde nuestro servidor Express
        const localUrl = `/uploads/paciente_${pacienteId}/${fileName}`;
        resolve({
          url: localUrl,
          tipo: tipo
        });
      } catch (err) {
        reject(err);
      }
    }
  });
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadFile
};
