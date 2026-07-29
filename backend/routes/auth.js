const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Profesional } = require('../models');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'desarrollo_secreto_jwt_987654321';

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, especialidad, username, password } = req.body;

    // Validación básica de campos
    if (!nombre || !username || !password) {
      return res.status(400).json({ mensaje: 'El nombre, email (usuario) y contraseña son obligatorios.' });
    }

    // Verificar si ya existe el profesional
    const existeProfesional = await Profesional.findOne({ where: { username } });
    if (existeProfesional) {
      return res.status(400).json({ mensaje: 'Este correo electrónico ya está registrado.' });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear el profesional
    const nuevoProfesional = await Profesional.create({
      nombre,
      especialidad: especialidad || null,
      username,
      passwordHash,
      role: 'profesional' // Rol por defecto
    });

    // Generar el token JWT
    const token = jwt.sign(
      { id: nuevoProfesional.id, username: nuevoProfesional.username },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Responder con el token y datos del usuario (sin passwordHash)
    res.status(201).json({
      token,
      user: {
        id: nuevoProfesional.id,
        username: nuevoProfesional.username,
        nombre: nuevoProfesional.nombre,
        role: nuevoProfesional.role
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

    // Buscar al profesional
    const profesional = await Profesional.findOne({ where: { username } });
    if (!profesional) {
      return res.status(401).json({ mensaje: 'El usuario o la contraseña no son correctos.' });
    }

    // Validar contraseña
    const esPasswordValido = await bcrypt.compare(password, profesional.passwordHash);
    if (!esPasswordValido) {
      return res.status(401).json({ mensaje: 'El usuario o la contraseña no son correctos.' });
    }

    // Generar token JWT
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
        role: profesional.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Ocurrió un error inesperado al iniciar sesión.' });
  }
});

module.exports = router;
