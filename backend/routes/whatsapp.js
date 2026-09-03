const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsapp.service');
const { Profesional } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Obtener estado actual de WhatsApp
router.get('/status', (req, res) => {
  res.json(whatsappService.getStatus());
});

// Desconectar / Cerrar sesión
router.post('/logout', async (req, res) => {
  try {
    await whatsappService.logout();
    res.json({ mensaje: 'Sesión de WhatsApp cerrada exitosamente.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cerrar sesión de WhatsApp.' });
  }
});

// Reiniciar cliente
router.post('/restart', async (req, res) => {
  try {
    await whatsappService.restart();
    res.json({ mensaje: 'Servicio de WhatsApp reiniciado.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al reiniciar WhatsApp.' });
  }
});

// Obtener o actualizar la configuración de recordatorios del profesional
router.get('/config', async (req, res) => {
  try {
    const profesional = await Profesional.findByPk(req.user.id);
    if (!profesional) return res.status(404).json({ mensaje: 'Profesional no encontrado' });
    
    res.json(profesional.configuracionWhatsApp);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error obteniendo configuración.' });
  }
});

router.put('/config', async (req, res) => {
  try {
    const profesional = await Profesional.findByPk(req.user.id);
    if (!profesional) return res.status(404).json({ mensaje: 'Profesional no encontrado' });
    
    const nuevaConfig = req.body;
    profesional.configuracionWhatsApp = nuevaConfig;
    await profesional.save();

    res.json({ mensaje: 'Configuración actualizada', config: profesional.configuracionWhatsApp });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error guardando configuración.' });
  }
});

module.exports = router;
