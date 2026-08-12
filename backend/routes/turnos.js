const express = require('express');
const router = express.Router();
const { Turno, Paciente, Tratamiento } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  crearEventoCalendar,
  actualizarEventoCalendar,
  eliminarEventoCalendar
} = require('../config/googleServices');

// Proteger todas las rutas de turnos
router.use(authMiddleware);

// GET /api/turnos
// Obtener todos los turnos del profesional autenticado
router.get('/', async (req, res) => {
  try {
    const turnos = await Turno.findAll({
      where: { profesionalId: req.user.id },
      include: [
        {
          model: Paciente,
          attributes: ['id', 'nombre', 'telefono', 'emailContact']
        },
        {
          model: Tratamiento,
          attributes: ['id', 'nombre']
        }
      ],
      order: [['fechaHora', 'ASC']]
    });

    res.json(turnos);
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({ mensaje: 'Error al obtener la agenda de turnos.' });
  }
});

// POST /api/turnos
// Registrar un nuevo turno y sincronizar en Google Calendar si está vinculado
router.post('/', async (req, res) => {
  try {
    const { pacienteId, tratamientoId, fechaHora, duracionMinutos, notas, estado } = req.body;

    if (!pacienteId || !fechaHora) {
      return res.status(400).json({ mensaje: 'El paciente y la fecha/hora son obligatorios.' });
    }

    // Verificar que el paciente pertenezca al profesional
    const paciente = await Paciente.findOne({
      where: { id: pacienteId, profesionalId: req.user.id }
    });

    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado o sin permisos.' });
    }

    // Verificar tratamiento si se envió
    let tratamiento = null;
    if (tratamientoId) {
      tratamiento = await Tratamiento.findOne({
        where: { id: tratamientoId, pacienteId: paciente.id }
      });
    }

    // Crear registro local del turno
    const nuevoTurno = await Turno.create({
      pacienteId: paciente.id,
      profesionalId: req.user.id,
      tratamientoId: tratamiento ? tratamiento.id : null,
      fechaHora: new Date(fechaHora),
      duracionMinutos: parseInt(duracionMinutos) || 30,
      notas: notas ? notas.trim() : null,
      estado: estado || 'Pendiente'
    });

    // Intentar sincronizar con Google Calendar
    const googleEventId = await crearEventoCalendar(
      req.user.id,
      nuevoTurno,
      paciente.nombre,
      tratamiento ? tratamiento.nombre : ''
    );

    if (googleEventId) {
      nuevoTurno.googleEventId = googleEventId;
      await nuevoTurno.save();
    }

    // Retornar turno creado con includes
    const turnoCompleto = await Turno.findByPk(nuevoTurno.id, {
      include: [
        { model: Paciente, attributes: ['id', 'nombre', 'telefono', 'emailContact'] },
        { model: Tratamiento, attributes: ['id', 'nombre'] }
      ]
    });

    res.status(201).json(turnoCompleto);
  } catch (error) {
    console.error('Error al crear turno:', error);
    res.status(500).json({ mensaje: 'Error al registrar el turno.' });
  }
});

// PUT /api/turnos/:id
// Modificar/Actualizar un turno (y sincronizar en Google Calendar)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pacienteId, tratamientoId, fechaHora, duracionMinutos, notas, estado } = req.body;

    const turno = await Turno.findOne({
      where: { id, profesionalId: req.user.id }
    });

    if (!turno) {
      return res.status(404).json({ mensaje: 'Turno no encontrado.' });
    }

    let pacienteNombre = '';
    let tratamientoNombre = '';

    if (pacienteId) {
      const paciente = await Paciente.findOne({
        where: { id: pacienteId, profesionalId: req.user.id }
      });
      if (paciente) {
        turno.pacienteId = paciente.id;
        pacienteNombre = paciente.nombre;
      }
    }

    if (tratamientoId) {
      const tratamiento = await Tratamiento.findOne({
        where: { id: tratamientoId }
      });
      if (tratamiento) {
        turno.tratamientoId = tratamiento.id;
        tratamientoNombre = tratamiento.nombre;
      }
    }

    if (fechaHora) turno.fechaHora = new Date(fechaHora);
    if (duracionMinutos !== undefined) turno.duracionMinutos = parseInt(duracionMinutos) || 30;
    if (notas !== undefined) turno.notas = notas ? notas.trim() : null;
    if (estado) turno.estado = estado;

    await turno.save();

    // Sincronizar actualización en Google Calendar si existe evento vinculado
    if (turno.googleEventId) {
      if (!pacienteNombre) {
        const pac = await Paciente.findByPk(turno.pacienteId);
        pacienteNombre = pac ? pac.nombre : 'Paciente';
      }
      await actualizarEventoCalendar(
        req.user.id,
        turno.googleEventId,
        turno,
        pacienteNombre,
        tratamientoNombre
      );
    }

    const turnoActualizado = await Turno.findByPk(turno.id, {
      include: [
        { model: Paciente, attributes: ['id', 'nombre', 'telefono', 'emailContact'] },
        { model: Tratamiento, attributes: ['id', 'nombre'] }
      ]
    });

    res.json(turnoActualizado);
  } catch (error) {
    console.error('Error al editar turno:', error);
    res.status(500).json({ mensaje: 'Error al actualizar los datos del turno.' });
  }
});

// DELETE /api/turnos/:id
// Cancelar/Eliminar un turno
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await Turno.findOne({
      where: { id, profesionalId: req.user.id }
    });

    if (!turno) {
      return res.status(404).json({ mensaje: 'Turno no encontrado.' });
    }

    // Eliminar evento en Google Calendar si existe
    if (turno.googleEventId) {
      await eliminarEventoCalendar(req.user.id, turno.googleEventId);
    }

    await turno.destroy();
    res.json({ mensaje: 'Turno eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar turno:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el turno.' });
  }
});

module.exports = router;
