# Configuración de pagos (PayU / Stripe) y planes

SkyEye cobra los planes y guarda el estado en Firestore (`subscriptions/{uid}`),
sincronizado por la confirmación de la pasarela. Antes de encender Heimdall en
una cámara, la app verifica que el usuario tenga un plan activo y cupo disponible.

## Pasarela: PayU (por defecto) o Stripe

El proveedor se elige con la variable `PAYMENT_PROVIDER`:

- **Sin configurar / `payu`** → se usa **PayU** (WebCheckout). Confirmación en
  `/api/payu/confirmation`.
- **`stripe`** → se usa **Stripe** Checkout. Webhook en `/api/stripe/webhook`.

El endpoint `/api/checkout` es único para ambos: decide la pasarela según
`PAYMENT_PROVIDER` y devuelve los datos que el frontend necesita (URL de Stripe
o formulario de PayU).

### PayU (WebCheckout)

1. En el panel de PayU (Configuración → Configuración técnica) obtén
   `PAYU_MERCHANT_ID`, `PAYU_ACCOUNT_ID` y `PAYU_API_KEY`.
2. Completa esas variables en `.env.local` (ver `.env.example`). Deja
   `PAYU_TEST=1` y la `PAYU_CHECKOUT_URL` de sandbox para pruebas.
3. PayU notifica el resultado a `<tu-dominio>/api/payu/confirmation`
   (configurable también en el panel). La firma se valida con la API Key y, si
   el estado es aprobado (`state_pol=4`), se activa la suscripción.
4. El `uid` y el plan viajan en `extra1`/`extra2` y vuelven en la confirmación.

> Nota: la confirmación de PayU es server-to-server y puede tardar; al volver del
> pago, la app muestra "estamos confirmando tu pago" y el plan se activa cuando
> llega la confirmación aprobada.

---

## Stripe (solo si `PAYMENT_PROVIDER=stripe`)

## 1. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

- `STRIPE_SECRET_KEY` — clave secreta de Stripe.
- `STRIPE_WEBHOOK_SECRET` — signing secret del webhook (paso 3).
- `NEXT_PUBLIC_BASE_URL` — URL pública (ej. `http://localhost:3000`).
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — del
  JSON de la cuenta de servicio de Firebase.

## 2. Firestore

1. Habilita **Firestore** en la consola de Firebase (modo producción).
2. Publica las reglas de `firestore.rules` (el cliente solo lee su propia
   suscripción; la escritura es exclusiva del webhook vía Admin SDK).

## 3. Webhook de Stripe

Configura un endpoint en **Stripe Dashboard → Developers → Webhooks** que
apunte a `<tu-dominio>/api/stripe/webhook`, escuchando:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copia el *signing secret* a `STRIPE_WEBHOOK_SECRET`.

Para probar en local:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 4. Planes

Los planes se definen en `src/lib/plans.ts`. Empezamos con:

| id    | Nombre     | Cámaras | Precio     |
| ----- | ---------- | ------- | ---------- |
| cam5  | 5 cámaras  | 5       | $50 USD/mes |

El precio se crea de forma inline en Checkout (`price_data`), así que no hace
falta crear productos en el dashboard para empezar. Para agregar un plan, añade
una entrada al arreglo `PLANS`.

## Flujo

1. El usuario va a **Planes** (`/console/billing`) y pulsa *Suscribirme*.
2. `POST /api/stripe/checkout` crea la sesión y redirige a Stripe.
3. Tras pagar, Stripe llama al webhook → se escribe `subscriptions/{uid}` con
   `status: "active"` y `maxCameras`.
4. El panel lee la suscripción en vivo; el toggle de monitoreo se habilita y
   respeta el cupo de cámaras del plan.

## Nota de seguridad

La verificación de cupo en el frontend evita que el usuario encienda más
cámaras de las permitidas desde la UI, pero la barrera definitiva debe estar
también en el backend que arranca Heimdall (Lambda `heimdalManager`),
validando el plan del usuario antes de iniciar el monitoreo.
