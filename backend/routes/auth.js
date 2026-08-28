const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const { Profesional } = require('../models');
const { subirRespaldoDrive } = require('../config/googleServices');
const authMiddleware = require('../middlewares/authMiddleware');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'desarrollo_secreto_jwt_987654321';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, especialidad, username, password } = req.body;

    if (!nombre || !username || !password) {
      return res.status(400).json({ mensaje: 'El nombre, email (usuario) y contraseña son obligatorios.' });
    }

    const existeProfesional = await Profesional.findOne({ where: { username } });
    if (existeProfesional) {
      return res.status(400).json({ mensaje: 'Este correo electrónico ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoProfesional = await Profesional.create({
      nombre,
      especialidad: especialidad || null,
      username,
      passwordHash,
      role: 'profesional'
    });

    const token = jwt.sign(
      { id: nuevoProfesional.id, username: nuevoProfesional.username },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      token,
      user: {
        id: nuevoProfesional.id,
        username: nuevoProfesional.username,
        nombre: nuevoProfesional.nombre,
        especialidad: nuevoProfesional.especialidad,
        role: nuevoProfesional.role,
        googleLinked: false
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ mensaje: 'Ocurrió un error inesperado al procesar el registro.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ mensaje: 'El correo electrónico y la contraseña son requeridos.' });
    }

    const profesional = await Profesional.findOne({ where: { username } });
    if (!profesional) {
      return res.status(401).json({ mensaje: 'El usuario o la contraseña no son correctos.' });
    }

    if (!profesional.passwordHash) {
      return res.status(401).json({ mensaje: 'Esta cuenta se registró utilizando Google. Por favor inicia sesión con Google.' });
    }

    const esPasswordValido = await bcrypt.compare(password, profesional.passwordHash);
    if (!esPasswordValido) {
      return res.status(401).json({ mensaje: 'El usuario o la contraseña no son correctos.' });
    }

    const token = jwt.sign(
      { id: profesional.id, username: profesional.username },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      token,
      user: {
        id: profesional.id,
        username: profesional.username,
        nombre: profesional.nombre,
        especialidad: profesional.especialidad,
        role: profesional.role,
        googleLinked: !!profesional.googleRefreshToken
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Ocurrió un error inesperado al iniciar sesión.' });
  }
});

// POST /api/auth/google
// Iniciar sesión / Registrarse con Google OAuth 2.0 (por idToken credential o auth code)
router.post('/google', async (req, res) => {
  try {
    const { credential, code } = req.body;

    let email = null;
    let name = null;
    let sub = null;
    let refreshToken = null;

    if (code && GOOGLE_CLIENT_SECRET) {
      const oauth2Client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        'postmessage'
      );
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userinfo = await oauth2.userinfo.get();
      email = userinfo.data.email;
      name = userinfo.data.name;
      sub = userinfo.data.id;
      refreshToken = tokens.refresh_token;
    } else if (credential) {
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      sub = payload.sub;
    } else {
      return res.status(400).json({ mensaje: 'Faltan credenciales válidas de Google.' });
    }

    if (!email) {
      return res.status(400).json({ mensaje: 'No se pudo obtener el correo de la cuenta de Google.' });
    }

    let profesional = await Profesional.findOne({
      where: { username: email }
    });

    if (profesional) {
      profesional.googleId = sub || profesional.googleId;
      if (refreshToken) {
        profesional.googleRefreshToken = refreshToken;
      }
      await profesional.save();
    } else {
      profesional = await Profesional.create({
        nombre: name || email.split('@')[0],
        username: email,
        googleId: sub,
        googleRefreshToken: refreshToken || null,
        passwordHash: null,
        role: 'profesional'
      });
    }

    const token = jwt.sign(
      { id: profesional.id, username: profesional.username },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      token,
      user: {
        id: profesional.id,
        username: profesional.username,
        nombre: profesional.nombre,
        especialidad: profesional.especialidad,
        role: profesional.role,
        googleLinked: !!profesional.googleRefreshToken
      }
    });
  } catch (error) {
    console.error('Error en autenticación con Google:', error);
    res.status(500).json({ mensaje: 'Error al procesar la autenticación con Google.' });
  }
});

// POST /api/auth/google/link
// Vincular permisos de Google Calendar y Drive para el usuario actualmente autenticado
router.post('/google/link', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ mensaje: 'Se requiere el código de autorización de Google.' });
    }

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      'postmessage'
    );

    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      console.warn('Google no devolvió un refresh_token en el vínculo.');
    }

    const profesional = await Profesional.findByPk(req.user.id);
    if (!profesional) {
      return res.status(404).json({ mensaje: 'Profesional no encontrado.' });
    }

    if (tokens.refresh_token) {
      profesional.googleRefreshToken = tokens.refresh_token;
      await profesional.save();
    }

    res.json({
      mensaje: '¡Cuenta de Google vinculada con éxito para Calendar y Drive!',
      googleLinked: !!profesional.googleRefreshToken
    });
  } catch (error) {
    console.error('Error al vincular cuenta de Google:', error);
    res.status(500).json({ mensaje: 'Error al vincular permisos de Google Calendar/Drive.' });
  }
});

// POST /api/auth/google/sync-drive
// Fuerza la subida inmediata de un respaldo JSON al Google Drive del profesional
router.post('/google/sync-drive', authMiddleware, async (req, res) => {
  try {
    const resultado = await subirRespaldoDrive(req.user.id);
    if (!resultado.success) {
      return res.status(400).json({ mensaje: resultado.mensaje || resultado.error || 'No se pudo sincronizar con Google Drive.' });
    }
    res.json({
      mensaje: 'Respaldo sincronizado con éxito en tu Google Drive.',
      fileId: resultado.fileId,
      fileName: resultado.fileName,
      webViewLink: resultado.webViewLink,
      modifiedTime: resultado.modifiedTime
    });
  } catch (error) {
    console.error('Error al forzar sincronización con Google Drive:', error);
    res.status(500).json({ mensaje: 'Error al sincronizar el respaldo con Google Drive.' });
  }
});
// POST /api/auth/forgot-password
// Solicita un enlace para recuperar la contraseña
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ mensaje: 'El correo electrónico es requerido.' });
    }

    const profesional = await Profesional.findOne({ where: { username: email.toLowerCase() } });
    
    if (!profesional) {
      return res.status(404).json({ mensaje: 'Su correo electrónico no está registrado en nuestra base de datos.' });
    }

    // Generar token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expira en 1 hora
    const resetExpires = new Date(Date.now() + 3600000); 

    await profesional.update({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: resetExpires
    });

    // SIMULACIÓN DE ENVÍO DE CORREO
    // En un entorno real, aquí se usaría Nodemailer, SendGrid, Resend, etc.
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    console.log('\n======================================================');
    console.log('SIMULACIÓN DE CORREO ELECTRÓNICO (RECUPERAR CONTRASEÑA)');
    console.log('Para:', profesional.username);
    console.log('Enlace de recuperación (Copia y pega en tu navegador):');
    console.log(resetUrl);
    console.log('======================================================\n');

    res.json({ mensaje: `Se envió un correo a ${email}, revise su bandeja para gestionar la recuperación.` });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ mensaje: 'Error al procesar la solicitud de recuperación.' });
  }
});

// POST /api/auth/reset-password
// Restablece la contraseña utilizando un token válido
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ mensaje: 'El token y la nueva contraseña son requeridos.' });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const profesional = await Profesional.findOne({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: {
          [Op.gt]: new Date() // El token no debe haber expirado
        }
      }
    });

    if (!profesional) {
      return res.status(400).json({ mensaje: 'El token de recuperación es inválido o ha expirado.' });
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña y limpiar campos de token
    await profesional.update({
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.json({ mensaje: 'Tu contraseña ha sido restablecida con éxito.' });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ mensaje: 'Error al restablecer la contraseña.' });
  }
});

module.exports = router;
