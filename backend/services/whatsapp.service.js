const { Client, LocalAuth } = require('whatsapp-web.js');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.status = 'DISCONNECTED';
    this.qrCode = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;
    this.initialized = true;
    this.status = 'INITIALIZING';
    this.qrCode = null;

    console.log('Iniciando servicio de WhatsApp...');

    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: 'fichas-salud-client' }),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    this.client.on('qr', (qr) => {
      console.log('Código QR de WhatsApp generado. Escanea para conectar.');
      this.qrCode = qr;
      this.status = 'QR_READY';
    });

    this.client.on('ready', () => {
      console.log('Cliente de WhatsApp listo y conectado.');
      this.status = 'CONNECTED';
      this.qrCode = null;
    });

    this.client.on('authenticated', () => {
      console.log('Autenticado en WhatsApp correctamente.');
    });

    this.client.on('auth_failure', msg => {
      console.error('Error de autenticación en WhatsApp:', msg);
      this.status = 'DISCONNECTED';
      this.qrCode = null;
    });

    this.client.on('disconnected', (reason) => {
      console.log('Cliente de WhatsApp desconectado:', reason);
      this.status = 'DISCONNECTED';
      this.qrCode = null;
      // Reiniciar cliente si se desconecta
      this.initialized = false;
      setTimeout(() => this.initialize(), 5000);
    });

    this.client.initialize().catch(err => {
      console.error('Error al inicializar WhatsApp:', err);
      this.status = 'DISCONNECTED';
      this.initialized = false;
    });
  }

  getStatus() {
    return {
      status: this.status,
      qr: this.qrCode
    };
  }

  async logout() {
    if (this.client) {
      await this.client.logout();
      this.status = 'DISCONNECTED';
      this.qrCode = null;
      this.initialized = false;
      this.client = null;
    }
  }

  async restart() {
    if (this.client) {
      await this.client.destroy();
    }
    this.initialized = false;
    this.initialize();
  }

  async enviarMensaje(numero, mensaje) {
    if (this.status !== 'CONNECTED' || !this.client) {
      throw new Error('El cliente de WhatsApp no está conectado.');
    }

    // Formatear el número (añadir prefijo de país si no lo tiene)
    let formattedNumber = numero.replace(/\D/g, ''); // Remover todo lo que no sea dígito
    
    // Asumimos código de país Argentina (54) + 9 para celulares, pero esto debería
    // manejarse según los números de la base de datos.
    // Una lógica básica para números de Argentina de 10 dígitos (ej: 341 1234567):
    if (formattedNumber.length === 10) {
      formattedNumber = `549${formattedNumber}`;
    }

    const chatId = `${formattedNumber}@c.us`;

    try {
      await this.client.sendMessage(chatId, mensaje);
      return true;
    } catch (error) {
      console.error(`Error enviando WhatsApp a ${numero}:`, error);
      throw error;
    }
  }
}

// Exportamos un singleton
const whatsappService = new WhatsAppService();
module.exports = whatsappService;
