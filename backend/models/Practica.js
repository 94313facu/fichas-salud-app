const { DataTypes } = require('sequelize');
const sequelize = require('../base-orm/sequelize-init');

const Practica = sequelize.define('Practica', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alcance: {
    type: DataTypes.ENUM('paciente', 'diente', 'cara'),
    allowNull: false,
    defaultValue: 'paciente'
  },
  mesesFrecuencia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0 // 0 = sin restricción de tiempo
  }
}, {
  tableName: 'Practicas',
  timestamps: true
});

module.exports = Practica;
