const express = require('express');
const router = express.Router();
const { Profesional } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');

// Proteger todas las rutas
router.use(authMiddleware);

// GET /api/configuracion/horario
// Obtener el horario laboral del profesional autenticado
router.get('/horario', async (req, res) => {
  try {
    const profesional = await Profesional.findByPk(req.user.id);
    if (!profesional) {
      return res.status(404).json({ mensaje: 'Profesional no encontrado.' });
    }

    const horarioDefault = {
      lunes:     { activo: true, inicio: '08:00', fin: '20:00' },
      martes:    { activo: true, inicio: '08:00', fin: '20:00' },
      miercoles: { activo: true, inicio: '08:00', fin: '20:00' },
      jueves:    { activo: true, inicio: '08:00', fin: '20:00' },
      viernes:   { activo: true, inicio: '08:00', fin: '20:00' },
      sabado:    { activo: false, inicio: '09:00', fin: '13:00' },
      domingo:   { activo: false, inicio: '09:00', fin: '13:00' }
    };

    res.json(profesional.horarioLaboral || horarioDefault);
  } catch (error) {
    console.error('Error al obtener horario laboral:', error);
    res.status(500).json({ mensaje: 'Error al obtener la configuración de horario.' });
  }
});

// PUT /api/configuracion/horario
// Actualizar el horario laboral del profesional
router.put('/horario', async (req, res) => {
  try {
    const profesional = await Profesional.findByPk(req.user.id);
    if (!profesional) {
      return res.status(404).json({ mensaje: 'Profesional no encontrado.' });
    }

    const horario = req.body;

    // Validar estructura básica
    const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    for (const dia of diasValidos) {
      if (horario[dia]) {
        if (typeof horario[dia].activo !== 'boolean') {
          return res.status(400).json({ mensaje: `El campo "activo" del día ${dia} debe ser true o false.` });
        }
        if (horario[dia].activo) {
          if (!horario[dia].inicio || !horario[dia].fin) {
            return res.status(400).json({ mensaje: `Debe especificar hora de inicio y fin para ${dia}.` });
          }
        }
      }
    }

    profesional.horarioLaboral = horario;
    await profesional.save();

    res.json({ mensaje: 'Horario laboral actualizado correctamente.', horario: profesional.horarioLaboral });
  } catch (error) {
    console.error('Error al actualizar horario laboral:', error);
    res.status(500).json({ mensaje: 'Error al guardar la configuración de horario.' });
  }
});

// --- Configuración de Respaldo ---

router.get('/respaldo', async (req, res) => {
  try {
    const profesional = await Profesional.findByPk(req.user.id);
    if (!profesional) return res.status(404).json({ mensaje: 'Profesional no encontrado' });
    
    res.json(profesional.configuracionRespaldo || { activo: true, horaEnvio: '02:00' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error obteniendo configuración de respaldo.' });
  }
});

router.put('/respaldo', async (req, res) => {
  try {
    const profesional = await Profesional.findByPk(req.user.id);
    if (!profesional) return res.status(404).json({ mensaje: 'Profesional no encontrado' });
    
    profesional.configuracionRespaldo = req.body;
    await profesional.save();

    res.json({ mensaje: 'Configuración actualizada', config: profesional.configuracionRespaldo });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error guardando configuración de respaldo.' });
  }
});

module.exports = router;
