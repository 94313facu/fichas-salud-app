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
    allowNull: true // Permitir nulo para cuentas registradas vía Google OAuth
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  googleRefreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'profesional'
  },
  horarioLaboral: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: JSON.stringify({
      lunes:     { activo: true, inicio: '08:00', fin: '20:00' },
      martes:    { activo: true, inicio: '08:00', fin: '20:00' },
      miercoles: { activo: true, inicio: '08:00', fin: '20:00' },
      jueves:    { activo: true, inicio: '08:00', fin: '20:00' },
      viernes:   { activo: true, inicio: '08:00', fin: '20:00' },
      sabado:    { activo: false, inicio: '09:00', fin: '13:00' },
      domingo:   { activo: false, inicio: '09:00', fin: '13:00' }
    }),
    get() {
      const raw = this.getDataValue('horarioLaboral');
      try {
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    set(value) {
      this.setDataValue('horarioLaboral', value ? JSON.stringify(value) : null);
    }
  }
}, {
  tableName: 'Profesionales',
  timestamps: true
});

module.exports = Profesional;
