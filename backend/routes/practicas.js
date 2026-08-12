const express = require('express');
const router = express.Router();
const { Practica, Paciente, Sesion, ObraSocial } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Helper para normalizar código (elimina puntos, guiones y espacios)
const cleanCode = (str) => (str || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

// GET /api/practicas
router.get('/', async (req, res) => {
  try {
    const practicas = await Practica.findAll({
      where: { profesionalId: req.user.id },
      order: [['codigo', 'ASC']]
    });
    res.json(practicas);
  } catch (error) {
    console.error('Error al obtener prácticas:', error);
    res.status(500).json({ mensaje: 'Error al consultar el catálogo de prácticas.' });
  }
});

// GET /api/practicas/buscar?codigo=XX
// Buscar si un código ya fue registrado anteriormente (normalizando formato)
router.get('/buscar', async (req, res) => {
  try {
    const { codigo } = req.query;
    if (!codigo || !codigo.trim()) {
      return res.status(400).json({ mensaje: 'El código de práctica es requerido.' });
    }

    const searchTarget = cleanCode(codigo);
    const practicas = await Practica.findAll({
      where: { profesionalId: req.user.id }
    });

    const practica = practicas.find(p => cleanCode(p.codigo) === searchTarget);

    if (!practica) {
      return res.json({ existe: false });
    }

    res.json({ existe: true, practica });
  } catch (error) {
    console.error('Error al buscar código de práctica:', error);
    res.status(500).json({ mensaje: 'Error al buscar el código de práctica.' });
  }
});

// POST /api/practicas
// Registrar una nueva práctica o actualizar su regla de frecuencia
router.post('/', async (req, res) => {
  try {
    const { codigo, nombre, alcance, mesesFrecuencia, obraSocialId } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({ mensaje: 'El código y el nombre de la práctica son obligatorios.' });
    }

    const searchTarget = cleanCode(codigo);
    const practicas = await Practica.findAll({
      where: { profesionalId: req.user.id }
    });

    let practica = practicas.find(p => cleanCode(p.codigo) === searchTarget);

    if (practica) {
      await practica.update({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        alcance: alcance || 'paciente',
        mesesFrecuencia: parseInt(mesesFrecuencia) || 0,
        obraSocialId: obraSocialId ? parseInt(obraSocialId) : null
      });
    } else {
      practica = await Practica.create({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        alcance: alcance || 'paciente',
        mesesFrecuencia: parseInt(mesesFrecuencia) || 0,
        obraSocialId: obraSocialId ? parseInt(obraSocialId) : null,
        profesionalId: req.user.id
      });
    }

    res.status(201).json(practica);
  } catch (error) {
    console.error('Error al guardar práctica:', error);
    res.status(500).json({ mensaje: 'Error al guardar la regla de práctica.' });
  }
});

// POST /api/practicas/validar-frecuencia
// Motor de validación de frecuencia por Obra Social
router.post('/validar-frecuencia', async (req, res) => {
  try {
    const { pacienteId, codigoPractica, piezaDental, caraDental, fechaEv, mesesFrecuenciaInput, alcanceInput, nombreInput } = req.body;

    if (!pacienteId || !codigoPractica) {
      return res.status(400).json({ mensaje: 'pacienteId y codigoPractica son requeridos.' });
    }

    // 1. Obtener datos del paciente y su obra social
    const paciente = await Paciente.findOne({
      where: { id: pacienteId, profesionalId: req.user.id },
      include: [{ model: ObraSocial, attributes: ['id', 'nombre'] }]
    });

    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado.' });
    }

    // Si el paciente es particular / sin obra social, NO se aplican restricciones de facturación
    if (!paciente.obraSocialId && !paciente.ObraSocial) {
      return res.json({ valido: true, motivo: 'Paciente Particular / Sin Obra Social' });
    }

    // 2. Buscar si existe regla de frecuencia para este código (normalizado)
    const searchTarget = cleanCode(codigoPractica);
    const practicas = await Practica.findAll({
      where: { profesionalId: req.user.id }
    });

    let practica = practicas.find(p => cleanCode(p.codigo) === searchTarget);

    let mesesFrecuencia = practica ? practica.mesesFrecuencia : (parseInt(mesesFrecuenciaInput) || 0);
    let alcance = practica ? practica.alcance : (alcanceInput || 'paciente');
    let nombrePractica = practica ? practica.nombre : (nombreInput || codigoPractica);

    // Si no se definió restricción de meses (0 meses)
    if (!mesesFrecuencia || mesesFrecuencia <= 0) {
      return res.json({ valido: true, motivo: 'Práctica sin restricción de frecuencia' });
    }

    // 3. Consultar historial de sesiones del paciente para códigos equivalentes (con o sin puntos)
    const sesionesPrevias = await Sesion.findAll({
      where: {
        pacienteId,
        modalidadCobro: 'obra_social'
      },
      order: [['createdAt', 'DESC']]
    });

    const sesionesCoincidentes = sesionesPrevias.filter(s => 
      s.codigoPractica && cleanCode(s.codigoPractica) === searchTarget
    );

    if (!sesionesCoincidentes || sesionesCoincidentes.length === 0) {
      return res.json({ valido: true, motivo: 'Sin antecedentes de esta práctica' });
    }

    // 4. Filtrar según el alcance de la restricción
    let sesionConflictiva = null;

    if (alcance === 'paciente') {
      sesionConflictiva = sesionesCoincidentes[0];
    } else if (alcance === 'diente') {
      sesionConflictiva = sesionesCoincidentes.find(s => s.piezaDental && s.piezaDental.toString() === piezaDental?.toString());
    } else if (alcance === 'cara') {
      sesionConflictiva = sesionesCoincidentes.find(s => 
        s.piezaDental && s.piezaDental.toString() === piezaDental?.toString() &&
        s.caraDental && caraDental && s.caraDental.toLowerCase().includes(caraDental.toLowerCase())
      );
    }

    if (!sesionConflictiva) {
      return res.json({ valido: true, motivo: 'No hay precedentes en este alcance' });
    }

    // 5. Calcular tiempo transcurrido desde la última realización
    const fechaUltima = new Date(sesionConflictiva.createdAt);
    const fechaRef = fechaEv ? new Date(fechaEv) : new Date();

    const mesesDiff = (fechaRef.getFullYear() - fechaUltima.getFullYear()) * 12 + (fechaRef.getMonth() - fechaUltima.getMonth());

    if (mesesDiff < mesesFrecuencia) {
      const fechaHabilitacion = new Date(fechaUltima);
      fechaHabilitacion.setMonth(fechaHabilitacion.getMonth() + mesesFrecuencia);

      return res.json({
        valido: false,
        practicaNombre: nombrePractica,
        codigo: codigoPractica,
        alcance: alcance,
        mesesFrecuencia: mesesFrecuencia,
        obraSocialNombre: paciente.ObraSocial?.nombre || 'Obra Social',
        fechaUltima: fechaUltima.toISOString().split('T')[0],
        fechaHabilitacion: fechaHabilitacion.toISOString().split('T')[0],
        piezaDental: sesionConflictiva.piezaDental,
        caraDental: sesionConflictiva.caraDental,
        mensaje: `La Obra Social (${paciente.ObraSocial?.nombre || 'Obra Social'}) rechazará la práctica "${nombrePractica}" (${codigoPractica}) porque exige una frecuencia mínima de ${mesesFrecuencia} meses.`
      });
    }

    res.json({ valido: true, motivo: 'Cumple el período mínimo de refacturación' });
  } catch (error) {
    console.error('Error al validar frecuencia de práctica:', error);
    res.status(500).json({ mensaje: 'Error al ejecutar el motor de validación de frecuencia.' });
  }
});

module.exports = router;
