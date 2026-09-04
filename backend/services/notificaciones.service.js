class NotificacionesService {
  constructor() {
    this.clients = new Map(); // profesionalId -> Response object
  }

  addClient(profesionalId, res) {
    this.clients.set(profesionalId, res);
    
    // Si la conexión se cierra, remover al cliente
    res.on('close', () => {
      this.clients.delete(profesionalId);
    });
  }

  enviarNotificacion(profesionalId, data) {
    const res = this.clients.get(profesionalId);
    if (res) {
      // SSE format: data: JSON_STRING\n\n
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }
}

const notificacionesService = new NotificacionesService();
module.exports = notificacionesService;
