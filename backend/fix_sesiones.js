const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.sqlite');
db.serialize(() => {
  db.run('BEGIN TRANSACTION;');
  db.run('CREATE TABLE "Sesiones_new" ("id" INTEGER PRIMARY KEY, "notas" TEXT, "archivoUrl" TEXT, "archivoTipo" VARCHAR(255), "presupuesto" DECIMAL(10,2) DEFAULT 0, "pago" DECIMAL(10,2) DEFAULT 0, "saldo" DECIMAL(10,2) DEFAULT 0, "codigoPractica" VARCHAR(255), "piezaDental" VARCHAR(255), "caraDental" VARCHAR(255), "modalidadCobro" TEXT NOT NULL DEFAULT "obra_social", "estadoFacturacion" TEXT NOT NULL DEFAULT "pendiente", "createdAt" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL, "pacienteId" INTEGER NOT NULL REFERENCES "Pacientes" ("id") ON DELETE CASCADE ON UPDATE CASCADE)');
  db.run('INSERT INTO "Sesiones_new" SELECT "id", "notas", "archivoUrl", "archivoTipo", "presupuesto", "pago", "saldo", "codigoPractica", "piezaDental", "caraDental", "modalidadCobro", "estadoFacturacion", "createdAt", "updatedAt", "pacienteId" FROM "Sesiones"');
  db.run('DROP TABLE "Sesiones"');
  db.run('ALTER TABLE "Sesiones_new" RENAME TO "Sesiones"');
  db.run('COMMIT;', (err) => {
    if (err) console.error(err);
    else console.log('Successfully dropped tratamientoId from Sesiones!');
  });
});
