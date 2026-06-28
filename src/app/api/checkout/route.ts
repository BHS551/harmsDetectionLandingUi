import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getPlan } from "@/lib/plans";
import { getPaymentProvider } from "@/lib/payments";
import { buildPayuCheckout, isPayuConfigured } from "@/lib/payu";

// firebase-admin y los SDK de pago requieren Node, no Edge.
export const runtime = "nodejs";

/**
 * Inicia el cobro del plan indicado con la pasarela configurada.
 * Por defecto PayU; Stripe solo si PAYMENT_PROVIDER=stripe.
 *
 * Respuesta:
 *  - Stripe: { provider: "stripe", url }            -> el cliente redirige.
 *  - PayU:   { provider: "payu", action, fields }   -> el cliente arma y
 *            envía un formulario POST (WebCheckout).
 */
export async function POST(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  const idToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!idToken) {
    return NextResponse.json({ error: "Falta autorización." }, { status: 401 });
  }

  let uid: string;
  let email: string | undefined;
  let isAdmin = false;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
    email = decoded.email;
    isAdmin = decoded.role === "admin";
  } catch (err) {
    console.error("[checkout] verifyIdToken falló:", {
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

  // Planes exclusivos para administradores: se valida también en el servidor.
  if (plan.adminOnly && !isAdmin) {
    return NextResponse.json(
      { error: "Este plan es exclusivo para administradores." },
      { status: 403 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
  const provider = getPaymentProvider();

  // ─── Stripe ───────────────────────────────────────────────────────────
  if (provider === "stripe") {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe no está configurado en el servidor." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey);
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

      return NextResponse.json({ provider: "stripe", url: session.url });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error de Stripe";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // ─── PayU (por defecto) ───────────────────────────────────────────────
  if (!isPayuConfigured()) {
    return NextResponse.json(
      { error: "PayU no está configurado en el servidor." },
      { status: 500 }
    );
  }

  const referenceCode = `skyeye-${uid}-${plan.id}-${Date.now()}`;
  const { action, fields } = buildPayuCheckout({
    plan,
    uid,
    email,
    referenceCode,
    baseUrl,
  });

  return NextResponse.json({ provider: "payu", action, fields });
}
