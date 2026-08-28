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
  },
  estadoFacturacion: {
    type: DataTypes.ENUM('pendiente', 'facturado', 'particular', 'debitado'),
    allowNull: false,
    defaultValue: 'pendiente',
    comment: 'Estado del flujo de facturación externa'
  },
  practicasMultiples: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON con el listado de prácticas realizadas (código, nombre, pieza, cara)'
  },
  obraSocialId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK a la obra social con la que se facturó esta sesión'
  },
  planObraSocialId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK al plan de la obra social usada en esta sesión'
  }
}, {
  tableName: 'Sesiones',
  timestamps: true // Habilita automáticamente createdAt y updatedAt
});

module.exports = Sesion;
