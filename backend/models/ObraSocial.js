const { DataTypes } = require('sequelize');
const sequelize = require('../base-orm/sequelize-init');

const ObraSocial = sequelize.define('ObraSocial', {
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
    }
  },
  activa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Permite pausar/activar la obra social sin eliminarla'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas internas del profesional sobre el convenio'
  }
}, {
  tableName: 'ObrasSociales',
  timestamps: true
});

module.exports = ObraSocial;
