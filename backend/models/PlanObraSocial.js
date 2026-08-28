const { DataTypes } = require('sequelize');
const sequelize = require('../base-orm/sequelize-init');

const PlanObraSocial = sequelize.define('PlanObraSocial', {
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
    comment: 'Nombre del plan (ej. Plan 210, Plan Familiar, PMO)'
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Código interno del plan en la Obra Social'
  }
}, {
  tableName: 'PlanesObraSocial',
  timestamps: true
});

module.exports = PlanObraSocial;
