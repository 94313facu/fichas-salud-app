const { DataTypes } = require('sequelize');
const sequelize = require('../base-orm/sequelize-init');

const PacienteObraSocial = sequelize.define('PacienteObraSocial', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  obraSocialId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  planObraSocialId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  numeroAfiliado: {
    type: DataTypes.STRING,
    allowNull: true
  },
  activa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Permite desactivar una cobertura sin eliminar historial'
  }
}, {
  tableName: 'PacientesObrasSociales',
  timestamps: true
});

module.exports = PacienteObraSocial;
