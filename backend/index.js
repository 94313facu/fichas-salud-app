const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const { iniciarCronRespaldos } = require('./config/cronBackup');
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

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/obras-sociales', obrasSocialesRoutes);
app.use('/api/turnos', turnosRoutes);

// Ruta de diagnóstico simple
app.get('/health', (req, res) => {
  res.json({ estado: 'ok', fecha: new Date() });
});

// Sincronizar base de datos e iniciar servidor
sequelize
  .sync({ force: false })
  .then(() => {
    console.log('Base de datos sincronizada con éxito.');
    
    // Inicializar tarea cron para respaldos diarios en Google Drive
    iniciarCronRespaldos();

    app.listen(PORT, () => {
      console.log(`Servidor de la API corriendo en: http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo conectar/sincronizar con la base de datos:', error);
    process.exit(1);
  });
