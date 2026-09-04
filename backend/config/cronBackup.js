const cron = require('node-cron');
const { Profesional } = require('../models');
const { Op } = require('sequelize');
const { subirRespaldoDrive } = require('./googleServices');
const notificacionesService = require('../services/notificaciones.service');

/**
 * Inicializa la tarea programada (cronjob) para respaldos diarios automáticos
 */
function iniciarCronRespaldos() {
  // Ejecutar cada minuto para evaluar si es la hora de envío de algún profesional
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const horaActualStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

      // Buscar profesionales con cuenta de Google vinculada
      const profesionales = await Profesional.findAll({
        where: {
          googleRefreshToken: {
            [Op.ne]: null
          }
        }
      });

      for (const prof of profesionales) {
        if (!prof.configuracionRespaldo) continue;

        const config = prof.configuracionRespaldo;
        
        if (!config.activo || config.horaEnvio !== horaActualStr) {
          continue;
        }

        console.log(`[CRON] Procesando respaldo diario automático para: ${prof.nombre} (${prof.username})...`);
        const resultado = await subirRespaldoDrive(prof.id);
        
        if (resultado.success) {
          console.log(`[CRON] ✓ Respaldo exitoso para ${prof.nombre}.`);
          // Emitir notificación SSE
          notificacionesService.enviarNotificacion(prof.id, {
            tipo: 'EXITO',
            titulo: 'Respaldo Automático',
            mensaje: 'Copia de seguridad subida a Google Drive exitosamente.'
          });
        } else {
          console.error(`[CRON] ❌ Error en respaldo de ${prof.nombre}:`, resultado.error || resultado.mensaje);
          notificacionesService.enviarNotificacion(prof.id, {
            tipo: 'ERROR',
            titulo: 'Error en Respaldo',
            mensaje: 'No se pudo realizar el respaldo en Google Drive.'
          });
        }
      }

    } catch (error) {
      console.error('[CRON] Error general en tarea programada de respaldo:', error);
    }
  });

  console.log('Task Scheduler (node-cron): Servicio de respaldos diarios automáticos inicializado.');
}

module.exports = { iniciarCronRespaldos };
