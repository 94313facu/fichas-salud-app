const sequelize = require('../base-orm/sequelize-init');
const Profesional = require('./Profesional');
const Paciente = require('./Paciente');
const Sesion = require('./Sesion');
const ObraSocial = require('./ObraSocial');
const Tratamiento = require('./Tratamiento');

// Relaciones: Profesional hasMany Paciente, Paciente belongsTo Profesional
Profesional.hasMany(Paciente, {
  foreignKey: {
    name: 'profesionalId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});
Paciente.belongsTo(Profesional, {
  foreignKey: {
    name: 'profesionalId',
    allowNull: false
  }
});

// Relaciones: Profesional hasMany ObraSocial, ObraSocial belongsTo Profesional
Profesional.hasMany(ObraSocial, {
  foreignKey: {
    name: 'profesionalId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});
ObraSocial.belongsTo(Profesional, {
  foreignKey: {
    name: 'profesionalId',
    allowNull: false
  }
});

// Relaciones: ObraSocial hasMany Paciente, Paciente belongsTo ObraSocial
ObraSocial.hasMany(Paciente, {
  foreignKey: {
    name: 'obraSocialId',
    allowNull: true
  },
  onDelete: 'SET NULL'
});
Paciente.belongsTo(ObraSocial, {
  foreignKey: {
    name: 'obraSocialId',
    allowNull: true
  }
});

// Relaciones: Paciente hasMany Tratamiento, Tratamiento belongsTo Paciente
Paciente.hasMany(Tratamiento, {
  foreignKey: {
    name: 'pacienteId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});
Tratamiento.belongsTo(Paciente, {
  foreignKey: {
    name: 'pacienteId',
    allowNull: false
  }
});

// Relaciones: Tratamiento hasMany Sesion, Sesion belongsTo Tratamiento
Tratamiento.hasMany(Sesion, {
  foreignKey: {
    name: 'tratamientoId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});
Sesion.belongsTo(Tratamiento, {
  foreignKey: {
    name: 'tratamientoId',
    allowNull: false
  }
});

// Relaciones: Paciente hasMany Sesion, Sesion belongsTo Paciente
// Mantenemos también la relación directa para consultas simplificadas
Paciente.hasMany(Sesion, {
  foreignKey: {
    name: 'pacienteId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});
Sesion.belongsTo(Paciente, {
  foreignKey: {
    name: 'pacienteId',
    allowNull: false
  }
});

module.exports = {
  sequelize,
  Profesional,
  Paciente,
  Sesion,
  ObraSocial,
  Tratamiento
};
