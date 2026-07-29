const { DataTypes } = require('sequelize');
const sequelize = require('../base-orm/sequelize-init');

const Sesion = sequelize.define('Sesion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  archivoUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  archivoTipo: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['imagen', 'video']]
    }
  },
  presupuesto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  pago: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  saldo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  }
}, {
  tableName: 'Sesiones',
  timestamps: true // Habilita automáticamente createdAt y updatedAt
});

module.exports = Sesion;
