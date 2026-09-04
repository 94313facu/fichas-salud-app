const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const { iniciarCronRespaldos } = require('./config/cronBackup');
const whatsappService = require('./services/whatsapp.service');
const cronService = require('./services/cron.service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir la carpeta de uploads de manera estática
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas del API
const authRoutes = require('./routes/auth');
const pacientesRoutes = require('./routes/pacientes');
const obrasSocialesRoutes = require('./routes/obrasSociales');
const turnosRoutes = require('./routes/turnos');
const practicasRoutes = require('./routes/practicas');
const facturacionRoutes = require('./routes/facturacion');
const configuracionRoutes = require('./routes/configuracion');
const whatsappRoutes = require('./routes/whatsapp');
const notificacionesRoutes = require('./routes/notificaciones');

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/obras-sociales', obrasSocialesRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/practicas', practicasRoutes);
app.use('/api/facturacion', facturacionRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

// Ruta de diagnóstico simple
app.get('/health', (req, res) => {
  res.json({ estado: 'ok', fecha: new Date() });
});

// Iniciar servidor y sincronizar base de datos
app.listen(PORT, () => {
  console.log(`Servidor de la API corriendo en: http://localhost:${PORT}`);
});

sequelize
  .sync()
  .then(() => {
    console.log('Base de datos sincronizada con éxito.');
    // Inicializar tareas y servicios
    iniciarCronRespaldos();
    whatsappService.initialize();
    cronService.iniciar();
  })
  .catch((error) => {
    console.error('No se pudo conectar/sincronizar con la base de datos:', error);
  });
 
