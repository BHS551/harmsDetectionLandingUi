import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getPlan } from "@/lib/plans";

// firebase-admin y el SDK de Stripe requieren Node, no Edge.
export const runtime = "nodejs";

/**
 * Crea una sesión de Stripe Checkout (modo suscripción) para el plan indicado.
 * Requiere el ID token de Firebase en el header Authorization para asociar la
 * suscripción al usuario (client_reference_id + metadata.uid).
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe no está configurado en el servidor." },
      { status: 500 }
    );
  }

  const authorization = req.headers.get("Authorization");
  const idToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!idToken) {
    return NextResponse.json({ error: "Falta autorización." }, { status: 401 });
  }

  let uid: string;
  let email: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
    email = decoded.email;
  } catch (err) {
    console.error("[stripe/checkout] verifyIdToken falló:", {
      message: err instanceof Error ? err.message : String(err),
      code: (err as { code?: string })?.code,
      adminProjectId: process.env.FIREBASE_PROJECT_ID,
    });
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = getPlan(body?.planId);
  if (!plan) {
    return NextResponse.json({ error: "Plan no válido." }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: uid,
      customer_email: email,
      metadata: { uid, planId: plan.id },
      subscription_data: { metadata: { uid, planId: plan.id } },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            unit_amount: plan.priceCents,
            recurring: { interval: "month" },
            product_data: { name: `SkyEye — Plan ${plan.name}` },
          },
        },
      ],
      success_url: `${baseUrl}/console/billing?success=1`,
      cancel_url: `${baseUrl}/console/billing?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
