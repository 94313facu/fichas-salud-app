const { DataTypes } = require('sequelize');
const sequelize = require('../base-orm/sequelize-init');

const Paciente = sequelize.define('Paciente', {
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
  direccion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  servicioEmergencia: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactoEmergencia: {
    type: DataTypes.STRING,
    allowNull: true
  },
  antecedentesEnfermedades: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  antecedentesHereditarias: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  antecedentesMedicacion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  antecedentesAlergias: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Pacientes',
  timestamps: true // Habilita automáticamente createdAt y updatedAt
});

module.exports = Paciente;
