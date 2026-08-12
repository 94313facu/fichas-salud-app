# 🛡️ Guía de Uso, Seguridad y Respaldos - Fichas de Salud

Esta guía reúne todas las consideraciones operativas, protocolos de seguridad, respaldo de información y procedimientos de recuperación que el profesional de la salud debe conocer al utilizar la plataforma **Fichas de Salud**.

---

## 1. 🔒 Privacidad y Propiedad de los Datos

* **Soberanía Absoluta del Profesional**: A diferencia de otras plataformas comerciales, la información médica de tus pacientes no queda "secuestrada" en servidores de terceros. **Tú eres el único dueño de tus fichas clínicas**.
* **Privacidad y Confidencialidad (Multi-Tenant)**: Cada profesional accede a su cuenta mediante autenticación segura (Google OAuth 2.0 / JWT). Los datos de tus pacientes están estrictamente aislados y ningún otro usuario o médico puede visualizarlos.

---

## 2. 🛡️ Triple Capa de Resguardo (Regla de Seguridad 3-2-1)

El sistema opera bajo la regla de oro de la ciberseguridad industrial:

1. **Copia Activa (Base de Datos de Trabajo)**: Tus datos se procesan en tiempo real mientras atiendes en el consultorio.
2. **Copia en la Nube (Google Drive)**:
   - **Respaldos de Texto (`.json`)**: Cada noche a las **02:00 AM**, el sistema exporta de forma automática todo tu consultorio (pacientes, antecedentes, tratamientos, evoluciones y finanzas) y lo actualiza en tu cuenta personal de Google Drive en la carpeta `FichasDeSalud_Respaldos`.
   - **Fotos, Videos y Radiografías**: Al adjuntar un estudio o foto desde la app o celular, el archivo se sube directamente a tu carpeta `FichasDeSalud_Archivos` en Google Drive.
3. **Copia Manual Local**: En cualquier momento puedes ingresar a la pantalla de Inicio y hacer clic en **"Descargar JSON"** para guardar una copia física en un pendrive o disco externo.

---

## 3. 📄 Protocolo para Digitalizar Fichas de Papel sin Riesgo

Si vas a pasar tus fichas en papel al formato digital para luego descartar el papel, sigue este sencillo protocolo de seguridad:

1. **Captura Rápida desde el Celular**: Ingresa a la app desde tu smartphone (`http://...`), entra a la ficha del paciente, presiona **"+ Nueva Evolución"** > **"Adjuntar Foto"** y toma la foto de la ficha en papel con la cámara del celular.
2. **Verificación Inicial**: Revisa que la foto y los antecedentes cargados se visualicen correctamente en la ficha médica.
3. **Respaldo Inmediato**: Al finalizar la digitalización del día, ve a Inicio y haz clic en **"Guardar en Drive ahora"**.
4. **Descarte del Papel**: Una vez confirmado que el respaldo se guardó en tu Google Drive, la ficha física puede ser archivada o descartada con total tranquilidad.

---

## 4. 🚨 Recuperación Ante Desastres y Errores Humanos

### Escenario A: Se eliminó un paciente o dato por error y el sistema ya realizó el respaldo diario.
* **Solución (Historial de Versiones de Google Drive)**:
  1. Ingresa a tu Google Drive personal desde el navegador.
  2. Entra a la carpeta `FichasDeSalud_Respaldos`.
  3. Haz clic derecho sobre el archivo `respaldo_fichas_salud_diario.json` > **Historial de versiones**.
  4. Google Drive conserva las versiones de los últimos 30 días. Selecciona la versión del día previo al error y descárgala.
  5. En la app, ve a Inicio > **"Restaurar JSON"** e importa ese archivo para recuperar los datos borrados.

### Escenario B: Se rompió, formateó o robaron la computadora del consultorio.
* **Solución (Recuperación en 5 Segundos)**:
  1. Abre la aplicación en cualquier otra computadora, notebook, tablet o celular.
  2. Inicia sesión con tu cuenta de Google.
  3. Ve a Inicio > **"Restaurar JSON"** y selecciona tu copia desde Google Drive.
  4. **Recuperarás el 100% de tus fichas, antecedentes, turnos y fotos al instante**.

### Escenario C: La página web sufrió un corte de servidor o ataque.
* **Solución (Independencia de Datos)**:
  - La página web es solo la interfaz visual. Tus datos reales habitan seguros en tu Google Drive personal. Si el servidor sufriera una interrupción, el administrador reubicará la aplicación en una nueva dirección en minutos y tus datos continuarán 100% a salvo.

---

## 5. 💡 Recomendaciones de Uso Diario

* **Sincronización de Turnos**: Revisa tu celular o Google Calendar nativo para ver los turnos agendados y recibir alertas 2 horas antes de cada cita.
* **Espacio en Google Drive**: Asegúrate de contar con espacio libre en tu cuenta de Google (los 15 GB gratuitos de Google alcanzan para decenas de miles de fichas y fotos).
* **Cierre de Sesión**: Al finalizar tu jornada en computadoras compartidas, recuerda cerrar tu sesión desde el menú superior.

---
*Fichas de Salud - Documento Operativo de Seguridad v1.0*
