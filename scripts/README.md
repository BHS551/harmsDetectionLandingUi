# Scripts de administración

## `set-admin.mjs` — Otorgar el rol de administrador

El control de "iniciar/detener monitoreo" en la consola está restringido a
administradores. Un administrador se identifica con el **custom claim**
`{ role: "admin" }` en su usuario de Firebase Auth.

### Cómo dar permisos de administrador a alguien

1. Instala dependencias (incluye `firebase-admin`):

   ```bash
   npm install
   ```

2. Descarga una clave de cuenta de servicio:
   **Firebase Console → Configuración del proyecto → Cuentas de servicio →
   "Generar nueva clave privada"**. Guarda el JSON en un lugar seguro
   (no lo subas al repositorio).

3. Apunta la variable de entorno a ese archivo:

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/serviceAccountKey.json
   ```

4. Ejecuta el script con el correo (o UID) del usuario:

   ```bash
   node scripts/set-admin.mjs usuario@correo.com
   ```

   Para quitar el rol:

   ```bash
   node scripts/set-admin.mjs usuario@correo.com --revoke
   ```

5. El usuario debe **cerrar sesión y volver a iniciarla** para que el rol
   se refleje en la app (el claim se actualiza al refrescar el token).

### Notas de seguridad

- El claim viaja firmado dentro del ID token de Firebase, así que no se puede
  falsificar desde el navegador.
- La restricción del frontend **oculta y bloquea** el botón de monitoreo, pero
  la barrera definitiva debe aplicarse también en el backend: el endpoint que
  inicia el monitoreo (`heimdalManager`) debería verificar el claim `role`
  del token antes de actuar. Eso queda fuera de este repositorio (es Lambda).
