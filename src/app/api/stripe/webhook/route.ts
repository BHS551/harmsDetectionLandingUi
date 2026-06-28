import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin";
import { getPlan } from "@/lib/plans";

// firebase-admin y la verificación de firma de Stripe requieren Node, no Edge.
export const runtime = "nodejs";

/**
 * Webhook de Stripe. Mantiene subscriptions/{uid} en Firestore sincronizado con
 * el estado de la suscripción. Configura el endpoint en el dashboard de Stripe
 * apuntando a /api/stripe/webhook y guarda el signing secret en
 * STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe no está configurado en el servidor." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secretKey);
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "firma inválida";
    return NextResponse.json({ error: `Webhook: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.uid ?? session.client_reference_id ?? undefined;
        const planId = session.metadata?.planId ?? undefined;
        if (uid) {
          await writeSubscription(uid, planId, "active", {
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : undefined,
            stripeSubscriptionId:
              typeof session.subscription === "string" ? session.subscription : undefined,
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const uid = subscription.metadata?.uid;
        const planId = subscription.metadata?.planId;
        if (uid) {
          const status =
            event.type === "customer.subscription.deleted" ||
            subscription.status !== "active"
              ? "inactive"
              : "active";
          const currentPeriodEnd = (
            subscription as unknown as { current_period_end?: number }
          ).current_period_end;
          await writeSubscription(uid, planId, status, {
            stripeCustomerId:
              typeof subscription.customer === "string"
                ? subscription.customer
                : undefined,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd,
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "error procesando webhook";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function writeSubscription(
  uid: string,
  planId: string | undefined,
  status: "active" | "inactive",
  extra: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: number;
  }
) {
  const plan = getPlan(planId);
  const data: Record<string, unknown> = {
    status,
    plan: plan?.id ?? planId ?? null,
    maxCameras: plan?.maxCameras ?? 0,
    updatedAt: Date.now(),
  };

  if (extra.stripeCustomerId) data.stripeCustomerId = extra.stripeCustomerId;
  if (extra.stripeSubscriptionId) data.stripeSubscriptionId = extra.stripeSubscriptionId;
  if (extra.currentPeriodEnd) data.currentPeriodEnd = extra.currentPeriodEnd;

  await adminDb.collection("subscriptions").doc(uid).set(data, { merge: true });
}
