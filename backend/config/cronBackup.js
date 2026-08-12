const cron = require('node-cron');
const { Profesional } = require('../models');
const { Op } = require('sequelize');
const { subirRespaldoDrive } = require('./googleServices');

/**
 * Inicializa la tarea programada (cronjob) para respaldos diarios automáticos
 */
function iniciarCronRespaldos() {
  // Ejecutar todos los días a las 02:00 AM ('0 2 * * *')
  cron.schedule('0 2 * * *', async () => {
    console.log('--- [CRON] Iniciando Respaldo Diario Automático en Google Drive ---');

    try {
      // Buscar profesionales con cuenta de Google vinculada (con refresh token)
      const profesionales = await Profesional.findAll({
        where: {
          googleRefreshToken: {
            [Op.ne]: null
          }
        }
      });

      console.log(`[CRON] Se encontraron ${profesionales.length} profesional(es) con cuenta de Google vinculada.`);

      for (const prof of profesionales) {
        console.log(`[CRON] Procesando respaldo diario para: ${prof.nombre} (${prof.username})...`);
        const resultado = await subirRespaldoDrive(prof.id);
        if (resultado.success) {
          console.log(`[CRON] ✓ Respaldo exitoso para ${prof.nombre}. Link: ${resultado.webViewLink}`);
        } else {
          console.error(`[CRON] ❌ Error en respaldo de ${prof.nombre}:`, resultado.error || resultado.mensaje);
        }
      }

      console.log('--- [CRON] Respaldo Diario Automático Finalizado ---');
    } catch (error) {
      console.error('[CRON] Error general en tarea programada de respaldo:', error);
    }
  });

  console.log('Task Scheduler (node-cron): Servicio de respaldos diarios automáticos inicializado.');
}

module.exports = { iniciarCronRespaldos };
