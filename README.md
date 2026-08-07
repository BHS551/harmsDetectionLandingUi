# SkyEye — Landing y Consola Web (`harmsDetectionLandingUi`)

Frontend de **SkyEye**, la plataforma de monitoreo de seguridad con IA que
convierte cámaras IP/RTSP existentes en un sistema de alertas en tiempo real.
Este repo contiene la **landing pública** y la **consola de usuario**
(`/console`), construidas con Next.js 15 (App Router) + TypeScript y
desplegadas en Vercel.

> 📚 Contexto completo del proyecto (arquitectura, los 7 repos, recursos AWS,
> flujos): [`docs/SKYEYE_PROJECT.md`](docs/SKYEYE_PROJECT.md).

## Qué hace

- **Landing** (`/`): presentación del producto, precios y formulario de
  contacto (vía Lambda `notifyAdmin` → SNS → correo del administrador).
- **Consola** (`/console`), con login de Firebase Auth:
  - `cameras` — alta de cámaras (la URL RTSP viaja al backend una sola vez y
    se guarda en Secrets Manager) y encendido/apagado del monitoreo
    (Lambda `HeimdalManager` lanza/termina una instancia EC2 por cámara).
  - `detections` — historial de detecciones del usuario con imagen de
    evidencia (URL firmada de S3).
  - `billing` — planes y contratación (hoy: solicitud manual al admin;
    integración PayU/Stripe disponible vía `/api/checkout`).
  - `account` — canales de notificación del usuario (correo / teléfono).
  - `admin` — panel de administradores: activar/desactivar planes de
    cualquier usuario (requiere custom claim `role: "admin"`).
  - `rovers` — sección para dispositivos móviles de vigilancia (exploratorio).

## Stack

- Next.js 15 (App Router) + React + TypeScript, desplegado en Vercel
  (`https://harms-detection-landing-ui-seven.vercel.app`).
- Firebase Auth (proyecto `login-69a8a`); toda llamada al backend lleva
  `Authorization: Bearer <ID token>`.
- Backend: Lambdas AWS de los repos `HeimdalManager`, `StoreDevice`,
  `ListDevices`, `StoreDetection` y `ListDetections`.
- Pagos: PayU Latam (default) o Stripe — ver [`docs/stripe-setup.md`](docs/stripe-setup.md).

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completa las variables (ver comentarios del archivo)
npm run dev                  # http://localhost:3000
```

## Estructura relevante

```
src/app/page.tsx              # Landing pública
src/app/console/**            # Consola (cameras, detections, billing, account, admin)
src/app/api/checkout          # Inicia pago (PayU o Stripe según PAYMENT_PROVIDER)
src/app/api/payu/confirmation # Confirmación de PayU
src/app/api/stripe/webhook    # Webhook de Stripe
src/app/api/heimdal-manager   # Proxy hacia la Lambda HeimdalManager
src/lib/plans.ts              # Catálogo de planes (fuente de verdad)
src/lib/monitoring.ts         # Estado de monitoreo por cámara (localStorage)
scripts/set-admin.mjs         # Otorga el custom claim role=admin (ver scripts/README.md)
docs/SKYEYE_PROJECT.md        # 📚 Directorio general del proyecto SkyEye
```

## Administradores

El rol admin es un custom claim de Firebase (`{ role: "admin" }`). Se otorga
con `scripts/set-admin.mjs` — instrucciones en
[`scripts/README.md`](scripts/README.md).
