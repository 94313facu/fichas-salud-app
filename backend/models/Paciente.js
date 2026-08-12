const { DataTypes } = require('sequelize');
const sequelize = require('../base-orm/sequelize-init');

const Paciente = sequelize.define('Paciente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // 1. Datos Personales e Identificación
  numeroFicha: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  localidad: {
    type: DataTypes.STRING,
    allowNull: true
  },
  codigoPostal: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fechaNacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  edad: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  actividad: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deriva: {
    type: DataTypes.STRING,
    allowNull: true
  },
  medicoClinico: {
    type: DataTypes.STRING,
    allowNull: true
  },
  medicoClinicoTelefono: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // 2. Cobertura Médica y Emergencias
  numeroAfiliado: {
    type: DataTypes.STRING,
    allowNull: true
  },
  planObraSocial: {
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
  aparatologia: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // 3. Cuestionario Clínico de Afecciones (Checkboxes de Anamnesis)
  afecciones: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },

  // 4. Odontograma Interactivo (Notación FDI)
  odontograma: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },

  // 4. Preguntas Detalladas de Salud
  alergiasMedicamentos: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  propensoHemorragias: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  medicamentoHabitual: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fuma: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  otrasEnfermedades: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  antecedentesHereditarios: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  embarazada: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },

  // Campos de compatibilidad anterior
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
  timestamps: true
});

module.exports = Paciente;
