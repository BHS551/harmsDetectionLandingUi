# Configuración de pagos (Stripe) y planes

SkyEye cobra los planes como **suscripción mensual** vía Stripe Checkout. El
estado del plan se guarda en Firestore (`subscriptions/{uid}`) y se sincroniza
mediante un webhook. Antes de encender Heimdall en una cámara, la app verifica
que el usuario tenga un plan activo y cupo disponible.

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
