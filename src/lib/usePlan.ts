"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export type Subscription = {
  uid?: string;
  email?: string;
  plan: string;
  maxCameras: number;
  status: string;
  activatedBy?: string;
  updatedAt?: string;
};

// Lambda subscriptions (DynamoDB). Las activa el administrador desde
// /console/admin; el cliente solo lee la suya.
export const SUBSCRIPTIONS_URL =
  "https://8gq52tgisd.execute-api.us-east-1.amazonaws.com/";

/**
 * Lee la suscripción del usuario autenticado desde el backend (DynamoDB via
 * Lambda). Antes vivía en Firestore, pero la base de datos nunca existió en el
 * proyecto Firebase; este endpoint es ahora la fuente de verdad.
 */
export function usePlan() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch(SUBSCRIPTIONS_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setSubscription(response.ok ? (data.subscription ?? null) : null);
      } catch {
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const hasActivePlan = subscription?.status === "active";
  const maxCameras = hasActivePlan ? subscription?.maxCameras ?? 0 : 0;

  return { subscription, loading, hasActivePlan, maxCameras };
}
