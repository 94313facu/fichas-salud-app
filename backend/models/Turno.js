const { DataTypes } = require('sequelize');
const sequelize = require('../base-orm/sequelize-init');

const Turno = sequelize.define('Turno', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fechaHora: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duracionMinutos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Pendiente',
    validate: {
      isIn: [['Pendiente', 'Confirmado', 'Atendido', 'Cancelado']]
    }
  },
  googleEventId: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // Campos de facturación odontológica
  codigoPractica: {
    type: DataTypes.STRING,
    allowNull: true
  },
  piezaDental: {
    type: DataTypes.STRING,
    allowNull: true
  },
  caraDental: {
    type: DataTypes.STRING,
    allowNull: true
  },
  modalidadCobro: {
    type: DataTypes.ENUM('obra_social', 'particular'),
    allowNull: false,
    defaultValue: 'obra_social'
  }
}, {
  tableName: 'Turnos',
  timestamps: true
});

module.exports = Turno;
