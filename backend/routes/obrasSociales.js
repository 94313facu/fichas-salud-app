const express = require('express');
const router = express.Router();
const { ObraSocial, PlanObraSocial, PortalFacturacion, Paciente } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');

// Proteger todas las rutas
router.use(authMiddleware);

// ============================================
// PORTALES DE FACTURACIÓN — CRUD del usuario
// ============================================

// GET /api/obras-sociales/portales
// Listar todos los portales creados por el profesional
router.get('/portales', async (req, res) => {
  try {
    const portales = await PortalFacturacion.findAll({
      where: { profesionalId: req.user.id },
      order: [['nombre', 'ASC']]
    });
    res.json(portales);
  } catch (error) {
    console.error('Error al obtener portales:', error);
    res.status(500).json({ mensaje: 'Error al obtener los portales de facturación.' });
  }
});

// POST /api/obras-sociales/portales
// Crear un nuevo portal de facturación
router.post('/portales', async (req, res) => {
  try {
    const { nombre, url } = req.body;
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ mensaje: 'El nombre del portal es obligatorio.' });
    }

    const existe = await PortalFacturacion.findOne({
      where: { nombre: nombre.trim(), profesionalId: req.user.id }
    });
    if (existe) {
      return res.status(400).json({ mensaje: 'Ya existe un portal con este nombre.' });
    }

    const portal = await PortalFacturacion.create({
      nombre: nombre.trim(),
      url: url ? url.trim() : null,
      profesionalId: req.user.id
    });

    res.status(201).json(portal);
  } catch (error) {
    console.error('Error al crear portal:', error);
    res.status(500).json({ mensaje: 'Error al crear el portal de facturación.' });
  }
});

// PUT /api/obras-sociales/portales/:portalId
// Editar un portal existente
router.put('/portales/:portalId', async (req, res) => {
  try {
    const { nombre, url } = req.body;

    const portal = await PortalFacturacion.findOne({
      where: { id: req.params.portalId, profesionalId: req.user.id }
    });

    if (!portal) {
      return res.status(404).json({ mensaje: 'Portal no encontrado.' });
    }

    if (nombre && nombre.trim() !== portal.nombre) {
      const existe = await PortalFacturacion.findOne({
        where: { nombre: nombre.trim(), profesionalId: req.user.id }
      });
      if (existe) {
        return res.status(400).json({ mensaje: 'Ya existe un portal con este nombre.' });
      }
    }

    await portal.update({
      nombre: nombre ? nombre.trim() : portal.nombre,
      url: url !== undefined ? (url ? url.trim() : null) : portal.url
    });

    res.json(portal);
  } catch (error) {
    console.error('Error al editar portal:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el portal.' });
  }
});

// DELETE /api/obras-sociales/portales/:portalId
// Eliminar un portal (desasocia las OS que lo usaban)
router.delete('/portales/:portalId', async (req, res) => {
  try {
    const portal = await PortalFacturacion.findOne({
      where: { id: req.params.portalId, profesionalId: req.user.id }
    });

    if (!portal) {
      return res.status(404).json({ mensaje: 'Portal no encontrado.' });
    }

    // Desasociar obras sociales que usan este portal
    await ObraSocial.update(
      { portalFacturacionId: null },
      { where: { portalFacturacionId: portal.id } }
    );

    await portal.destroy();
    res.json({ mensaje: 'Portal eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar portal:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el portal.' });
  }
});

// ============================================
// OBRAS SOCIALES — CRUD
// ============================================

// GET /api/obras-sociales
// Obtener todas las obras sociales del profesional con planes, portal y conteo de pacientes
router.get('/', async (req, res) => {
  try {
    const obras = await ObraSocial.findAll({
      where: { profesionalId: req.user.id },
      include: [
        {
          model: PlanObraSocial,
          attributes: ['id', 'nombre', 'codigo']
        },
        {
          model: PortalFacturacion,
          attributes: ['id', 'nombre', 'url']
        }
      ],
      order: [['activa', 'DESC'], ['nombre', 'ASC']]
    });

    // Agregar conteo de pacientes por OS
    const obrasConConteo = await Promise.all(obras.map(async (os) => {
      const cantidadPacientes = await Paciente.count({
        where: { obraSocialId: os.id, profesionalId: req.user.id }
      });
      return {
        ...os.toJSON(),
        cantidadPacientes
      };
    }));

    res.json(obrasConConteo);
  } catch (error) {
    console.error('Error al obtener obras sociales:', error);
    res.status(500).json({ mensaje: 'Error al obtener el listado de obras sociales.' });
  }
});

// POST /api/obras-sociales
// Crear una nueva obra social
router.post('/', async (req, res) => {
  try {
    const { nombre, portalFacturacionId, notas } = req.body;
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ mensaje: 'El nombre de la obra social es obligatorio.' });
    }

    const existe = await ObraSocial.findOne({
      where: { nombre: nombre.trim(), profesionalId: req.user.id }
    });
    if (existe) {
      return res.status(400).json({ mensaje: 'Esta obra social ya está en tu listado.' });
    }

    // Validar que el portal existe y pertenece al profesional (si se especificó)
    if (portalFacturacionId) {
      const portal = await PortalFacturacion.findOne({
        where: { id: portalFacturacionId, profesionalId: req.user.id }
      });
      if (!portal) {
        return res.status(400).json({ mensaje: 'El portal de facturación seleccionado no es válido.' });
      }
    }

    const nuevaObra = await ObraSocial.create({
      nombre: nombre.trim(),
      portalFacturacionId: portalFacturacionId || null,
      notas: notas ? notas.trim() : null,
      activa: true,
      profesionalId: req.user.id
    });

    // Recargar con relaciones
    const obraCompleta = await ObraSocial.findByPk(nuevaObra.id, {
      include: [
        { model: PlanObraSocial, attributes: ['id', 'nombre', 'codigo'] },
        { model: PortalFacturacion, attributes: ['id', 'nombre', 'url'] }
      ]
    });

    res.status(201).json({ ...obraCompleta.toJSON(), cantidadPacientes: 0 });
  } catch (error) {
    console.error('Error al crear obra social:', error);
    res.status(500).json({ mensaje: 'Error al registrar la obra social.' });
  }
});

// PUT /api/obras-sociales/:id
// Editar una obra social
router.put('/:id', async (req, res) => {
  try {
    const { nombre, portalFacturacionId, notas, activa } = req.body;

    const obraSocial = await ObraSocial.findOne({
      where: { id: req.params.id, profesionalId: req.user.id }
    });

    if (!obraSocial) {
      return res.status(404).json({ mensaje: 'Obra social no encontrada.' });
    }

    if (nombre && nombre.trim() === '') {
      return res.status(400).json({ mensaje: 'El nombre de la obra social es obligatorio.' });
    }

    if (nombre && nombre.trim() !== obraSocial.nombre) {
      const existe = await ObraSocial.findOne({
        where: { nombre: nombre.trim(), profesionalId: req.user.id }
      });
      if (existe) {
        return res.status(400).json({ mensaje: 'Ya existe una obra social con este nombre.' });
      }
    }

    if (portalFacturacionId) {
      const portal = await PortalFacturacion.findOne({
        where: { id: portalFacturacionId, profesionalId: req.user.id }
      });
      if (!portal) {
        return res.status(400).json({ mensaje: 'El portal de facturación seleccionado no es válido.' });
      }
    }

    await obraSocial.update({
      nombre: nombre ? nombre.trim() : obraSocial.nombre,
      portalFacturacionId: portalFacturacionId !== undefined ? (portalFacturacionId || null) : obraSocial.portalFacturacionId,
      notas: notas !== undefined ? (notas ? notas.trim() : null) : obraSocial.notas,
      activa: activa !== undefined ? activa : obraSocial.activa
    });

    // Recargar con relaciones
    const obraActualizada = await ObraSocial.findByPk(obraSocial.id, {
      include: [
        { model: PlanObraSocial, attributes: ['id', 'nombre', 'codigo'] },
        { model: PortalFacturacion, attributes: ['id', 'nombre', 'url'] }
      ]
    });

    const cantidadPacientes = await Paciente.count({
      where: { obraSocialId: obraSocial.id }
    });

    res.json({ ...obraActualizada.toJSON(), cantidadPacientes });
  } catch (error) {
    console.error('Error al editar obra social:', error);
    res.status(500).json({ mensaje: 'Error al actualizar la obra social.' });
  }
});

// PATCH /api/obras-sociales/:id/toggle
// Pausar/activar una obra social
router.patch('/:id/toggle', async (req, res) => {
  try {
    const obraSocial = await ObraSocial.findOne({
      where: { id: req.params.id, profesionalId: req.user.id }
    });

    if (!obraSocial) {
      return res.status(404).json({ mensaje: 'Obra social no encontrada.' });
    }

    await obraSocial.update({ activa: !obraSocial.activa });
    res.json(obraSocial);
  } catch (error) {
    console.error('Error al cambiar estado de obra social:', error);
    res.status(500).json({ mensaje: 'Error al cambiar el estado de la obra social.' });
  }
});

// DELETE /api/obras-sociales/:id
// Eliminar obra social (soft si tiene pacientes, hard si no)
router.delete('/:id', async (req, res) => {
  try {
    const obraSocial = await ObraSocial.findOne({
      where: { id: req.params.id, profesionalId: req.user.id }
    });

    if (!obraSocial) {
      return res.status(404).json({ mensaje: 'Obra social no encontrada.' });
    }

    const cantidadPacientes = await Paciente.count({
      where: { obraSocialId: obraSocial.id }
    });

    if (cantidadPacientes > 0) {
      await obraSocial.update({ activa: false });
      return res.json({
        mensaje: `La obra social tiene ${cantidadPacientes} paciente(s) asociado(s). Se ha pausado en lugar de eliminar.`,
        pausada: true
      });
    }

    await PlanObraSocial.destroy({ where: { obraSocialId: obraSocial.id } });
    await obraSocial.destroy();
    res.json({ mensaje: 'Obra social eliminada correctamente.', eliminada: true });
  } catch (error) {
    console.error('Error al eliminar obra social:', error);
    res.status(500).json({ mensaje: 'Error al eliminar la obra social.' });
  }
});

// ============================================
// PLANES DE OBRA SOCIAL — Sub-rutas
// ============================================

// GET /api/obras-sociales/:id/planes
router.get('/:id/planes', async (req, res) => {
  try {
    const obraSocial = await ObraSocial.findOne({
      where: { id: req.params.id, profesionalId: req.user.id }
    });

    if (!obraSocial) {
      return res.status(404).json({ mensaje: 'Obra social no encontrada.' });
    }

    const planes = await PlanObraSocial.findAll({
      where: { obraSocialId: obraSocial.id },
      order: [['nombre', 'ASC']]
    });

    res.json(planes);
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({ mensaje: 'Error al obtener los planes de la obra social.' });
  }
});

// POST /api/obras-sociales/:id/planes
router.post('/:id/planes', async (req, res) => {
  try {
    const { nombre, codigo } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ mensaje: 'El nombre del plan es obligatorio.' });
    }

    const obraSocial = await ObraSocial.findOne({
      where: { id: req.params.id, profesionalId: req.user.id }
    });

    if (!obraSocial) {
      return res.status(404).json({ mensaje: 'Obra social no encontrada.' });
    }

    const existe = await PlanObraSocial.findOne({
      where: { nombre: nombre.trim(), obraSocialId: obraSocial.id }
    });

    if (existe) {
      return res.status(400).json({ mensaje: 'Ya existe un plan con este nombre para esta obra social.' });
    }

    const plan = await PlanObraSocial.create({
      nombre: nombre.trim(),
      codigo: codigo ? codigo.trim() : null,
      obraSocialId: obraSocial.id
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error('Error al crear plan:', error);
    res.status(500).json({ mensaje: 'Error al crear el plan.' });
  }
});

// PUT /api/obras-sociales/:osId/planes/:planId
router.put('/:osId/planes/:planId', async (req, res) => {
  try {
    const { nombre, codigo } = req.body;

    const obraSocial = await ObraSocial.findOne({
      where: { id: req.params.osId, profesionalId: req.user.id }
    });

    if (!obraSocial) {
      return res.status(404).json({ mensaje: 'Obra social no encontrada.' });
    }

    const plan = await PlanObraSocial.findOne({
      where: { id: req.params.planId, obraSocialId: obraSocial.id }
    });

    if (!plan) {
      return res.status(404).json({ mensaje: 'Plan no encontrado.' });
    }

    await plan.update({
      nombre: nombre ? nombre.trim() : plan.nombre,
      codigo: codigo !== undefined ? (codigo ? codigo.trim() : null) : plan.codigo
    });

    res.json(plan);
  } catch (error) {
    console.error('Error al editar plan:', error);
    res.status(500).json({ mensaje: 'Error al editar el plan.' });
  }
});

// DELETE /api/obras-sociales/:osId/planes/:planId
router.delete('/:osId/planes/:planId', async (req, res) => {
  try {
    const obraSocial = await ObraSocial.findOne({
      where: { id: req.params.osId, profesionalId: req.user.id }
    });

    if (!obraSocial) {
      return res.status(404).json({ mensaje: 'Obra social no encontrada.' });
    }

    const plan = await PlanObraSocial.findOne({
      where: { id: req.params.planId, obraSocialId: obraSocial.id }
    });

    if (!plan) {
      return res.status(404).json({ mensaje: 'Plan no encontrado.' });
    }

    await Paciente.update(
      { planObraSocialId: null },
      { where: { planObraSocialId: plan.id } }
    );

    await plan.destroy();
    res.json({ mensaje: 'Plan eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar plan:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el plan.' });
  }
});

module.exports = router;
