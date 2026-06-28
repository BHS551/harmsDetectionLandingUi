/**
 * Selección de pasarela de pago.
 *
 * Por defecto se usa PayU. Solo se usa Stripe si se configura explícitamente
 * la variable de entorno PAYMENT_PROVIDER=stripe.
 */
export type PaymentProvider = "payu" | "stripe";

export function getPaymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "stripe" ? "stripe" : "payu";
}
