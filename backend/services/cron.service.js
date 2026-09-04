const cron = require('node-cron');
const { Op } = require('sequelize');
const { Turno, Profesional, Paciente } = require('../models');
const whatsappService = require('./whatsapp.service');
const notificacionesService = require('./notificaciones.service');

class CronService {
  constructor() {
    this.cronJob = null;
  }

  iniciar() {
    console.log('Iniciando servicio de Cron para Recordatorios de WhatsApp...');
    
    // Correr cada minuto para evaluar si es la hora de envío de algún profesional
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.procesarRecordatorios();
    });
  }

  async procesarRecordatorios() {
    try {
      const now = new Date();
      // Formatear hora actual a HH:mm
      const horaActualStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      // Obtener todos los profesionales
      const profesionales = await Profesional.findAll();

      for (const profesional of profesionales) {
        if (!profesional.configuracionWhatsApp) continue;

        const config = profesional.configuracionWhatsApp;
        
        // Si no está activo o no es la hora configurada, pasamos al siguiente
        if (!config.activo || config.horaEnvio !== horaActualStr) {
          continue;
        }

        // Si es la hora, verificar si WhatsApp está conectado
        if (whatsappService.getStatus().status !== 'CONNECTED') {
          console.warn(`[Cron] Es la hora de enviar recordatorios para ${profesional.nombre}, pero WhatsApp no está conectado.`);
          continue;
        }

        await this.enviarRecordatoriosParaProfesional(profesional, config);
      }

    } catch (error) {
      console.error('Error en proceso cron de recordatorios:', error);
    }
  }

  async enviarRecordatoriosParaProfesional(profesional, config) {
    console.log(`[Cron] Procesando recordatorios para ${profesional.nombre}...`);
    
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    mañana.setHours(0, 0, 0, 0);

    const pasadoMañana = new Date(mañana);
    pasadoMañana.setDate(pasadoMañana.getDate() + 1);

    try {
      // Buscar turnos de mañana
      const turnos = await Turno.findAll({
        where: {
          fechaHora: {
            [Op.gte]: mañana,
            [Op.lt]: pasadoMañana
          },
          estado: 'Pendiente', // Solo a los que aún no confirmaron o están pendientes
          recordatorioEnviado: false
        },
        include: [{
          model: Paciente,
          where: {
            profesionalId: profesional.id
          }
        }]
      });

      console.log(`[Cron] Se encontraron ${turnos.length} turnos para recordar.`);

      for (const turno of turnos) {
        const paciente = turno.Paciente || turno.paciente;
        
        if (!paciente.telefono) {
          console.log(`[Cron] Turno ${turno.id}: Paciente ${paciente.nombre} no tiene teléfono.`);
          continue;
        }

        const fechaTurno = new Date(turno.fechaHora);
        const fechaHoraStr = fechaTurno.toLocaleString('es-AR', {
          weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
        });

        // Reemplazar variables en la plantilla
        let mensaje = config.mensajePlantilla;
        mensaje = mensaje.replace(/{nombrePaciente}/g, paciente.nombre);
        mensaje = mensaje.replace(/{fechaHora}/g, fechaHoraStr);

        try {
          await whatsappService.enviarMensaje(paciente.telefono, mensaje);
          
          // Marcar como enviado
          turno.recordatorioEnviado = true;
          await turno.save();
          console.log(`[Cron] Recordatorio enviado a ${paciente.nombre} (${paciente.telefono})`);
          
          // Emitir notificación SSE
          notificacionesService.enviarNotificacion(profesional.id, {
            tipo: 'EXITO',
            titulo: 'WhatsApp Automático',
            mensaje: `Recordatorio enviado a ${paciente.nombre}.`
          });
          
          // Pequeño delay para no saturar WhatsApp y evitar ban
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`[Cron] Falló el envío al paciente ${paciente.nombre}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`[Cron] Error obteniendo turnos para ${profesional.nombre}:`, error);
    }
  }
}

const cronService = new CronService();
module.exports = cronService;
