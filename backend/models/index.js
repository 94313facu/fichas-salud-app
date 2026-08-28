const sequelize = require('../base-orm/sequelize-init');
const Profesional = require('./Profesional');
const Paciente = require('./Paciente');
const Sesion = require('./Sesion');
const ObraSocial = require('./ObraSocial');
const PlanObraSocial = require('./PlanObraSocial');
const PortalFacturacion = require('./PortalFacturacion');
const Turno = require('./Turno');
const Practica = require('./Practica');
const PacienteObraSocial = require('./PacienteObraSocial');

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

// Relaciones: Profesional hasMany PortalFacturacion
Profesional.hasMany(PortalFacturacion, {
  foreignKey: { name: 'profesionalId', allowNull: false },
  onDelete: 'CASCADE'
});
PortalFacturacion.belongsTo(Profesional, {
  foreignKey: { name: 'profesionalId', allowNull: false }
});

// Relaciones: PortalFacturacion hasMany ObraSocial (una OS apunta a un portal)
PortalFacturacion.hasMany(ObraSocial, {
  foreignKey: { name: 'portalFacturacionId', allowNull: true },
  onDelete: 'SET NULL'
});
ObraSocial.belongsTo(PortalFacturacion, {
  foreignKey: { name: 'portalFacturacionId', allowNull: true }
});

// Relaciones: ObraSocial hasMany PlanObraSocial
ObraSocial.hasMany(PlanObraSocial, {
  foreignKey: { name: 'obraSocialId', allowNull: false },
  onDelete: 'CASCADE'
});
PlanObraSocial.belongsTo(ObraSocial, {
  foreignKey: { name: 'obraSocialId', allowNull: false }
});

// Relaciones LEGACY: ObraSocial hasMany Paciente (se mantiene para compatibilidad)
ObraSocial.hasMany(Paciente, {
  foreignKey: { name: 'obraSocialId', allowNull: true },
  onDelete: 'SET NULL'
});
Paciente.belongsTo(ObraSocial, {
  foreignKey: { name: 'obraSocialId', allowNull: true }
});

// Relaciones LEGACY: PlanObraSocial hasMany Paciente
PlanObraSocial.hasMany(Paciente, {
  foreignKey: { name: 'planObraSocialId', allowNull: true },
  onDelete: 'SET NULL'
});
Paciente.belongsTo(PlanObraSocial, {
  foreignKey: { name: 'planObraSocialId', allowNull: true }
});

// ============================
// NUEVA RELACIÓN: Paciente <-> ObraSocial (many-to-many via PacienteObraSocial)
// ============================
Paciente.hasMany(PacienteObraSocial, {
  foreignKey: 'pacienteId',
  as: 'ObrasSocialesAsociadas',
  onDelete: 'CASCADE'
});
PacienteObraSocial.belongsTo(Paciente, {
  foreignKey: 'pacienteId'
});

ObraSocial.hasMany(PacienteObraSocial, {
  foreignKey: 'obraSocialId',
  onDelete: 'CASCADE'
});
PacienteObraSocial.belongsTo(ObraSocial, {
  foreignKey: 'obraSocialId'
});

PlanObraSocial.hasMany(PacienteObraSocial, {
  foreignKey: 'planObraSocialId',
  onDelete: 'SET NULL'
});
PacienteObraSocial.belongsTo(PlanObraSocial, {
  foreignKey: 'planObraSocialId'
});

// ============================
// Sesion -> ObraSocial (registra con qué OS se facturó cada sesión)
// ============================
Sesion.belongsTo(ObraSocial, {
  foreignKey: { name: 'obraSocialId', allowNull: true },
  as: 'ObraSocialSesion'
});
Sesion.belongsTo(PlanObraSocial, {
  foreignKey: { name: 'planObraSocialId', allowNull: true },
  as: 'PlanObraSocialSesion'
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

// Relaciones: Profesional hasMany Practica
Profesional.hasMany(Practica, {
  foreignKey: { name: 'profesionalId', allowNull: false },
  onDelete: 'CASCADE'
});
Practica.belongsTo(Profesional, {
  foreignKey: { name: 'profesionalId', allowNull: false }
});

// Relaciones: ObraSocial hasMany Practica (opcional)
ObraSocial.hasMany(Practica, {
  foreignKey: { name: 'obraSocialId', allowNull: true },
  onDelete: 'CASCADE'
});
Practica.belongsTo(ObraSocial, {
  foreignKey: { name: 'obraSocialId', allowNull: true }
});

// Relaciones: PlanObraSocial hasMany Practica (opcional)
PlanObraSocial.hasMany(Practica, {
  foreignKey: { name: 'planObraSocialId', allowNull: true },
  onDelete: 'CASCADE'
});
Practica.belongsTo(PlanObraSocial, {
  foreignKey: { name: 'planObraSocialId', allowNull: true }
});

module.exports = {
  sequelize,
  Profesional,
  Paciente,
  Sesion,
  ObraSocial,
  PlanObraSocial,
  PortalFacturacion,
  Turno,
  Practica,
  PacienteObraSocial
};
