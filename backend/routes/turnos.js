const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Turno, Paciente, Profesional } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  crearEventoCalendar,
  actualizarEventoCalendar,
  eliminarEventoCalendar
} = require('../config/googleServices');

// Proteger todas las rutas de turnos
router.use(authMiddleware);

// GET /api/turnos/por-mes?anio=2026&mes=8
// Obtener turnos de un mes específico (optimizado para el calendario)
router.get('/por-mes', async (req, res) => {
  try {
    const { anio, mes } = req.query;
    if (!anio || !mes) {
      return res.status(400).json({ mensaje: 'Parámetros "anio" y "mes" son obligatorios.' });
    }

    const inicioMes = new Date(parseInt(anio), parseInt(mes) - 1, 1);
    const finMes = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59);

    const turnos = await Turno.findAll({
      where: {
        profesionalId: req.user.id,
        fechaHora: {
          [Op.between]: [inicioMes, finMes]
        }
      },
      include: [
        {
          model: Paciente,
          attributes: ['id', 'nombre', 'telefono', 'emailContact']
        }
      ],
      order: [['fechaHora', 'ASC']]
    });

    // Obtener horario laboral del profesional
    const profesional = await Profesional.findByPk(req.user.id);
    const horario = profesional.horarioLaboral || null;

    res.json({ turnos, horarioLaboral: horario });
  } catch (error) {
    console.error('Error al obtener turnos por mes:', error);
    res.status(500).json({ mensaje: 'Error al obtener turnos del mes.' });
  }
});
// Obtener todos los turnos del profesional autenticado
router.get('/', async (req, res) => {
  try {
    const turnos = await Turno.findAll({
      where: { profesionalId: req.user.id },
      include: [
        {
          model: Paciente,
          attributes: ['id', 'nombre', 'telefono', 'emailContact']
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
    const { pacienteId, fechaHora, duracionMinutos, notas, estado } = req.body;

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

    const startNuevo = new Date(fechaHora);
    const endNuevo = new Date(startNuevo.getTime() + (parseInt(duracionMinutos) || 30) * 60000);

    // Verificar si el turno está dentro del horario laboral
    const profesional = await Profesional.findByPk(req.user.id);
    if (profesional && profesional.horarioLaboral) {
      const horarioLaboral = typeof profesional.horarioLaboral === 'string' 
        ? JSON.parse(profesional.horarioLaboral) 
        : profesional.horarioLaboral;
      const diasNombres = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const nombreDia = diasNombres[startNuevo.getDay()];
      const configDia = horarioLaboral[nombreDia];

      if (!configDia || !configDia.activo) {
        return res.status(400).json({ mensaje: `No tienes configurado horario de atención para los días ${nombreDia}.` });
      }

      const getMinutos = (horaStr) => {
        const [h, m] = horaStr.split(':').map(Number);
        return h * 60 + m;
      };

      const inicioMinutos = getMinutos(configDia.inicio);
      const finMinutos = getMinutos(configDia.fin);
      
      const startNuevoMinutos = startNuevo.getHours() * 60 + startNuevo.getMinutes();
      // Si el turno termina al día siguiente (pasa de las 00:00), lo bloqueamos o lo sumamos
      // Asumimos que los turnos son en el mismo día.
      let endNuevoMinutos = endNuevo.getHours() * 60 + endNuevo.getMinutes();
      if (endNuevo.getDate() !== startNuevo.getDate()) {
        endNuevoMinutos += 24 * 60;
      }

      if (startNuevoMinutos < inicioMinutos || endNuevoMinutos > finMinutos) {
        return res.status(400).json({ mensaje: `El turno excede tu horario laboral configurado para este día (${configDia.inicio} - ${configDia.fin}).` });
      }
    }

    // Verificar superposición de turnos
    
    const inicioDia = new Date(startNuevo);
    inicioDia.setHours(0,0,0,0);
    const finDia = new Date(startNuevo);
    finDia.setHours(23,59,59,999);

    const turnosExistentes = await Turno.findAll({
      where: {
        profesionalId: req.user.id,
        estado: { [Op.ne]: 'Cancelado' },
        fechaHora: {
          [Op.between]: [inicioDia, finDia]
        }
      }
    });

    const haySuperposicion = turnosExistentes.some(t => {
      const startT = new Date(t.fechaHora);
      const endT = new Date(startT.getTime() + (t.duracionMinutos || 30) * 60000);
      return (startNuevo < endT && endNuevo > startT);
    });

    if (haySuperposicion) {
      return res.status(400).json({ mensaje: 'El horario seleccionado se superpone con un turno ya existente. Por favor, selecciona otro horario.' });
    }

    // Crear registro local del turno
    const nuevoTurno = await Turno.create({
      pacienteId: paciente.id,
      profesionalId: req.user.id,
      fechaHora: new Date(fechaHora),
      duracionMinutos: parseInt(duracionMinutos) || 30,
      notas: notas ? notas.trim() : null,
      estado: estado || 'Pendiente'
    });

    // Intentar sincronizar con Google Calendar (no bloquea si falla)
    try {
      const googleEventId = await crearEventoCalendar(
        req.user.id,
        nuevoTurno,
        paciente.nombre
      );

      if (googleEventId) {
        nuevoTurno.googleEventId = googleEventId;
        await nuevoTurno.save();
      }
    } catch (syncError) {
      console.log('Google Calendar no configurado o error de sincronización:', syncError.message);
    }

    // Retornar turno creado con includes
    const turnoCompleto = await Turno.findByPk(nuevoTurno.id, {
      include: [
        { model: Paciente, attributes: ['id', 'nombre', 'telefono', 'emailContact'] }
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
    const { pacienteId, fechaHora, duracionMinutos, notas, estado } = req.body;

    const turno = await Turno.findOne({
      where: { id, profesionalId: req.user.id }
    });

    if (!turno) {
      return res.status(404).json({ mensaje: 'Turno no encontrado.' });
    }

    let pacienteNombre = '';
    if (pacienteId) {
      const paciente = await Paciente.findOne({
        where: { id: pacienteId, profesionalId: req.user.id }
      });
      if (paciente) {
        turno.pacienteId = paciente.id;
        pacienteNombre = paciente.nombre;
      }
    }

    // Verificar superposición si se cambia la fecha o la duración
    if (fechaHora || duracionMinutos !== undefined) {
      const nuevaFechaHora = fechaHora ? new Date(fechaHora) : new Date(turno.fechaHora);
      const nuevaDuracion = duracionMinutos !== undefined ? parseInt(duracionMinutos) || 30 : turno.duracionMinutos;

      const startNuevo = nuevaFechaHora;
      const endNuevo = new Date(startNuevo.getTime() + nuevaDuracion * 60000);

      // Verificar si el turno está dentro del horario laboral
      const profesional = await Profesional.findByPk(req.user.id);
      if (profesional && profesional.horarioLaboral) {
        const horarioLaboral = typeof profesional.horarioLaboral === 'string' 
          ? JSON.parse(profesional.horarioLaboral) 
          : profesional.horarioLaboral;
        const diasNombres = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const nombreDia = diasNombres[startNuevo.getDay()];
        const configDia = horarioLaboral[nombreDia];

        if (!configDia || !configDia.activo) {
          return res.status(400).json({ mensaje: `No tienes configurado horario de atención para los días ${nombreDia}.` });
        }

        const getMinutos = (horaStr) => {
          const [h, m] = horaStr.split(':').map(Number);
          return h * 60 + m;
        };

        const inicioMinutos = getMinutos(configDia.inicio);
        const finMinutos = getMinutos(configDia.fin);
        
        const startNuevoMinutos = startNuevo.getHours() * 60 + startNuevo.getMinutes();
        let endNuevoMinutos = endNuevo.getHours() * 60 + endNuevo.getMinutes();
        if (endNuevo.getDate() !== startNuevo.getDate()) {
          endNuevoMinutos += 24 * 60;
        }

        if (startNuevoMinutos < inicioMinutos || endNuevoMinutos > finMinutos) {
          return res.status(400).json({ mensaje: `El turno excede tu horario laboral configurado para este día (${configDia.inicio} - ${configDia.fin}).` });
        }
      }

      const inicioDia = new Date(startNuevo);
      inicioDia.setHours(0,0,0,0);
      const finDia = new Date(startNuevo);
      finDia.setHours(23,59,59,999);

      const turnosExistentes = await Turno.findAll({
        where: {
          profesionalId: req.user.id,
          estado: { [Op.ne]: 'Cancelado' },
          id: { [Op.ne]: id }, // Excluir el turno actual
          fechaHora: {
            [Op.between]: [inicioDia, finDia]
          }
        }
      });

      const haySuperposicion = turnosExistentes.some(t => {
        const startT = new Date(t.fechaHora);
        const endT = new Date(startT.getTime() + (t.duracionMinutos || 30) * 60000);
        return (startNuevo < endT && endNuevo > startT);
      });

      if (haySuperposicion) {
        return res.status(400).json({ mensaje: 'El horario seleccionado se superpone con un turno ya existente. Por favor, selecciona otro horario.' });
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
        pacienteNombre
      );
    }

    const turnoActualizado = await Turno.findByPk(turno.id, {
      include: [
        { model: Paciente, attributes: ['id', 'nombre', 'telefono', 'emailContact'] }
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

// PUT /api/turnos/:id/recordatorio
// Marcar un turno como que el recordatorio ya fue enviado (manual)
router.put('/:id/recordatorio', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el turno pertenezca al profesional
    const turno = await Turno.findOne({
      where: { id },
      include: [{
        model: Paciente,
        as: 'paciente',
        where: { profesionalId: req.user.id }
      }]
    });

    if (!turno) {
      return res.status(404).json({ mensaje: 'Turno no encontrado.' });
    }

    turno.recordatorioEnviado = true;
    await turno.save();

    res.json({ mensaje: 'Turno marcado como recordatorio enviado.', turno });
  } catch (error) {
    console.error('Error al marcar recordatorio enviado:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el turno.' });
  }
});

module.exports = router;
