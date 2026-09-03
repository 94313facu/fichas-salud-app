const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
    process.exit(1);
  }
  
  console.log('Database connected.');

  db.serialize(() => {
    // Agregar columna recordatorioEnviado a Turnos si no existe
    db.run(`ALTER TABLE Turnos ADD COLUMN recordatorioEnviado BOOLEAN NOT NULL DEFAULT 0;`, (err) => {
      if (err && err.message.includes('duplicate column name')) {
        console.log('Column recordatorioEnviado already exists in Turnos.');
      } else if (err) {
        console.error('Error adding recordatorioEnviado:', err);
      } else {
        console.log('Added recordatorioEnviado to Turnos.');
      }
    });

    // Agregar columna configuracionWhatsApp a Profesionales si no existe
    db.run(`ALTER TABLE Profesionales ADD COLUMN configuracionWhatsApp TEXT;`, (err) => {
      if (err && err.message.includes('duplicate column name')) {
        console.log('Column configuracionWhatsApp already exists in Profesionales.');
      } else if (err) {
        console.error('Error adding configuracionWhatsApp:', err);
      } else {
        console.log('Added configuracionWhatsApp to Profesionales.');
      }
    });
  });

  // Cierra después de unos segundos
  setTimeout(() => {
    db.close();
    console.log('Migration finished.');
  }, 2000);
});
