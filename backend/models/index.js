const sequelize = require('../base-orm/sequelize-init');
const Profesional = require('./Profesional');
const Paciente = require('./Paciente');
const Sesion = require('./Sesion');
const ObraSocial = require('./ObraSocial');
const Tratamiento = require('./Tratamiento');
const Turno = require('./Turno');

// Relaciones: Profesional hasMany Paciente
Profesional.hasMany(Paciente, {
  foreignKey: { name: 'profesionalId', allowNull: false },
  onDelete: 'CASCADE'
});
Paciente.belongsTo(Profesional, {
  foreignKey: { name: 'profesionalId', allowNull: false }
});

// Relaciones: Profesional hasMany ObraSocial
Profesional.hasMany(ObraSocial, {
  foreignKey: { name: 'profesionalId', allowNull: false },
  onDelete: 'CASCADE'
});
ObraSocial.belongsTo(Profesional, {
  foreignKey: { name: 'profesionalId', allowNull: false }
});

// Relaciones: ObraSocial hasMany Paciente
ObraSocial.hasMany(Paciente, {
  foreignKey: { name: 'obraSocialId', allowNull: true },
  onDelete: 'SET NULL'
});
Paciente.belongsTo(ObraSocial, {
  foreignKey: { name: 'obraSocialId', allowNull: true }
});

// Relaciones: Paciente hasMany Tratamiento
Paciente.hasMany(Tratamiento, {
  foreignKey: { name: 'pacienteId', allowNull: false },
  onDelete: 'CASCADE'
});
Tratamiento.belongsTo(Paciente, {
  foreignKey: { name: 'pacienteId', allowNull: false }
});

// Relaciones: Tratamiento hasMany Sesion
Tratamiento.hasMany(Sesion, {
  foreignKey: { name: 'tratamientoId', allowNull: false },
  onDelete: 'CASCADE'
});
Sesion.belongsTo(Tratamiento, {
  foreignKey: { name: 'tratamientoId', allowNull: false }
});

// Relaciones: Paciente hasMany Sesion
Paciente.hasMany(Sesion, {
  foreignKey: { name: 'pacienteId', allowNull: false },
  onDelete: 'CASCADE'
});
Sesion.belongsTo(Paciente, {
  foreignKey: { name: 'pacienteId', allowNull: false }
});

// Relaciones: Profesional hasMany Turno
Profesional.hasMany(Turno, {
  foreignKey: { name: 'profesionalId', allowNull: false },
  onDelete: 'CASCADE'
});
Turno.belongsTo(Profesional, {
  foreignKey: { name: 'profesionalId', allowNull: false }
});

// Relaciones: Paciente hasMany Turno
Paciente.hasMany(Turno, {
  foreignKey: { name: 'pacienteId', allowNull: false },
  onDelete: 'CASCADE'
});
Turno.belongsTo(Paciente, {
  foreignKey: { name: 'pacienteId', allowNull: false }
});

// Relaciones: Tratamiento hasMany Turno (opcional)
Tratamiento.hasMany(Turno, {
  foreignKey: { name: 'tratamientoId', allowNull: true },
  onDelete: 'SET NULL'
});
Turno.belongsTo(Tratamiento, {
  foreignKey: { name: 'tratamientoId', allowNull: true }
});

module.exports = {
  sequelize,
  Profesional,
  Paciente,
  Sesion,
  ObraSocial,
  Tratamiento,
  Turno
};
