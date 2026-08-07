# SkyEye — Directorio general del proyecto

> **Documento maestro del proyecto.** Reúne toda la información disponible en el
> código, los comentarios y el historial de commits de los 7 repositorios que
> componen SkyEye. Es el punto de entrada recomendado para cualquier persona
> (o agente) que necesite contexto del proyecto completo.
>
> Última actualización: 2026-08-07.

---

## 1. ¿Qué es SkyEye?

**SkyEye** es una plataforma SaaS de videovigilancia inteligente: convierte las
cámaras IP/RTSP que el cliente ya tiene en un sistema de detección de eventos
con IA que envía alertas en tiempo real (SMS / correo) con evidencia
fotográfica.

- **Marca pública:** SkyEye ("SkyEye — Monitoreo de Seguridad con IA").
- **Nombre interno / código:** Heimdall (a veces escrito "Heimdal"): es el
  nombre del worker de detección y del gestor de instancias.
- **Idioma y mercado:** interfaz en español, locale `es_CO` (Colombia como
  mercado inicial; pasarela de pago por defecto: PayU Latam).
- **Propuesta de valor (de la landing):**
  1. *Conecta tus cámaras* — se registran cámaras IP/RTSP existentes, sin
     comprar hardware nuevo.
  2. *Activa el monitoreo* — con un clic SkyEye analiza el video en busca de
     eventos importantes.
  3. *Recibe alertas* — notificaciones al instante con evidencia, todo desde el
     celular.
- **Eventos que detecta (configurables por cámara):** caídas, robos, violencia,
  personas, objetos peligrosos (p. ej. cuchillo) y palabras personalizadas que
  el usuario escriba. La detección usa **OpenAI CLIP (ViT-B/32)** comparando
  parches del video contra *prompts* de texto.

## 2. Arquitectura general

```
                            ┌────────────────────────────────────────────┐
                            │  harmsDetectionLandingUi (Next.js, Vercel) │
                            │  Landing pública + Consola /console        │
                            │  Auth: Firebase (proyecto login-69a8a)     │
                            └───────────────┬────────────────────────────┘
                                            │ fetch + Bearer <ID token Firebase>
              ┌─────────────────────────────┼──────────────────────────────┐
              ▼                             ▼                              ▼
      ┌──────────────┐            ┌──────────────────┐            ┌──────────────┐
      │ StoreDevice  │            │  HeimdalManager  │            │ ListDevices  │
      │ (alta cámara)│            │ start/stop worker│            │ ListDetections│
      └──────┬───────┘            │ subscriptions    │            └──────┬───────┘
             │                    │ userSettings     │                   │
             │                    │ workerEvents     │                   │
             │                    │ notifyAdmin      │                   │
             │                    └────────┬─────────┘                   │
             ▼                             ▼                             ▼
      Secrets Manager               EC2 (1 instancia            DynamoDB `detections`
      heimdall/rtsp/<id>            por cámara, tag             + S3 (URLs firmadas)
      DynamoDB `detections`         Project=PythonWorkers)
                                           │ systemd: heimdall-worker.service
                                           ▼
                            ┌────────────────────────────────┐
                            │  harmsDetection (worker Python) │
                            │  heimdall-eye.py                │
                            │  RTSP → movimiento → CLIP →     │
                            │  alerta (S3 + StoreDetection +  │
                            │  workerEvents notify/heartbeat) │
                            └────────────────────────────────┘
```

Flujo de una detección: la cámara RTSP (normalmente expuesta por un túnel
**ngrok TCP**) → worker en EC2 → si hay match: sube el frame a S3, registra el
evento vía `StoreDetection` y pide a `workerEvents` que notifique al usuario
por SMS/correo → el usuario lo ve en la consola (`/console/detections`).

## 3. Directorio de repositorios

| Repositorio | Rol | Tecnología | Despliegue |
|---|---|---|---|
| **harmsDetectionLandingUi** | Landing pública + consola web del usuario (cámaras, detecciones, facturación, cuenta, panel admin) | Next.js 15 (App Router), TypeScript, Tailwind, Firebase Auth | Vercel: `https://harms-detection-landing-ui-seven.vercel.app` |
| **HeimdalManager** | Backend de orquestación: enciende/apaga workers EC2, suscripciones, ajustes de usuario, eventos del worker y notificaciones al admin (5 Lambdas) | Node.js ESM (AWS SDK v3, firebase-admin) | AWS Lambda + API Gateway (us-east-1) |
| **StoreDevice** | Lambda: registra una cámara del usuario (RTSP con credenciales → Secrets Manager; versión enmascarada → DynamoDB) | Node.js ESM | AWS Lambda |
| **ListDevices** | Lambda: lista las cámaras del usuario autenticado (GSI `owner-index`) | Node.js ESM | AWS Lambda |
| **StoreDetection** | Lambda: guarda un evento de detección enviado por el worker (endpoint `storeRegister`), con TTL de 30 días | Node.js ESM | AWS Lambda (API `c038gkbfm8.execute-api.us-east-1`, ruta `/default/storeRegister`) |
| **ListDetections** | Lambda: lista las detecciones del usuario con URL firmada (1 h) de la imagen de evidencia en S3 | Node.js ESM | AWS Lambda |
| **harmsDetection** | Worker de detección "Heimdall Eye": lee RTSP, detecta movimiento (MOG2), clasifica con CLIP y dispara alertas. Incluye prototipos y script de publicación a S3 | Python (OpenCV, PyTorch, CLIP, boto3) | EC2 (código sincronizado desde `s3://detection-frames-tests/worker/` vía `deploy-worker.sh`) |

## 4. Recursos en la nube

### AWS (us-east-1)

- **DynamoDB**
  - `detections` — tabla compartida para dos tipos de item:
    - `type = "device"`: cámaras registradas (`id` UUID, `owner_uid`, `raw` con
      nombre, RTSP **enmascarado** y `client_id`). Sin TTL.
    - `type = "event"`: detecciones (`id = <ISO>-<rand>`, `raw` con el payload
      del worker, `owner_uid`, `expireAt` = TTL **30 días**).
    - GSI **`owner-index`** (clave `owner_uid`): el aislamiento por usuario lo
      impone la clave de la consulta, no un filtro en memoria.
  - `subscriptions` — `uid` → `{ plan, maxCameras, status, email, activatedBy, updatedAt }`.
  - `userSettings` — `uid` → `{ notificationEmail, notificationPhone, accountEmail }` (panel "Mi cuenta").
  - `workerStatus` — `device_id` → heartbeat del worker (`lastSeen`, `status`,
    `camera_name`, `owner_uid`); la consola considera la cámara "online" si
    latió en los últimos 90 s.
- **S3: `detection-frames-tests`**
  - `cameras/` — frames JPG de evidencia (`<fecha>_<score>_<coords>_<uuid>.jpg`);
    caducan a los **7 días** (lifecycle).
  - `worker/` — código vigente del worker (`heimdall-eye.py`,
    `firebase_auth.py`); cada instancia EC2 lo descarga al arrancar.
- **Secrets Manager**
  - `heimdall/firebase` — service account de Firebase (+ `FIREBASE_API_KEY`);
    todas las Lambdas y el worker leen la credencial de aquí (fallback a env
    vars solo para rollback).
  - `heimdall/rtsp/<deviceId>` — URL RTSP **con credenciales** de cada cámara;
    el navegador nunca la vuelve a ver después del alta.
- **EC2** — un worker por cámara monitoreada, lanzado desde un *launch
  template* (`LAUNCH_TEMPLATE_ID`), con tags `Project=PythonWorkers`,
  `TaskId=<id>`, `OwnerUid=<uid>` y UserData que instala el servicio systemd
  `heimdall-worker.service` (reinicio automático en fallos).
- **SNS** — tópico del administrador (`TOPIC_ARN` / `ADMIN_TOPIC_ARN`): recibe
  mensajes de contacto de la landing y solicitudes de plan; también se usa como
  **fallback temporal de correo** al usuario mientras SES no está configurado.
  SMS directos al teléfono del usuario vía `PublishCommand` con `PhoneNumber`.
- **SES** — envío de correo al usuario (`SES_SENDER`); **pendiente de
  configurar** en producción.
- **API Gateway** — endpoints conocidos:
  - `https://c038gkbfm8.execute-api.us-east-1.amazonaws.com/default/storeRegister` (StoreDetection, usado por el worker).
  - `https://uuzrdi5pxc.execute-api.us-east-1.amazonaws.com/` (notifyAdmin, usado por la landing).

### Firebase (proyecto `login-69a8a`)

- **Auth** — login de usuarios de la consola. Toda llamada a las Lambdas lleva
  `Authorization: Bearer <ID token>` verificado con `firebase-admin`.
- **Custom claim `{ role: "admin" }`** — otorga rol admin (ver
  `harmsDetectionLandingUi/scripts/set-admin.mjs`). Los admin pueden: activar y
  desactivar planes de cualquier usuario, apagar instancias de cualquiera y ver
  todas las suscripciones. Solo errores `auth/*` se tratan como 401.
- **Cuenta de servicio del worker** — el worker se autentica creando un custom
  token con uid `heimdall` e intercambiándolo por un ID token
  (`firebase_auth.py`), con caché y renovación automática.

### Otros servicios

- **Vercel** — hosting de la UI (dominio productivo + previews `*.vercel.app`;
  el CORS de todas las Lambdas permite el dominio de la app, previews de Vercel
  y `localhost`, configurable con `ALLOWED_ORIGINS`).
- **ngrok** — túneles TCP para exponer cámaras RTSP domésticas (p. ej.
  TP-Link) hacia el worker; el transporte RTSP fuerza TCP porque ngrok no
  reenvía UDP.
- **PayU Latam / Stripe** — pasarelas de pago (ver §6).
- **Twilio** — envío de SMS en versiones antiguas del worker (código legacy,
  credenciales vacías); las notificaciones actuales salen por SNS/SES vía
  `workerEvents`.

## 5. Flujos principales

1. **Alta de cámara** — Consola `/console/cameras` → `StoreDevice`: guarda la
   URL RTSP completa en `heimdall/rtsp/<deviceId>` (Secrets Manager) y el
   registro enmascarado en DynamoDB.
2. **Encender monitoreo** — Consola → `HeimdalManager` (`action: "start"`):
   verifica plan activo y cupo de cámaras **del lado del servidor** (los admin
   tienen override), es idempotente (si la tarea ya tiene worker vivo, lo
   devuelve) y lanza la instancia EC2 pasando solo la **referencia** al secreto
   RTSP (`rtsp_secret_id`), nunca la credencial.
3. **Detección** — `heimdall-eye.py`: apertura RTSP tolerante a fallos (TCP,
   reintentos, espera de keyframe) → etapa 1 barata: sustracción de fondo MOG2
   con ROIs de movimiento → etapa 2 cara: CLIP sobre los ROIs en batch, con un
   barrido periódico de frame completo cada 3 s como red de seguridad para
   objetivos estáticos → umbral coseno 0.27, 3 frames positivos consecutivos y
   cooldown de 10 s para disparar la alerta.
4. **Alerta** — en un pool de I/O (nunca bloquea la captura): sube el frame a
   S3, registra el evento vía `storeRegister` (StoreDetection) y llama a
   `workerEvents` `action:"notify"` para avisar al usuario por sus canales de
   "Mi cuenta" (SMS por SNS; correo por SES o, mientras tanto, por el tópico
   del admin).
5. **Heartbeat / estado en vivo** — el worker manda `action:"heartbeat"` a
   `workerEvents`; la página de la cámara consulta `GET ?device_id=` y muestra
   "online" si el último latido tiene < 90 s.
6. **Ver detecciones** — Consola `/console/detections` → `ListDetections`:
   query por `owner-index`, paginada, con URL firmada de S3 (1 h) por imagen.
7. **Contratar plan** — hoy el pago real está **en pausa**: el usuario pulsa
   "contratar" → `notifyAdmin` (`type:"plan_request"`) publica en SNS → el
   admin activa el plan a mano en `/console/admin` (Lambda `subscriptions`,
   `action:"activate"` por correo o uid). La integración PayU/Stripe existe en
   la UI (`/api/checkout`, `/api/payu/confirmation`, `/api/stripe/webhook`).
8. **Contacto** — formulario de la landing → `notifyAdmin` (`type:"contact"`,
   con campo *honeypot* `website` anti-bots) → correo al admin vía SNS.

## 6. Planes y pagos

Fuente de verdad del catálogo: `src/lib/plans.ts` (UI). Copias mínimas en
`subscriptions.mjs` y `notifyAdmin.mjs` (HeimdalManager).

| Plan | Cámaras | Precio | Notas |
|---|---|---|---|
| `cam5` | 5 | $50 USD/mes | Plan público: detección IA en tiempo real, alertas con evidencia, panel de detecciones |
| `cam1` | 1 | $1 USD/mes | Solo administradores (pruebas) |

- `PAYMENT_PROVIDER=payu` (default) o `stripe`; `/api/checkout` decide la
  pasarela. PayU en sandbox por defecto (`PAYU_TEST=1`). Detalle en
  `docs/stripe-setup.md`.
- El tope de cámaras se aplica en el servidor en cada `start`
  (`HeimdalManager`), contando instancias EC2 vivas del usuario.

## 7. Decisiones de diseño e historial (resumen de commits)

Endurecimiento de seguridad (transversal a todos los repos):

- **CORS restringido**: de `*` a lista blanca (dominio de la app + previews de
  Vercel + localhost, `ALLOWED_ORIGINS`).
- **Credenciales Firebase desde Secrets Manager** (`heimdall/firebase`) en vez
  de variables de entorno, con fallback para rollback.
- **La URL RTSP nunca viaja al navegador ni a DynamoDB en claro**: alta →
  Secrets Manager; start → solo la referencia; DynamoDB → enmascarada.
- **Aislamiento por usuario vía GSI** `owner-index` (antes se escaneaba todo y
  se filtraba en memoria, rompiendo la paginación).
- **Enforcement del plan del lado del servidor** (el chequeo del navegador es
  solo UX).
- **Clasificación 401 correcta**: solo errores `auth/*` de firebase-admin; los
  errores del SDK de AWS ya no se confunden con fallos de autenticación.
- **TTL**: eventos 30 días (DynamoDB) y frames 7 días (S3).
- **Sin logs sensibles** en StoreDetection (el evento incluía el token).
- **taskId validado** con allowlist estricta (los filtros de tags de EC2
  tratan `*`/`?` como comodines).

Operación del worker:

- **systemd** en vez de `nohup`: reinicio automático con límite de ráfaga.
- **Sincronización del worker desde S3** al arrancar cada instancia
  (descarga atómica; si falla, usa la copia horneada en la AMI).
- **Prompts CLIP**: las palabras en español de la UI se expanden a variantes en
  inglés (CLIP fue entrenado con alt-text en inglés) reportando siempre la
  palabra original del usuario; palabras vacías/largas se sanean.
- **Resiliencia RTSP**: transporte TCP forzado, tolerancia a lecturas fallidas
  (reconectar en cada fallo agotaba el pool de sesiones de las TP-Link),
  espera de keyframe (GOPs largos).
- **Rendimiento**: FP16 en GPU, batch de ROIs, throttle temporal de
  detecciones, ejecutores separados para CLIP e I/O.

## 8. Pendientes y limitaciones conocidas

- **SES sin configurar**: el correo al usuario sale por el tópico SNS del
  admin como *fallback temporal* (`workerEvents`).
- **Pago automático en pausa**: el flujo real es solicitud manual
  (`plan_request` → admin activa). PayU/Stripe están integrados pero no son el
  camino activo.
- **Estado de monitoreo en `localStorage`** (`monitoring_<id>`): el conteo es
  por navegador; la validación definitiva ya vive en el backend, pero la UI
  puede desincronizarse.
- **Código legacy en `harmsDetection`**: `multicore_detection*.py`,
  `rtsp_*.py`, `minimal.py`, `recordCamera.bat` (prototipos con Twilio) y
  copias viejas de las Lambdas (`listDevices.mjs`, `listDetections.mjs`).
  El worker vigente es únicamente `heimdall-eye.py` + `firebase_auth.py`.
- **`docs/stripe-setup.md` menciona Firestore**, pero las suscripciones se
  migraron a DynamoDB (el proyecto Firebase no tiene Firestore habilitado).
- **Cámaras expuestas por ngrok**: dependencia de túneles manuales; los datos
  de ejemplo en el código (`4.tcp.ngrok.io:<puerto>`) rotan.
- **`/console/rovers`**: sección de la consola para "rovers" (exploración
  futura de dispositivos móviles de vigilancia).

## 9. Fuentes de este documento

Este directorio se construyó a partir de **todo el material disponible en los
repositorios**: código fuente, comentarios (muchos documentan decisiones),
historial de commits de los 7 repos, `docs/stripe-setup.md`,
`scripts/README.md`, `.env.example` y `context.json`. No existía acceso a
conversaciones/chats previos desde esta sesión; si hay decisiones tomadas en
chats que no quedaron reflejadas en código o commits, deben añadirse aquí
manualmente.

## 10. Mapa rápido "quiero hacer X → toco Y"

| Necesito… | Repo / archivo |
|---|---|
| Cambiar la landing o la consola | `harmsDetectionLandingUi/src/app/**` |
| Añadir/editar planes | `harmsDetectionLandingUi/src/lib/plans.ts` (+ copias en `HeimdalManager/subscriptions.mjs` y `notifyAdmin.mjs`) |
| Cambiar cómo se lanzan/apagan workers | `HeimdalManager/index.mjs` |
| Cambiar notificaciones al usuario | `HeimdalManager/workerEvents.mjs` |
| Cambiar el alta/listado de cámaras | `StoreDevice/index.mjs`, `ListDevices/index.mjs` |
| Cambiar el guardado/listado de detecciones | `StoreDetection/index.mjs`, `ListDetections/index.mjs` |
| Mejorar la detección (modelo, umbrales, prompts) | `harmsDetection/heimdall-eye.py` |
| Publicar una nueva versión del worker | `harmsDetection/deploy-worker.sh` (sube a `s3://detection-frames-tests/worker/`) |
| Dar rol admin a alguien | `harmsDetectionLandingUi/scripts/set-admin.mjs` |
