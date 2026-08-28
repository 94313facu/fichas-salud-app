const { DataTypes } = require('sequelize');
const sequelize = require('../base-orm/sequelize-init');

const PortalFacturacion = sequelize.define('PortalFacturacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
    comment: 'Nombre del portal (ej. FOPC, OSDE Extranet, Traditum)'
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL de acceso directo al portal de facturación'
  }
}, {
  tableName: 'PortalesFacturacion',
  timestamps: true
});

module.exports = PortalFacturacion;
