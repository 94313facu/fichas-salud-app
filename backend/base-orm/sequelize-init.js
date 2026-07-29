const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
let sequelize;

if (databaseUrl) {
  console.log('Base de datos: Conectando a PostgreSQL...');
  // Configuración para PostgreSQL (Neon/Render requieren SSL rejectUnauthorized: false)
  const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: isLocalhost ? {} : {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  console.log('Base de datos: DATABASE_URL no encontrada. Usando SQLite local para desarrollo...');
  const sqlitePath = path.join(__dirname, '..', 'database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: false
  });
}

module.exports = sequelize;
