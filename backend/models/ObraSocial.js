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
  },
  limitePracticasMensual: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Límite máximo de prácticas por mes (global para la OS)'
  },
  limitePracticasAnual: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Límite máximo de prácticas por año (global para la OS)'
  }
}, {
  tableName: 'ObrasSociales',
  timestamps: true
});

module.exports = ObraSocial;
