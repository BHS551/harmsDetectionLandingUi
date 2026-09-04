# SkyEye — landing page and customer console

The Next.js front end for [SkyEye](https://www.skyeyeprotection.com/): the
public site, the sign-up and billing flow, and the console where a customer
registers cameras, turns monitoring on, and reviews detections with their
evidence frames.

This is the half of the product a customer touches. The detection itself runs
in [harmsDetection](https://github.com/BHS551/harmsDetection), and the
instances that run it are managed by
[HeimdalManager](https://github.com/BHS551/HeimdalManager).

## What it has to reconcile

A camera-monitoring subscription joins three systems that do not naturally
agree: an identity provider (Firebase), a payment gateway, and AWS
infrastructure that costs money per running hour. The front end has to make a
customer's plan, their cameras, and their live EC2 instances line up — while
holding no AWS credentials and no camera passwords in the browser.

The design consequence is that **the console asks, it does not decide.** Every
answer that costs money or grants access is produced by a backend that verifies
the token itself.

## How it fits together

```
                     ┌──────────────────────────────────────┐
   Browser  ────────►│  Next.js App Router (this repo)      │
   Firebase Auth     │                                      │
   ID token          │  /                landing            │
                     │  /console/*       cameras, detections│
                     │                   billing, account,  │
                     │                   admin              │
                     └───────┬───────────────────┬──────────┘
                             │ route handlers    │
              ┌──────────────┴──────┐     ┌──────┴────────────────┐
              ▼                     ▼     ▼                       ▼
    /api/checkout           /api/stripe/webhook          /api/heimdal-manager
    /api/payu/confirmation                               (token-forwarding proxy)
              │                     │                             │
              ▼                     ▼                             ▼
        PayU / Stripe        Firestore: plan             HeimdalManager Lambda
                             activation                  start / stop EC2 workers

    /api/screenshots ──► S3 (private bucket, server-side listing)
```

Cameras and detections are read straight from the SkyEye Lambdas
([ListDevices](https://github.com/BHS551/ListDevices),
[ListDetections](https://github.com/BHS551/ListDetections),
[StoreDevice](https://github.com/BHS551/StoreDevice)) with the user's Firebase
token attached.

## Key technical decisions

**The payment provider is a runtime switch.** `PAYMENT_PROVIDER` selects PayU
(the default, for the Latin American market) or Stripe, with `lib/payu.ts` and
`lib/payments.ts` behind one interface. Adding a gateway does not touch the
checkout UI.

**Plans are a data catalogue, not scattered constants.** `lib/plans.ts` defines
each plan's id, price, `maxCameras` and marketing bullets in one place, and the
same `id` is what travels in the gateway metadata and lands in Firestore. A new
tier is a new entry, and `adminOnly` hides internal plans from the pricing
page.

**Plan activation happens on the webhook, not on redirect.** A user returning
to a success URL proves nothing — they can navigate there directly. Stripe's
webhook is verified against `STRIPE_WEBHOOK_SECRET`, and PayU posts to its own
confirmation route, so the plan is granted by the gateway's server-to-server
call.

**Admin is a signed custom claim.** `scripts/set-admin.mjs` writes
`role: "admin"` into the Firebase user's claims, so it arrives inside the ID
token and every backend can trust it without a database lookup. `useAdmin.ts`
only decides what to render.

**AWS credentials stay on the server.** `/api/screenshots` lists and signs S3
objects in a route handler; `/api/heimdal-manager` forwards the user's
`Authorization` header to the control-plane Lambda and returns its response
unchanged. The browser talks to this app, never to AWS.

**Firestore rules are in the repo.** `firestore.rules` is version-controlled
next to the code that depends on it, rather than living only in the console.

### A known limitation, stated plainly

`lib/monitoring.ts` tracks which cameras are monitored in `localStorage`, so
the camera count it enforces is **per browser** — a user on a second device
sees a stale count. This is deliberate and safe because it is only UX:
`HeimdalManager` re-checks the subscription and counts running instances by
EC2 tag before launching anything, and returns 403 past the plan limit. The
client-side check exists to avoid a pointless round trip, not to protect the
quota.

## Running it

Requires Node.js 18+, a Firebase project, and a PayU or Stripe account.

```bash
npm install
cp .env.example .env.local     # then fill it in
npm run dev                    # http://localhost:3000
```

`.env.example` documents every variable. The essentials:

| Variable | Meaning |
|---|---|
| `PAYMENT_PROVIDER` | `payu` (default) or `stripe` |
| `PAYU_MERCHANT_ID` / `PAYU_ACCOUNT_ID` / `PAYU_API_KEY` | PayU WebCheckout credentials |
| `PAYU_CHECKOUT_URL` / `PAYU_TEST` | Sandbox by default; `PAYU_TEST=0` for real charges |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Only when `PAYMENT_PROVIDER=stripe` |
| `NEXT_PUBLIC_BASE_URL` | Public base URL for checkout success/cancel |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Service account for token verification and webhooks |
| `AWS_REGION` / `S3_BUCKET_NAME` / `S3_PREFIX` | Frame storage for `/api/screenshots` |

Stripe's webhook endpoint must point at `<your-domain>/api/stripe/webhook`;
`docs/stripe-setup.md` walks through it. To grant yourself admin:

```bash
node scripts/set-admin.mjs <uid-or-email>
```

## Layout

```
src/app/page.tsx           landing page
src/app/console/           cameras, detections, billing, account, admin, rovers
src/app/api/               checkout, stripe webhook, payu confirmation,
                           heimdal-manager proxy, screenshots
src/lib/                   firebase (client + admin), plans, payments, payu,
                           subscriptions, monitoring, useAdmin, usePlan
firestore.rules            security rules
scripts/set-admin.mjs      grants the admin custom claim
docs/stripe-setup.md       Stripe configuration walkthrough
```
