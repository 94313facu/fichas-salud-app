const express = require('express');
const router = express.Router();
const { Sesion, Paciente, ObraSocial, PlanObraSocial, PortalFacturacion } = require('../models');
const { Op } = require('sequelize');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// GET /api/facturacion/pendientes
// Listar sesiones facturables del profesional con datos completos para el flujo de facturación
router.get('/pendientes', async (req, res) => {
  try {
    const { estado, obraSocialId, desde, hasta } = req.query;

    // Obtener IDs de pacientes del profesional
    const pacientes = await Paciente.findAll({
      where: { profesionalId: req.user.id },
      attributes: ['id']
    });
    const pacienteIds = pacientes.map(p => p.id);

    if (pacienteIds.length === 0) {
      return res.json([]);
    }

    // Construir filtro
    const whereClause = {
      pacienteId: { [Op.in]: pacienteIds }
    };

    if (estado && estado !== 'todos') {
      whereClause.estadoFacturacion = estado;
    }

    if (desde || hasta) {
      whereClause.createdAt = {};
      if (desde) whereClause.createdAt[Op.gte] = new Date(desde);
      if (hasta) {
        const hastaDate = new Date(hasta);
        hastaDate.setHours(23, 59, 59, 999);
        whereClause.createdAt[Op.lte] = hastaDate;
      }
    }

    // Solo sesiones con código de práctica (facturables)
    whereClause.codigoPractica = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };

    const sesiones = await Sesion.findAll({
      where: whereClause,
      include: [
        {
          model: Paciente,
          attributes: ['id', 'nombre', 'numeroAfiliado', 'planObraSocial', 'planObraSocialId'],
          include: [
            {
              model: ObraSocial,
              attributes: ['id', 'nombre'],
              include: [{
                model: PortalFacturacion,
                attributes: ['id', 'nombre', 'url']
              }]
            },
            {
              model: PlanObraSocial,
              attributes: ['id', 'nombre', 'codigo']
            }
          ]
        },
        {
          model: ObraSocial,
          as: 'ObraSocialSesion',
          attributes: ['id', 'nombre'],
          required: false,
          include: [{
            model: PortalFacturacion,
            attributes: ['id', 'nombre', 'url']
          }]
        },
        {
          model: PlanObraSocial,
          as: 'PlanObraSocialSesion',
          attributes: ['id', 'nombre', 'codigo'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Filtrar por obraSocialId si se especificó (buscar en la OS de la sesión O en la del paciente)
    let resultado = sesiones;
    if (obraSocialId) {
      const osIdInt = parseInt(obraSocialId);
      resultado = sesiones.filter(s =>
        (s.ObraSocialSesion?.id === osIdInt) || (!s.obraSocialId && s.Paciente?.ObraSocial?.id === osIdInt)
      );
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener prácticas pendientes:', error);
    res.status(500).json({ mensaje: 'Error al consultar las prácticas de facturación.' });
  }
});

// PATCH /api/facturacion/:sesionId/estado
// Cambiar el estado de facturación de una sesión
router.patch('/:sesionId/estado', async (req, res) => {
  try {
    const { estadoFacturacion } = req.body;

    const estadosValidos = ['pendiente', 'facturado', 'particular', 'debitado'];
    if (!estadoFacturacion || !estadosValidos.includes(estadoFacturacion)) {
      return res.status(400).json({ mensaje: `Estado inválido. Opciones: ${estadosValidos.join(', ')}` });
    }

    const sesion = await Sesion.findOne({
      where: { id: req.params.sesionId },
      include: [{
        model: Paciente,
        where: { profesionalId: req.user.id },
        attributes: ['id', 'profesionalId']
      }]
    });

    if (!sesion) {
      return res.status(404).json({ mensaje: 'Sesión no encontrada o no tienes permisos.' });
    }

    await sesion.update({ estadoFacturacion });

    if (estadoFacturacion === 'particular' && sesion.modalidadCobro !== 'particular') {
      await sesion.update({ modalidadCobro: 'particular' });
    }

    res.json({ mensaje: 'Estado actualizado correctamente.', sesion });
  } catch (error) {
    console.error('Error al cambiar estado de facturación:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el estado de facturación.' });
  }
});

// GET /api/facturacion/resumen
// Resumen de facturación agrupado por obra social
router.get('/resumen', async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      where: { profesionalId: req.user.id },
      attributes: ['id', 'obraSocialId'],
      include: [{ model: ObraSocial, attributes: ['id', 'nombre'] }]
    });

    const pacienteIds = pacientes.map(p => p.id);

    if (pacienteIds.length === 0) {
      return res.json({ total: { pendientes: 0, facturados: 0, debitados: 0, particulares: 0 }, porObraSocial: [] });
    }

    const sesiones = await Sesion.findAll({
      where: {
        pacienteId: { [Op.in]: pacienteIds },
        codigoPractica: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] }
      },
      include: [
        {
          model: Paciente,
          attributes: ['id', 'obraSocialId'],
          include: [{ model: ObraSocial, attributes: ['id', 'nombre'] }]
        },
        {
          model: ObraSocial,
          as: 'ObraSocialSesion',
          attributes: ['id', 'nombre'],
          required: false
        }
      ]
    });

    const total = {
      pendientes: sesiones.filter(s => s.estadoFacturacion === 'pendiente').length,
      facturados: sesiones.filter(s => s.estadoFacturacion === 'facturado').length,
      debitados: sesiones.filter(s => s.estadoFacturacion === 'debitado').length,
      particulares: sesiones.filter(s => s.estadoFacturacion === 'particular').length
    };

    const obrasSocialesMap = {};
    sesiones.forEach(s => {
      // Usar la OS de la sesión si existe, sino la del paciente (legacy)
      const osNombre = s.ObraSocialSesion?.nombre || s.Paciente?.ObraSocial?.nombre || 'Particular / Sin OS';
      const osId = s.ObraSocialSesion?.id || s.Paciente?.ObraSocial?.id || 0;
      if (!obrasSocialesMap[osId]) {
        obrasSocialesMap[osId] = {
          obraSocialId: osId,
          obraSocialNombre: osNombre,
          pendientes: 0, facturados: 0, debitados: 0, particulares: 0
        };
      }
      const key = s.estadoFacturacion || 'pendiente';
      if (key === 'pendiente') obrasSocialesMap[osId].pendientes++;
      else if (key === 'facturado') obrasSocialesMap[osId].facturados++;
      else if (key === 'debitado') obrasSocialesMap[osId].debitados++;
      else if (key === 'particular') obrasSocialesMap[osId].particulares++;
    });

    res.json({
      total,
      porObraSocial: Object.values(obrasSocialesMap).sort((a, b) => b.pendientes - a.pendientes)
    });
  } catch (error) {
    console.error('Error al obtener resumen de facturación:', error);
    res.status(500).json({ mensaje: 'Error al calcular el resumen de facturación.' });
  }
});

module.exports = router;
