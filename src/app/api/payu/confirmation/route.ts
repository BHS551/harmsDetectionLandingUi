import { NextRequest, NextResponse } from "next/server";
import {
  validatePayuConfirmation,
  PAYU_STATE_APPROVED,
} from "@/lib/payu";
import { writeSubscription } from "@/lib/subscriptions";

// firebase-admin requiere Node, no Edge.
export const runtime = "nodejs";

/**
 * Confirmación server-to-server de PayU. PayU hace POST (form-urlencoded) a
 * esta URL cuando cambia el estado de una transacción. Validamos la firma y,
 * si el pago fue aprobado (state_pol = 4), activamos la suscripción en
 * Firestore. El uid y el plan llegan en extra1/extra2.
 *
 * PayU espera una respuesta HTTP 200 para no reintentar.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string> = {};
  try {
    const form = await req.formData();
    form.forEach((value, key) => {
      body[key] = typeof value === "string" ? value : "";
    });
  } catch {
    // Algunas integraciones envían el cuerpo como JSON.
    body = await req.json().catch(() => ({}));
  }

  if (!validatePayuConfirmation(body)) {
    console.error("[payu/confirmation] firma inválida", {
      reference: body.reference_sale,
    });
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  const uid = body.extra1;
  const planId = body.extra2;

  if (!uid) {
    return NextResponse.json({ received: true, note: "sin uid" }, { status: 200 });
  }

  const approved = body.state_pol === PAYU_STATE_APPROVED;

  try {
    await writeSubscription(uid, planId, approved ? "active" : "inactive", {
      provider: "payu",
      payuReference: body.reference_sale,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    console.error("[payu/confirmation] error guardando suscripción:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
