const { DataTypes } = require('sequelize');
const sequelize = require('../base-orm/sequelize-init');

const Tratamiento = sequelize.define('Tratamiento', {
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
  tableName: 'Tratamientos',
  timestamps: true
});

module.exports = Tratamiento;
