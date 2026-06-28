"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

/**
 * Lee el rol del usuario desde los custom claims del token de Firebase Auth.
 * Un administrador se define con el custom claim { role: "admin" }, que se
 * asigna desde el backend (ver scripts/set-admin.mjs). El claim viaja firmado
 * dentro del ID token, por lo que no se puede alterar desde el navegador.
 *
 * Nota: tras otorgar el rol, el usuario debe refrescar su token (volver a
 * iniciar sesión) para que el claim aparezca en el cliente.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!auth) {
      setChecking(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        setIsAdmin(tokenResult.claims.role === "admin");
      } catch {
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { isAdmin, checking };
}
