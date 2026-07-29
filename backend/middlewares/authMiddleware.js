const jwt = require('jsonwebtoken');
const { Profesional } = require('../models');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ mensaje: 'No autorizado. No se proporcionó un token de acceso.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ mensaje: 'Formato de token no válido. Debe ser "Bearer <token>".' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'desarrollo_secreto_jwt_987654321');
    
    const profesional = await Profesional.findByPk(decoded.id);
    if (!profesional) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado. Token no válido.' });
    }

    // Adjuntar la información del profesional autenticado
    req.user = {
      id: profesional.id,
      username: profesional.username,
      nombre: profesional.nombre,
      role: profesional.role
    };

    next();
  } catch (error) {
    console.error('Error al validar token:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ mensaje: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' });
    }
    return res.status(401).json({ mensaje: 'Token no válido. Acceso denegado.' });
  }
};

module.exports = authMiddleware;
