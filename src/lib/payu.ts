import crypto from "crypto";
import { Plan } from "./plans";

/**
 * Integración con PayU Latam mediante WebCheckout (formulario firmado que se
 * envía por POST a la pasarela; PayU procesa el pago y notifica vía
 * confirmationUrl). Es el análogo a Stripe Checkout para Latinoamérica.
 *
 * Docs: https://developers.payulatam.com/latam/es/docs/integrations/webcheckout-integration.html
 */

export function getPayuConfig() {
  return {
    merchantId: process.env.PAYU_MERCHANT_ID,
    accountId: process.env.PAYU_ACCOUNT_ID,
    apiKey: process.env.PAYU_API_KEY,
    // Sandbox por defecto; en producción usar
    // https://checkout.payulatam.com/ppp-web-gateway-payu/
    checkoutUrl:
      process.env.PAYU_CHECKOUT_URL ??
      "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/",
    test: process.env.PAYU_TEST === "0" ? "0" : "1",
  };
}

export function isPayuConfigured(): boolean {
  const c = getPayuConfig();
  return Boolean(c.merchantId && c.accountId && c.apiKey);
}

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

/**
 * PayU formatea el valor para la firma de confirmación con un solo decimal
 * cuando el segundo decimal es cero (ej. 150.00 -> "150.0", 150.55 -> "150.55").
 */
function formatPayuValue(value: string | number): string {
  const num = typeof value === "number" ? value : parseFloat(value);
  const secondDecimal = Math.round((num - Math.trunc(num)) * 100);
  return secondDecimal % 10 === 0 ? num.toFixed(1) : num.toFixed(2);
}

/**
 * Construye los campos firmados del formulario de WebCheckout.
 * signature = md5(ApiKey~merchantId~referenceCode~amount~currency)
 */
export function buildPayuCheckout(params: {
  plan: Plan;
  uid: string;
  email: string | undefined;
  referenceCode: string;
  baseUrl: string;
}): { action: string; fields: Record<string, string> } {
  const c = getPayuConfig();
  const amount = (params.plan.priceCents / 100).toFixed(2);
  const currency = params.plan.currency.toUpperCase();
  const signature = md5(
    `${c.apiKey}~${c.merchantId}~${params.referenceCode}~${amount}~${currency}`
  );

  const fields: Record<string, string> = {
    merchantId: c.merchantId ?? "",
    accountId: c.accountId ?? "",
    description: `SkyEye - Plan ${params.plan.name}`,
    referenceCode: params.referenceCode,
    amount,
    tax: "0",
    taxReturnBase: "0",
    currency,
    signature,
    test: c.test,
    buyerEmail: params.email ?? "",
    responseUrl: `${params.baseUrl}/console/billing?provider=payu`,
    confirmationUrl: `${params.baseUrl}/api/payu/confirmation`,
    // extra1/extra2 vuelven en la confirmación: nos permiten mapear al usuario.
    extra1: params.uid,
    extra2: params.plan.id,
  };

  return { action: c.checkoutUrl, fields };
}

/**
 * Valida la firma de la confirmación (server-to-server) que envía PayU.
 * sign = md5(ApiKey~merchant_id~reference_sale~new_value~currency~state_pol)
 */
export function validatePayuConfirmation(body: Record<string, string>): boolean {
  const c = getPayuConfig();
  if (!c.apiKey) return false;

  const expected = md5(
    `${c.apiKey}~${body.merchant_id}~${body.reference_sale}~${formatPayuValue(
      body.value
    )}~${body.currency}~${body.state_pol}`
  );
  return (body.sign ?? "").toLowerCase() === expected.toLowerCase();
}

/** state_pol = 4 significa transacción APROBADA. */
export const PAYU_STATE_APPROVED = "4";
