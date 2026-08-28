const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Paciente, Sesion, ObraSocial, PlanObraSocial, PortalFacturacion, Turno, PacienteObraSocial } = require('../models');
const { uploadFile } = require('../config/cloudinary');
const authMiddleware = require('../middlewares/authMiddleware');

// Configuración de Multer en memoria (máximo 50MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Proteger todas las rutas de pacientes con el middleware de autenticación
router.use(authMiddleware);

// GET /api/pacientes
// Obtener todos los pacientes del profesional con su obra social asociada
router.get('/', async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      where: { profesionalId: req.user.id },
      include: [
        {
          model: ObraSocial,
          attributes: ['id', 'nombre'],
          include: [{ model: PortalFacturacion, attributes: ['id', 'nombre', 'url'] }]
        },
        {
          model: PlanObraSocial,
          attributes: ['id', 'nombre', 'codigo']
        },
        {
          model: PacienteObraSocial,
          as: 'ObrasSocialesAsociadas',
          include: [
            { model: ObraSocial, attributes: ['id', 'nombre'] },
            { model: PlanObraSocial, attributes: ['id', 'nombre', 'codigo'] }
          ]
        }
      ],
      order: [['nombre', 'ASC']]
    });
    res.json(pacientes);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ mensaje: 'Error al obtener el listado de pacientes.' });
  }
});

// POST /api/pacientes
// Registrar un nuevo paciente con todos sus datos clínicos y de contacto
router.post('/', async (req, res) => {
  try {
    const {
      numeroFicha,
      nombre,
      telefono,
      direccion,
      localidad,
      codigoPostal,
      emailContact,
      fechaNacimiento,
      edad,
      actividad,
      deriva,
      medicoClinico,
      medicoClinicoTelefono,
      numeroAfiliado,
      planObraSocial,
      servicioEmergencia,
      contactoEmergencia,
      aparatologia,
      afecciones,
      alergiasMedicamentos,
      propensoHemorragias,
      medicamentoHabitual,
      fuma,
      otrasEnfermedades,
      antecedentesHereditarios,
      embarazada,
      antecedentesEnfermedades,
      antecedentesHereditarias,
      antecedentesMedicacion,
      antecedentesAlergias,
      obraSocialId,
      planObraSocialId
    } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ mensaje: 'El nombre del paciente es obligatorio.' });
    }

    // Extraer array de obras sociales si viene
    const obrasSociales = req.body.obrasSociales || [];

    const nuevoPaciente = await Paciente.create({
      numeroFicha: numeroFicha ? numeroFicha.trim() : null,
      nombre: nombre.trim(),
      telefono: telefono ? telefono.trim() : null,
      direccion: direccion ? direccion.trim() : null,
      localidad: localidad ? localidad.trim() : null,
      codigoPostal: codigoPostal ? codigoPostal.trim() : null,
      emailContact: emailContact ? emailContact.trim() : null,
      fechaNacimiento: fechaNacimiento || null,
      edad: edad ? parseInt(edad) : null,
      actividad: actividad ? actividad.trim() : null,
      deriva: deriva ? deriva.trim() : null,
      medicoClinico: medicoClinico ? medicoClinico.trim() : null,
      medicoClinicoTelefono: medicoClinicoTelefono ? medicoClinicoTelefono.trim() : null,
      numeroAfiliado: numeroAfiliado ? numeroAfiliado.trim() : null,
      planObraSocial: planObraSocial ? planObraSocial.trim() : null,
      servicioEmergencia: servicioEmergencia ? servicioEmergencia.trim() : null,
      contactoEmergencia: contactoEmergencia ? contactoEmergencia.trim() : null,
      aparatologia: aparatologia ? aparatologia.trim() : null,
      afecciones: afecciones || {},
      alergiasMedicamentos: alergiasMedicamentos ? alergiasMedicamentos.trim() : null,
      propensoHemorragias: !!propensoHemorragias,
      medicamentoHabitual: medicamentoHabitual ? medicamentoHabitual.trim() : null,
      fuma: !!fuma,
      otrasEnfermedades: otrasEnfermedades ? otrasEnfermedades.trim() : null,
      antecedentesHereditarios: antecedentesHereditarios ? antecedentesHereditarios.trim() : null,
      embarazada: !!embarazada,
      antecedentesEnfermedades: antecedentesEnfermedades ? antecedentesEnfermedades.trim() : null,
      antecedentesHereditarias: antecedentesHereditarias ? antecedentesHereditarias.trim() : null,
      antecedentesMedicacion: antecedentesMedicacion ? antecedentesMedicacion.trim() : null,
      antecedentesAlergias: antecedentesAlergias ? antecedentesAlergias.trim() : null,
      obraSocialId: obraSocialId || null,
      planObraSocialId: planObraSocialId || null,
      profesionalId: req.user.id
    });

    // Crear registros de obras sociales asociadas (multi-OS)
    if (obrasSociales.length > 0) {
      for (const os of obrasSociales) {
        if (os.obraSocialId) {
          await PacienteObraSocial.create({
            pacienteId: nuevoPaciente.id,
            obraSocialId: parseInt(os.obraSocialId),
            planObraSocialId: os.planObraSocialId ? parseInt(os.planObraSocialId) : null,
            numeroAfiliado: os.numeroAfiliado ? os.numeroAfiliado.trim() : null,
            activa: true
          });
        }
      }
    } else if (obraSocialId) {
      // Compatibilidad: si enviaron la OS individual legacy, crear también el registro
      await PacienteObraSocial.create({
        pacienteId: nuevoPaciente.id,
        obraSocialId: parseInt(obraSocialId),
        planObraSocialId: planObraSocialId ? parseInt(planObraSocialId) : null,
        numeroAfiliado: numeroAfiliado ? numeroAfiliado.trim() : null,
        activa: true
      });
    }

    res.status(201).json(nuevoPaciente);
  } catch (error) {
    console.error('Error al crear paciente:', error);
    res.status(500).json({ mensaje: 'Error al registrar el paciente.' });
  }
});

// GET /api/pacientes/exportar
// Exportar todos los datos (pacientes, sesiones, tratamientos y obra social) del profesional
router.get('/exportar', async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      where: { profesionalId: req.user.id },
      include: [
        {
          model: Sesion,
          required: false
        },
        {
          model: ObraSocial,
          attributes: ['nombre'],
          required: false
        }
      ],
      order: [['nombre', 'ASC']]
    });

    // Ordenar sesiones de más reciente a más antigua
    const listadoExportado = pacientes.map(p => {
      const pJson = p.toJSON();
      if (pJson.Sesions) {
        pJson.Sesions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return pJson;
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=respaldo_pacientes_${Date.now()}.json`);
    res.json(listadoExportado);
  } catch (error) {
    console.error('Error al exportar base de datos del profesional:', error);
    res.status(500).json({ mensaje: 'Error al exportar la copia de seguridad de tus pacientes.' });
  }
});

// GET /api/pacientes/:id
// Obtener la ficha detallada con antecedentes, obra social, tratamientos y sesiones vinculadas
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Paciente.findOne({
      where: { 
        id,
        profesionalId: req.user.id 
      },
      include: [
        {
          model: Sesion,
          required: false,
          include: [
            { model: ObraSocial, as: 'ObraSocialSesion', attributes: ['id', 'nombre'], required: false },
            { model: PlanObraSocial, as: 'PlanObraSocialSesion', attributes: ['id', 'nombre', 'codigo'], required: false }
          ]
        },
        {
          model: ObraSocial,
          attributes: ['id', 'nombre'],
          required: false,
          include: [{ model: PortalFacturacion, attributes: ['id', 'nombre', 'url'], required: false }]
        },
        {
          model: PlanObraSocial,
          attributes: ['id', 'nombre', 'codigo'],
          required: false
        },
        {
          model: PacienteObraSocial,
          as: 'ObrasSocialesAsociadas',
          required: false,
          include: [
            { model: ObraSocial, attributes: ['id', 'nombre'], include: [{ model: PortalFacturacion, attributes: ['id', 'nombre', 'url'], required: false }] },
            { model: PlanObraSocial, attributes: ['id', 'nombre', 'codigo'] }
          ]
        },
        {
          model: Turno,
          required: false
        }
      ]
    });

    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado o no tienes permisos para acceder.' });
    }

    const rawPaciente = paciente.toJSON();
    if (rawPaciente.Sesions) {
      rawPaciente.Sesions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (rawPaciente.Turnos) {
      rawPaciente.Turnos.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
    }

    res.json(rawPaciente);
  } catch (error) {
    console.error('Error al obtener ficha del paciente:', error);
    res.status(500).json({ mensaje: 'Error al obtener la ficha del paciente.' });
  }
});

// PUT /api/pacientes/:id
// PUT /api/pacientes/:id/odontograma
// Actualizar el mapa de odontograma del paciente
router.put('/:id/odontograma', async (req, res) => {
  try {
    const { id } = req.params;
    const { odontograma } = req.body;

    const paciente = await Paciente.findOne({
      where: { id, profesionalId: req.user.id }
    });

    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado.' });
    }

    await paciente.update({
      odontograma: odontograma || {}
    });

    res.json({ mensaje: 'Odontograma actualizado con éxito.', odontograma: paciente.odontograma });
  } catch (error) {
    console.error('Error al actualizar odontograma:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el odontograma.' });
  }
});

// Modificar/Editar los datos de un paciente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numeroFicha,
      nombre,
      telefono,
      direccion,
      localidad,
      codigoPostal,
      emailContact,
      fechaNacimiento,
      edad,
      actividad,
      deriva,
      medicoClinico,
      medicoClinicoTelefono,
      numeroAfiliado,
      planObraSocial,
      servicioEmergencia,
      contactoEmergencia,
      aparatologia,
      afecciones,
      alergiasMedicamentos,
      propensoHemorragias,
      medicamentoHabitual,
      fuma,
      otrasEnfermedades,
      antecedentesHereditarios,
      embarazada,
      antecedentesEnfermedades,
      antecedentesHereditarias,
      antecedentesMedicacion,
      antecedentesAlergias,
      obraSocialId,
      planObraSocialId
    } = req.body;

    const paciente = await Paciente.findOne({
      where: { id, profesionalId: req.user.id }
    });

    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado o no tienes permisos para editarlo.' });
    }

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ mensaje: 'El nombre del paciente es obligatorio.' });
    }

    // Extraer array de obras sociales si viene
    const obrasSociales = req.body.obrasSociales;

    // Actualizar datos
    await paciente.update({
      numeroFicha: numeroFicha !== undefined ? (numeroFicha ? numeroFicha.trim() : null) : paciente.numeroFicha,
      nombre: nombre.trim(),
      telefono: telefono !== undefined ? (telefono ? telefono.trim() : null) : paciente.telefono,
      direccion: direccion !== undefined ? (direccion ? direccion.trim() : null) : paciente.direccion,
      localidad: localidad !== undefined ? (localidad ? localidad.trim() : null) : paciente.localidad,
      codigoPostal: codigoPostal !== undefined ? (codigoPostal ? codigoPostal.trim() : null) : paciente.codigoPostal,
      emailContact: emailContact !== undefined ? (emailContact ? emailContact.trim() : null) : paciente.emailContact,
      fechaNacimiento: fechaNacimiento !== undefined ? (fechaNacimiento || null) : paciente.fechaNacimiento,
      edad: edad !== undefined ? (edad ? parseInt(edad) : null) : paciente.edad,
      actividad: actividad !== undefined ? (actividad ? actividad.trim() : null) : paciente.actividad,
      deriva: deriva !== undefined ? (deriva ? deriva.trim() : null) : paciente.deriva,
      medicoClinico: medicoClinico !== undefined ? (medicoClinico ? medicoClinico.trim() : null) : paciente.medicoClinico,
      medicoClinicoTelefono: medicoClinicoTelefono !== undefined ? (medicoClinicoTelefono ? medicoClinicoTelefono.trim() : null) : paciente.medicoClinicoTelefono,
      numeroAfiliado: numeroAfiliado !== undefined ? (numeroAfiliado ? numeroAfiliado.trim() : null) : paciente.numeroAfiliado,
      planObraSocial: planObraSocial !== undefined ? (planObraSocial ? planObraSocial.trim() : null) : paciente.planObraSocial,
      servicioEmergencia: servicioEmergencia !== undefined ? (servicioEmergencia ? servicioEmergencia.trim() : null) : paciente.servicioEmergencia,
      contactoEmergencia: contactoEmergencia !== undefined ? (contactoEmergencia ? contactoEmergencia.trim() : null) : paciente.contactoEmergencia,
      aparatologia: aparatologia !== undefined ? (aparatologia ? aparatologia.trim() : null) : paciente.aparatologia,
      afecciones: afecciones !== undefined ? (afecciones || {}) : paciente.afecciones,
      alergiasMedicamentos: alergiasMedicamentos !== undefined ? (alergiasMedicamentos ? alergiasMedicamentos.trim() : null) : paciente.alergiasMedicamentos,
      propensoHemorragias: propensoHemorragias !== undefined ? !!propensoHemorragias : paciente.propensoHemorragias,
      medicamentoHabitual: medicamentoHabitual !== undefined ? (medicamentoHabitual ? medicamentoHabitual.trim() : null) : paciente.medicamentoHabitual,
      fuma: fuma !== undefined ? !!fuma : paciente.fuma,
      otrasEnfermedades: otrasEnfermedades !== undefined ? (otrasEnfermedades ? otrasEnfermedades.trim() : null) : paciente.otrasEnfermedades,
      antecedentesHereditarios: antecedentesHereditarios !== undefined ? (antecedentesHereditarios ? antecedentesHereditarios.trim() : null) : paciente.antecedentesHereditarios,
      embarazada: embarazada !== undefined ? !!embarazada : paciente.embarazada,
      antecedentesEnfermedades: antecedentesEnfermedades !== undefined ? (antecedentesEnfermedades ? antecedentesEnfermedades.trim() : null) : paciente.antecedentesEnfermedades,
      antecedentesHereditarias: antecedentesHereditarias !== undefined ? (antecedentesHereditarias ? antecedentesHereditarias.trim() : null) : paciente.antecedentesHereditarias,
      antecedentesMedicacion: antecedentesMedicacion !== undefined ? (antecedentesMedicacion ? antecedentesMedicacion.trim() : null) : paciente.antecedentesMedicacion,
      antecedentesAlergias: antecedentesAlergias !== undefined ? (antecedentesAlergias ? antecedentesAlergias.trim() : null) : paciente.antecedentesAlergias,
      obraSocialId: obraSocialId !== undefined ? (obraSocialId || null) : paciente.obraSocialId,
      planObraSocialId: planObraSocialId !== undefined ? (planObraSocialId || null) : paciente.planObraSocialId
    });

    // Sincronizar obras sociales asociadas (multi-OS)
    if (obrasSociales !== undefined) {
      // Eliminar asociaciones anteriores y reemplazar
      await PacienteObraSocial.destroy({ where: { pacienteId: id } });

      if (Array.isArray(obrasSociales)) {
        for (const os of obrasSociales) {
          if (os.obraSocialId) {
            await PacienteObraSocial.create({
              pacienteId: parseInt(id),
              obraSocialId: parseInt(os.obraSocialId),
              planObraSocialId: os.planObraSocialId ? parseInt(os.planObraSocialId) : null,
              numeroAfiliado: os.numeroAfiliado ? os.numeroAfiliado.trim() : null,
              activa: os.activa !== undefined ? os.activa : true
            });
          }
        }
      }
    }

    // Devolver el paciente actualizado incluyendo obras sociales
    const pacienteActualizado = await Paciente.findOne({
      where: { id },
      include: [
        { model: ObraSocial, attributes: ['id', 'nombre'], include: [{ model: PortalFacturacion, attributes: ['id', 'nombre', 'url'] }] },
        { model: PlanObraSocial, attributes: ['id', 'nombre', 'codigo'] },
        {
          model: PacienteObraSocial,
          as: 'ObrasSocialesAsociadas',
          include: [
            { model: ObraSocial, attributes: ['id', 'nombre'] },
            { model: PlanObraSocial, attributes: ['id', 'nombre', 'codigo'] }
          ]
        }
      ]
    });

    res.json(pacienteActualizado);
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ mensaje: 'Error al actualizar la ficha del paciente.' });
  }
});

// (Rutas de tratamientos eliminadas)
// POST /api/pacientes/:id/sesiones
// Registrar una nueva evolución
router.post('/:id/sesiones', upload.single('archivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notas, presupuesto, pago, codigoPractica, piezaDental, caraDental, modalidadCobro, obraSocialId: sesionObraSocialId, planObraSocialId: sesionPlanObraSocialId } = req.body;

    // Verificar paciente
    const paciente = await Paciente.findOne({
      where: { id, profesionalId: req.user.id }
    });

    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado o acceso no autorizado.' });
    }

    let archivoUrl = null;
    let archivoTipo = null;

    if (req.file) {
      try {
        const uploadResult = await uploadFile(req.file, paciente.id, req.user.id);
        archivoUrl = uploadResult.url;
        archivoTipo = uploadResult.tipo;
      } catch (uploadError) {
        console.error('Error al subir archivo:', uploadError);
        return res.status(500).json({ mensaje: 'Error al subir el archivo de progreso.' });
      }
    }

    const pto = parseFloat(presupuesto) || 0.00;
    const pg = parseFloat(pago) || 0.00;
    const sld = pto - pg;

    // Procesar practicas si vienen múltiples
    let practicasJSON = null;
    let legacyCodigo = null;
    let legacyPieza = null;
    let legacyCara = null;

    if (req.body.practicas) {
      try {
        const parsedPracticas = typeof req.body.practicas === 'string' ? JSON.parse(req.body.practicas) : req.body.practicas;
        if (Array.isArray(parsedPracticas) && parsedPracticas.length > 0) {
          practicasJSON = JSON.stringify(parsedPracticas);
          // Fallback legacy (guardamos la primera práctica en los campos individuales)
          legacyCodigo = parsedPracticas[0].codigoPractica || null;
          legacyPieza = parsedPracticas[0].piezaDental || null;
          legacyCara = parsedPracticas[0].caraDental || null;
        }
      } catch (e) {
        console.warn('Error al parsear practicas:', e);
      }
    }

    const nuevaSesion = await Sesion.create({
      notas: notas ? notas.trim() : null,
      archivoUrl,
      archivoTipo,
      presupuesto: pto,
      pago: pg,
      saldo: sld,
      codigoPractica: legacyCodigo || (codigoPractica ? codigoPractica.trim() : null),
      piezaDental: legacyPieza || (piezaDental ? piezaDental.trim() : null),
      caraDental: legacyCara || (caraDental ? caraDental.trim() : null),
      practicasMultiples: practicasJSON,
      modalidadCobro: modalidadCobro || 'obra_social',
      obraSocialId: sesionObraSocialId ? parseInt(sesionObraSocialId) : null,
      planObraSocialId: sesionPlanObraSocialId ? parseInt(sesionPlanObraSocialId) : null,
      pacienteId: paciente.id
    });

    res.status(201).json(nuevaSesion);
  } catch (error) {
    console.error('Error al crear sesión:', error);
    res.status(500).json({ mensaje: 'Error al registrar la sesión.' });
  }
});

// PUT /api/pacientes/:pacienteId/sesiones/:id
// Editar una evolución
router.put('/:pacienteId/sesiones/:id', upload.single('archivo'), async (req, res) => {
  try {
    const { pacienteId, id } = req.params;
    const { notas, presupuesto, pago } = req.body;

    // Verificar paciente
    const paciente = await Paciente.findOne({
      where: { id: pacienteId, profesionalId: req.user.id }
    });

    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado o acceso no autorizado.' });
    }

    // Verificar sesión
    const sesion = await Sesion.findOne({
      where: { id, pacienteId: paciente.id }
    });

    if (!sesion) {
      return res.status(404).json({ mensaje: 'Sesión no encontrada.' });
    }

    let archivoUrl = sesion.archivoUrl;
    let archivoTipo = sesion.archivoTipo;

    if (req.file) {
      try {
        const uploadResult = await uploadFile(req.file, paciente.id, req.user.id);
        archivoUrl = uploadResult.url;
        archivoTipo = uploadResult.tipo;
      } catch (uploadError) {
        console.error('Error al subir nuevo archivo en edición:', uploadError);
        return res.status(500).json({ mensaje: 'Error al subir el nuevo archivo de progreso.' });
      }
    }

    const pto = parseFloat(presupuesto) || 0.00;
    const pg = parseFloat(pago) || 0.00;
    const sld = pto - pg;

    await sesion.update({
      notas: notas !== undefined ? notas.trim() : sesion.notas,
      archivoUrl,
      archivoTipo,
      presupuesto: pto,
      pago: pg,
      saldo: sld
    });

    res.json(sesion);
  } catch (error) {
    console.error('Error al editar sesión:', error);
    res.status(500).json({ mensaje: 'Error al actualizar los datos de la sesión.' });
  }
});

// POST /api/pacientes/importar
// Restaurar copia de seguridad en formato JSON
router.post('/importar', upload.single('archivo'), async (req, res) => {
  try {
    let listadoImportado = null;

    if (req.file) {
      const contenidoStr = req.file.buffer.toString('utf-8');
      listadoImportado = JSON.parse(contenidoStr);
    } else if (req.body && Array.isArray(req.body)) {
      listadoImportado = req.body;
    } else if (req.body && req.body.pacientes && Array.isArray(req.body.pacientes)) {
      listadoImportado = req.body.pacientes;
    }

    if (!listadoImportado || !Array.isArray(listadoImportado)) {
      return res.status(400).json({ mensaje: 'El archivo de respaldo no es un JSON válido o no contiene un listado de pacientes.' });
    }

    const profesionalId = req.user.id;

    // 1. Eliminar turnos y pacientes existentes del profesional
    await Turno.destroy({ where: { profesionalId } });
    const pacientesExistentes = await Paciente.findAll({ where: { profesionalId } });
    for (const p of pacientesExistentes) {
      await p.destroy();
    }

    let cantPacientes = 0;
    let cantTratamientos = 0;
    let cantSesiones = 0;

    // 2. Recorrer el arreglo importado e insertar en orden
    for (const pData of listadoImportado) {
      if (!pData.nombre) continue;

      // a) Resolver Obra Social si existe
      let obraSocialId = null;
      if (pData.ObraSocial && pData.ObraSocial.nombre) {
        const [obra] = await ObraSocial.findOrCreate({
          where: {
            nombre: pData.ObraSocial.nombre.trim(),
            profesionalId
          }
        });
        obraSocialId = obra.id;
      }

      // b) Crear Paciente
      const nuevoPaciente = await Paciente.create({
        numeroFicha: pData.numeroFicha || null,
        nombre: pData.nombre.trim(),
        telefono: pData.telefono || null,
        direccion: pData.direccion || null,
        localidad: pData.localidad || null,
        codigoPostal: pData.codigoPostal || null,
        emailContact: pData.emailContact || null,
        fechaNacimiento: pData.fechaNacimiento || null,
        edad: pData.edad || null,
        actividad: pData.actividad || null,
        deriva: pData.deriva || null,
        medicoClinico: pData.medicoClinico || null,
        medicoClinicoTelefono: pData.medicoClinicoTelefono || null,
        numeroAfiliado: pData.numeroAfiliado || null,
        planObraSocial: pData.planObraSocial || null,
        servicioEmergencia: pData.servicioEmergencia || null,
        contactoEmergencia: pData.contactoEmergencia || null,
        aparatologia: pData.aparatologia || null,
        afecciones: pData.afecciones || {},
        alergiasMedicamentos: pData.alergiasMedicamentos || null,
        propensoHemorragias: !!pData.propensoHemorragias,
        medicamentoHabitual: pData.medicamentoHabitual || null,
        fuma: !!pData.fuma,
        otrasEnfermedades: pData.otrasEnfermedades || null,
        antecedentesHereditarios: pData.antecedentesHereditarios || null,
        embarazada: !!pData.embarazada,
        antecedentesEnfermedades: pData.antecedentesEnfermedades || null,
        antecedentesHereditarias: pData.antecedentesHereditarias || null,
        antecedentesMedicacion: pData.antecedentesMedicacion || null,
        antecedentesAlergias: pData.antecedentesAlergias || null,
        obraSocialId,
        profesionalId
      });
      cantPacientes++;

      // c) Crear Tratamientos
      const mapaTratamientos = new Map();

      if (pData.Tratamientos && Array.isArray(pData.Tratamientos)) {
        for (const tData of pData.Tratamientos) {
          if (!tData.nombre) continue;
          const nuevoT = await Tratamiento.create({
            nombre: tData.nombre.trim(),
            pacienteId: nuevoPaciente.id
          });
          mapaTratamientos.set(nuevoT.nombre.toLowerCase(), nuevoT.id);
          cantTratamientos++;
        }
      }

      // d) Crear Sesiones
      if (pData.Sesions && Array.isArray(pData.Sesions)) {
        for (const sData of pData.Sesions) {
          let tId = null;
          
          if (sData.Tratamiento && sData.Tratamiento.nombre) {
            tId = mapaTratamientos.get(sData.Tratamiento.nombre.trim().toLowerCase());
          }
          
          if (!tId) {
            if (mapaTratamientos.size > 0) {
              tId = mapaTratamientos.values().next().value;
            } else {
              const defaultT = await Tratamiento.create({
                nombre: 'General',
                pacienteId: nuevoPaciente.id
              });
              tId = defaultT.id;
              mapaTratamientos.set('general', defaultT.id);
              cantTratamientos++;
            }
          }

          const pto = parseFloat(sData.presupuesto) || 0;
          const pg = parseFloat(sData.pago) || 0;
          const sld = pto - pg;

          await Sesion.create({
            notas: sData.notas || null,
            archivoUrl: sData.archivoUrl || null,
            archivoTipo: sData.archivoTipo || null,
            presupuesto: pto,
            pago: pg,
            saldo: sld,
            pacienteId: nuevoPaciente.id,
            tratamientoId: tId,
            createdAt: sData.createdAt ? new Date(sData.createdAt) : new Date()
          });
          cantSesiones++;
        }
      }
    }

    res.json({
      mensaje: 'Base de datos restaurada con éxito.',
      cantPacientes,
      cantTratamientos,
      cantSesiones
    });

  } catch (error) {
    console.error('Error al importar copia de seguridad:', error);
    res.status(500).json({ mensaje: 'Error al procesar y restaurar la copia de seguridad.' });
  }
});

module.exports = router;
