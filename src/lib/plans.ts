/**
 * Catálogo de planes de SkyEye.
 *
 * Cada plan define cuántas cámaras pueden tener Heimdall encendido a la vez.
 * Empezamos con un único plan ("cam5"); agregar más es solo añadir entradas
 * aquí. Los precios se cobran como suscripción mensual vía Stripe.
 */

export type Plan = {
  /** Identificador estable, usado en Firestore y en la metadata de Stripe. */
  id: string;
  /** Nombre visible al usuario. */
  name: string;
  /** Máximo de cámaras con monitoreo activo simultáneo. */
  maxCameras: number;
  /** Precio mensual en la unidad menor de la moneda (centavos de USD). */
  priceCents: number;
  currency: string;
  /** Bullets para la tarjeta de pricing. */
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "cam5",
    name: "5 cámaras",
    maxCameras: 5,
    priceCents: 5000,
    currency: "usd",
    features: [
      "Hasta 5 cámaras monitoreadas",
      "Detección con IA en tiempo real",
      "Alertas con evidencia",
      "Panel de detecciones",
    ],
  },
];

export function getPlan(id: string | undefined | null): Plan | undefined {
  if (!id) return undefined;
  return PLANS.find((plan) => plan.id === id);
}

export function formatPrice(plan: Plan): string {
  const amount = (plan.priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: plan.currency.toUpperCase(),
    minimumFractionDigits: 0,
  });
  return `${amount}/mes`;
}
