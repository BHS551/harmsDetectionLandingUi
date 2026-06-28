/**
 * Otorga (o revoca) el rol de administrador a un usuario de Firebase Auth
 * estableciendo el custom claim { role: "admin" }.
 *
 * Requisitos:
 *   1. npm install   (instala firebase-admin, ya está en devDependencies)
 *   2. Una clave de cuenta de servicio del proyecto Firebase. Descárgala en:
 *      Firebase Console > Configuración del proyecto > Cuentas de servicio >
 *      "Generar nueva clave privada".
 *   3. Apunta GOOGLE_APPLICATION_CREDENTIALS a ese archivo JSON:
 *      export GOOGLE_APPLICATION_CREDENTIALS=/ruta/serviceAccountKey.json
 *
 * Uso:
 *   node scripts/set-admin.mjs <email|uid>            # otorga admin
 *   node scripts/set-admin.mjs <email|uid> --revoke   # revoca admin
 *
 * Importante: el usuario debe cerrar y volver a iniciar sesión (o esperar a
 * que su token se refresque) para que el cambio surta efecto en la app.
 */

import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const identifier = process.argv[2];
const revoke = process.argv.includes("--revoke");

if (!identifier) {
  console.error("Uso: node scripts/set-admin.mjs <email|uid> [--revoke]");
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Falta GOOGLE_APPLICATION_CREDENTIALS. Apúntalo al JSON de la cuenta de servicio."
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}

const auth = getAuth();

async function main() {
  const user = identifier.includes("@")
    ? await auth.getUserByEmail(identifier)
    : await auth.getUser(identifier);

  const claims = { ...(user.customClaims ?? {}) };

  if (revoke) {
    delete claims.role;
  } else {
    claims.role = "admin";
  }

  await auth.setCustomUserClaims(user.uid, claims);

  console.log(
    `${revoke ? "Revocado" : "Otorgado"} rol admin para ${user.email ?? user.uid} (uid: ${user.uid}).`
  );
  console.log("El usuario debe volver a iniciar sesión para aplicar el cambio.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
