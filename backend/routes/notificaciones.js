const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Profesional } = require('../models');
const notificacionesService = require('../services/notificaciones.service');

// GET /api/notificaciones/stream
// Ruta para Server-Sent Events
router.get('/stream', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'desarrollo_secreto_jwt_987654321');
    const profesional = await Profesional.findByPk(decoded.id);
    if (!profesional) return res.status(401).end();

    // Configurar headers para SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Registrar cliente
    notificacionesService.addClient(profesional.id, res);

    // Mantener la conexión abierta con un ping periódico para que no se caiga
    const intervalId = setInterval(() => {
      res.write(':\n\n'); // Comentario SSE (ping)
    }, 15000);

    req.on('close', () => {
      clearInterval(intervalId);
    });

  } catch (err) {
    return res.status(401).end();
  }
});

module.exports = router;
