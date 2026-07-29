const express = require('express');
const router = express.Router();
const { ObraSocial } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');

// Proteger todas las rutas de obras sociales
router.use(authMiddleware);

// GET /api/obras-sociales
// Obtener todas las obras sociales del profesional autenticado
router.get('/', async (req, res) => {
  try {
    const obras = await ObraSocial.findAll({
      where: { profesionalId: req.user.id },
      order: [['nombre', 'ASC']]
    });
    res.json(obras);
  } catch (error) {
    console.error('Error al obtener obras sociales:', error);
    res.status(500).json({ mensaje: 'Error al obtener el listado de obras sociales.' });
  }
});

// POST /api/obras-sociales
// Agregar una nueva obra social para el profesional
router.post('/', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ mensaje: 'El nombre de la obra social es obligatorio.' });
    }

    // Evitar duplicados para el mismo profesional
    const existe = await ObraSocial.findOne({
      where: {
        nombre: nombre.trim(),
        profesionalId: req.user.id
      }
    });

    if (existe) {
      return res.status(400).json({ mensaje: 'Esta obra social ya está en tu listado.' });
    }

    const nuevaObra = await ObraSocial.create({
      nombre: nombre.trim(),
      profesionalId: req.user.id
    });

    res.status(201).json(nuevaObra);
  } catch (error) {
    console.error('Error al crear obra social:', error);
    res.status(500).json({ mensaje: 'Error al registrar la obra social.' });
  }
});

module.exports = router;
