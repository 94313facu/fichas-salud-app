const { DataTypes } = require('sequelize');
const sequelize = require('../base-orm/sequelize-init');

const Profesional = sequelize.define('Profesional', {
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
  especialidad: {
    type: DataTypes.STRING,
    allowNull: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'profesional'
  }
}, {
  tableName: 'Profesionales',
  timestamps: true // Habilita createdAt y updatedAt
});

module.exports = Profesional;
