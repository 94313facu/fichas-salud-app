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
    const { obraSocialId, planObraSocialId } = req.query;
    
    const where = { profesionalId: req.user.id };
    if (obraSocialId !== undefined) {
      where.obraSocialId = obraSocialId ? parseInt(obraSocialId) : null;
    }
    if (planObraSocialId !== undefined) {
      where.planObraSocialId = planObraSocialId ? parseInt(planObraSocialId) : null;
    }

    const practicas = await Practica.findAll({
      where,
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
    const { obraSocialId, planObraSocialId } = req.query;

    const practicas = await Practica.findAll({
      where: { profesionalId: req.user.id }
    });

    const practicasFiltradas = practicas.filter(p => cleanCode(p.codigo) === searchTarget);

    if (practicasFiltradas.length === 0) {
      return res.json({ existe: false });
    }

    // Buscamos jerárquicamente la regla aplicable:
    // 1. Obra Social + Plan
    let practicaAplicable = practicasFiltradas.find(p => p.obraSocialId == obraSocialId && p.planObraSocialId == planObraSocialId);
    
    // 2. Solo Obra Social genérica
    if (!practicaAplicable && obraSocialId) {
      practicaAplicable = practicasFiltradas.find(p => p.obraSocialId == obraSocialId && !p.planObraSocialId);
    }
    
    // 3. Regla global para la práctica (sin obra social)
    if (!practicaAplicable) {
      practicaAplicable = practicasFiltradas.find(p => !p.obraSocialId && !p.planObraSocialId);
    }
    
    // 4. Si no hay global, devolvemos la primera encontrada como base de nombre
    if (!practicaAplicable) {
       practicaAplicable = {
         codigo: practicasFiltradas[0].codigo,
         nombre: practicasFiltradas[0].nombre,
         alcance: 'paciente',
         mesesFrecuencia: 0,
         obraSocialId: null,
         planObraSocialId: null
       };
    }

    res.json({ existe: true, practica: practicaAplicable });
  } catch (error) {
    console.error('Error al buscar código de práctica:', error);
    res.status(500).json({ mensaje: 'Error al buscar el código de práctica.' });
  }
});

// POST /api/practicas
// Registrar una nueva práctica o actualizar su regla de frecuencia
router.post('/', async (req, res) => {
  try {
    const { codigo, nombre, alcance, mesesFrecuencia, obraSocialId, planObraSocialId } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({ mensaje: 'El código y el nombre de la práctica son obligatorios.' });
    }

    const searchTarget = cleanCode(codigo);
    const practicas = await Practica.findAll({
      where: { profesionalId: req.user.id }
    });

    let practica = practicas.find(p => 
      cleanCode(p.codigo) === searchTarget && 
      p.obraSocialId === (obraSocialId ? parseInt(obraSocialId) : null) &&
      p.planObraSocialId === (planObraSocialId ? parseInt(planObraSocialId) : null)
    );

    if (practica) {
      await practica.update({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        alcance: alcance || 'paciente',
        mesesFrecuencia: parseInt(mesesFrecuencia) || 0
      });
    } else {
      practica = await Practica.create({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        alcance: alcance || 'paciente',
        mesesFrecuencia: parseInt(mesesFrecuencia) || 0,
        obraSocialId: obraSocialId ? parseInt(obraSocialId) : null,
        planObraSocialId: planObraSocialId ? parseInt(planObraSocialId) : null,
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
// Ahora soporta multi-OS: recibe el obraSocialId explícito con el que se va a facturar
router.post('/validar-frecuencia', async (req, res) => {
  try {
    const { pacienteId, codigoPractica, piezaDental, caraDental, fechaEv, obraSocialId: obraSocialIdParam, planObraSocialId: planObraSocialIdParam, ignoreSesionId, practicasSimuladas } = req.body;

    if (!pacienteId || !codigoPractica) {
      return res.status(400).json({ mensaje: 'pacienteId y codigoPractica son requeridos.' });
    }

    // 1. Obtener datos del paciente
    const paciente = await Paciente.findOne({
      where: { id: pacienteId, profesionalId: req.user.id }
    });

    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado.' });
    }

    // Determinar la OS a validar: si se envió explícitamente, usar esa; si no, fallback a la legacy
    const obraSocialId = obraSocialIdParam ? parseInt(obraSocialIdParam) : paciente.obraSocialId;
    const planObraSocialId = planObraSocialIdParam ? parseInt(planObraSocialIdParam) : paciente.planObraSocialId;

    // Si no hay OS, no se aplican restricciones (particular)
    if (!obraSocialId) {
      return res.json({ valido: true, motivo: 'Paciente Particular / Sin Obra Social seleccionada' });
    }

    // Obtener datos de OS y límites
    const obraSocial = await ObraSocial.findByPk(obraSocialId);
    const obraSocialNombre = obraSocial?.nombre || 'Obra Social';

    // 2. Consultar historial de TODAS las sesiones del paciente con esta OS para validar límites globales
    const whereConditions = {
      pacienteId,
      modalidadCobro: 'obra_social'
    };
    if (ignoreSesionId) {
      whereConditions.id = { [require('sequelize').Op.ne]: ignoreSesionId };
    }

    const sesionesPreviasTodas = await Sesion.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']]
    });

    const sesionesOSActual = sesionesPreviasTodas.filter(s => {
      const sesionOsId = s.obraSocialId || paciente.obraSocialId;
      return sesionOsId === obraSocialId;
    });

    const fechaRef = fechaEv ? new Date(fechaEv) : new Date();

    if (practicasSimuladas && practicasSimuladas.length > 0) {
      sesionesOSActual.unshift({
        createdAt: fechaRef,
        obraSocialId: obraSocialId,
        practicasMultiples: JSON.stringify(practicasSimuladas),
        codigoPractica: null,
        piezaDental: null,
        caraDental: null
      });
    }

    // Validar Límite Mensual
    if (obraSocial && obraSocial.limitePracticasMensual > 0) {
      let practicasMensuales = 0;
      sesionesOSActual.forEach(s => {
        const d = new Date(s.createdAt);
        if (d.getFullYear() === fechaRef.getFullYear() && d.getMonth() === fechaRef.getMonth()) {
          if (s.practicasMultiples) {
            try { practicasMensuales += JSON.parse(s.practicasMultiples).length; } catch(e){}
          } else if (s.codigoPractica) {
            practicasMensuales += 1;
          }
        }
      });
      if (practicasMensuales >= obraSocial.limitePracticasMensual) {
        return res.json({ valido: false, motivo: `Límite mensual de la Obra Social (${obraSocial.limitePracticasMensual}) superado.` });
      }
    }

    // Validar Límite Anual
    if (obraSocial && obraSocial.limitePracticasAnual > 0) {
      let practicasAnuales = 0;
      sesionesOSActual.forEach(s => {
        const d = new Date(s.createdAt);
        if (d.getFullYear() === fechaRef.getFullYear()) {
          if (s.practicasMultiples) {
            try { practicasAnuales += JSON.parse(s.practicasMultiples).length; } catch(e){}
          } else if (s.codigoPractica) {
            practicasAnuales += 1;
          }
        }
      });
      if (practicasAnuales >= obraSocial.limitePracticasAnual) {
        return res.json({ valido: false, motivo: `Límite anual de la Obra Social (${obraSocial.limitePracticasAnual}) superado.` });
      }
    }

    // 3. Buscar si existe regla de frecuencia ESPECÍFICA para este código y esta Obra Social
    const searchTarget = cleanCode(codigoPractica);
    const practica = await Practica.findOne({
      where: { 
        profesionalId: req.user.id,
        obraSocialId: obraSocialId,
        codigo: searchTarget // Note: assumes db stored codes are exact or we should use logic below
      }
    });

    // Como cleanCode se usa, mejor buscamos todas de la OS y filtramos
    const practicasOS = await Practica.findAll({
      where: { profesionalId: req.user.id, obraSocialId: obraSocialId }
    });
    
    let reglaEspecifica = practicasOS.find(p => cleanCode(p.codigo) === searchTarget);

    if (!reglaEspecifica || reglaEspecifica.mesesFrecuencia <= 0) {
      return res.json({ valido: true, motivo: 'Práctica sin restricción de frecuencia específica definida en esta Obra Social' });
    }

    const mesesFrecuencia = reglaEspecifica.mesesFrecuencia;
    const alcance = reglaEspecifica.alcance;
    const nombrePractica = reglaEspecifica.nombre;

    // 4. Filtrar el historial para ver si se hizo ESTA práctica
    const sesionesCoincidentes = sesionesOSActual.filter(s => {
    // Validar coincidencia en sesionesOSActual filtradas arriba
      let practicasEnSesion = [];
      if (s.practicasMultiples) {
        try {
          practicasEnSesion = JSON.parse(s.practicasMultiples);
        } catch (e) {}
      } else if (s.codigoPractica) {
        practicasEnSesion = [{
          codigoPractica: s.codigoPractica,
          piezaDental: s.piezaDental,
          caraDental: s.caraDental
        }];
      }

      // Vemos si alguna práctica en esta sesión coincide con el target
      return practicasEnSesion.some(p => p.codigoPractica && cleanCode(p.codigoPractica) === searchTarget);
    });

    if (!sesionesCoincidentes || sesionesCoincidentes.length === 0) {
      return res.json({ valido: true, motivo: 'Sin antecedentes de esta práctica con esta Obra Social' });
    }

    // 4. Filtrar según el alcance de la restricción
    let sesionConflictiva = null;

    if (alcance === 'paciente') {
      sesionConflictiva = sesionesCoincidentes[0];
    } else if (alcance === 'diente' || alcance === 'cara') {
      sesionConflictiva = sesionesCoincidentes.find(s => {
        let practicas = [];
        if (s.practicasMultiples) {
          try { practicas = JSON.parse(s.practicasMultiples); } catch(e) {}
        } else if (s.codigoPractica) {
          practicas = [{ codigoPractica: s.codigoPractica, piezaDental: s.piezaDental, caraDental: s.caraDental }];
        }
        
        return practicas.some(p => {
          if (cleanCode(p.codigoPractica) !== searchTarget) return false;
          if (alcance === 'diente') {
            return p.piezaDental && p.piezaDental.toString() === piezaDental?.toString();
          } else {
            return p.piezaDental && p.piezaDental.toString() === piezaDental?.toString() &&
                   p.caraDental && caraDental && p.caraDental.toLowerCase().includes(caraDental.toLowerCase());
          }
        });
      });
    }

    if (!sesionConflictiva) {
      return res.json({ valido: true, motivo: 'No hay precedentes en este alcance' });
    }

    // 5. Calcular tiempo transcurrido desde la última realización
    const fechaUltima = new Date(sesionConflictiva.createdAt);

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
        obraSocialNombre: obraSocialNombre,
        fechaUltima: fechaUltima.toISOString().split('T')[0],
        fechaHabilitacion: fechaHabilitacion.toISOString().split('T')[0],
        piezaDental: sesionConflictiva.piezaDental,
        caraDental: sesionConflictiva.caraDental,
        mensaje: `La Obra Social (${obraSocialNombre}) rechazará la práctica "${nombrePractica}" (${codigoPractica}) porque exige una frecuencia mínima de ${mesesFrecuencia} meses.`
      });
    }

    res.json({ valido: true, motivo: 'Cumple el período mínimo de refacturación' });
  } catch (error) {
    console.error('Error al validar frecuencia de práctica:', error);
    res.status(500).json({ mensaje: 'Error al ejecutar el motor de validación de frecuencia.', error: error.message, stack: error.stack });
  }
});

module.exports = router;
