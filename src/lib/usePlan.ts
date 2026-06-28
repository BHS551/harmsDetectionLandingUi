"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

export type Subscription = {
  plan: string;
  maxCameras: number;
  status: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: number;
};

/**
 * Lee en vivo la suscripción del usuario desde Firestore (subscriptions/{uid}).
 * El documento lo escribe el webhook de Stripe con el Admin SDK; el cliente
 * solo lo lee. Al actualizarse en Stripe, el panel reacciona sin recargar.
 */
export function usePlan() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    let unsubDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubDoc?.();
      unsubDoc = null;

      if (!user || !db) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubDoc = onSnapshot(
        doc(db, "subscriptions", user.uid),
        (snap) => {
          setSubscription(snap.exists() ? (snap.data() as Subscription) : null);
          setLoading(false);
        },
        () => {
          setSubscription(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubDoc?.();
      unsubAuth();
    };
  }, []);

  const hasActivePlan = subscription?.status === "active";
  const maxCameras = hasActivePlan ? subscription?.maxCameras ?? 0 : 0;

  return { subscription, loading, hasActivePlan, maxCameras };
}
