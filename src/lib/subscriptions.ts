import { adminDb } from "./firebaseAdmin";
import { getPlan } from "./plans";

/**
 * Escribe/actualiza subscriptions/{uid} en Firestore. Lo usan las
 * confirmaciones de pago (webhook de Stripe y confirmación de PayU).
 */
export async function writeSubscription(
  uid: string,
  planId: string | undefined,
  status: "active" | "inactive",
  extra: {
    provider?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    payuReference?: string;
    currentPeriodEnd?: number;
  } = {}
) {
  const plan = getPlan(planId);
  const data: Record<string, unknown> = {
    status,
    plan: plan?.id ?? planId ?? null,
    maxCameras: plan?.maxCameras ?? 0,
    updatedAt: Date.now(),
  };

  if (extra.provider) data.provider = extra.provider;
  if (extra.stripeCustomerId) data.stripeCustomerId = extra.stripeCustomerId;
  if (extra.stripeSubscriptionId) data.stripeSubscriptionId = extra.stripeSubscriptionId;
  if (extra.payuReference) data.payuReference = extra.payuReference;
  if (extra.currentPeriodEnd) data.currentPeriodEnd = extra.currentPeriodEnd;

  await adminDb.collection("subscriptions").doc(uid).set(data, { merge: true });
}
