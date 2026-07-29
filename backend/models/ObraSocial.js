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
  }
}, {
  tableName: 'ObrasSociales',
  timestamps: true
});

module.exports = ObraSocial;
