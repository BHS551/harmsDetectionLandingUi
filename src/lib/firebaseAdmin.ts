import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Firebase Admin para uso en API routes (verificar tokens y escribir en
 * Firestore desde el webhook de Stripe, saltándose las reglas de seguridad).
 *
 * Credenciales: usa las variables de entorno
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * (las dos últimas vienen del JSON de la cuenta de servicio). Como alternativa,
 * si está definida GOOGLE_APPLICATION_CREDENTIALS se usan esas credenciales.
 */
function init() {
  if (getApps().length) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // En las env vars la clave suele venir con "\n" escapados.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  } else {
    initializeApp({ credential: applicationDefault() });
  }
}

init();

export const adminAuth = getAuth();
export const adminDb = getFirestore();
