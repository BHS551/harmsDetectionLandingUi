# Transmisión en vivo del RTSP en la UI

Objetivo: ver el video en vivo de una cámara desde el panel. El navegador **no**
reproduce RTSP, así que se necesita un **gateway de medios** que convierta el
RTSP a un formato web (HLS o WebRTC).

## Reparto de responsabilidades

| Pieza | Repo | Estado |
| ----- | ---- | ------ |
| Reproductor en la UI | `harmsDetectionLandingUi` (este) | ✅ Implementado |
| Endpoint `/api/stream/:id` (devuelve URL del stream) | este | ✅ Implementado |
| Gateway RTSP → HLS/WebRTC | backend / servicio de medios nuevo | ⬜ Pendiente |

### Frontend (ya hecho en este repo)

- `src/app/console/cameras/live-view.tsx` — reproductor. Pide la URL a
  `/api/stream/:id` y reproduce con **hls.js** (HLS) o **WebRTC/WHEP**.
- `src/app/api/stream/[id]/route.ts` — valida el token de Firebase y devuelve
  `{ protocol, url }` construida a partir de `MEDIA_GATEWAY_URL` +
  `MEDIA_STREAM_PROTOCOL`. **No expone el RTSP**: el gateway resuelve la cámara
  por su `id`. Devuelve `501` si no hay gateway configurado (la UI muestra
  "transmisión no disponible").

Variables (ver `.env.example`):

```
MEDIA_GATEWAY_URL=https://media.tu-dominio.com   # base del gateway
MEDIA_STREAM_PROTOCOL=hls                         # hls | webrtc
```

Convención de rutas que espera el frontend (ajustable en el route):

- HLS:    `${MEDIA_GATEWAY_URL}/<cameraId>/index.m3u8`
- WebRTC: `${MEDIA_GATEWAY_URL}/<cameraId>/whep`

## Backend pendiente (sesión multi-repo)

Montar un **gateway de medios** (recomendado: **MediaMTX**, ex rtsp-simple-server,
o **go2rtc**) que:

1. **Alcance la cámara.** El RTSP suele estar en la red local del cliente
   (NAT). El gateway debe correr **edge/on-prem** en el negocio, o recibir el
   stream vía túnel/relay — igual que el detector de `harmsDetection`.
2. **Resuelva la cámara por id.** Configurar un path por `cameraId` cuyo origen
   sea el RTSP real de esa cámara (leído desde Secrets Manager, como hace
   `HeimdalManager`). Así el frontend nunca ve el RTSP.
3. **Exponga HLS y/o WebRTC** en la ruta esperada (`/<cameraId>/index.m3u8`,
   `/<cameraId>/whep`).

### Seguridad

- No enviar credenciales/URL RTSP al navegador (ya se cumple).
- URLs de stream con **token/expiración** por cámara; validar acceso por
  usuario/organización (idealmente el gateway valida el token de Firebase o un
  token corto firmado por `/api/stream/:id`).
- Proteger contra **SSRF** al conectar al RTSP.
- Considerar arrancar el stream on-demand y apagarlo cuando nadie mira.

### Latencia

- **HLS**: ~5–15 s (o menos con LL-HLS). Más simple.
- **WebRTC (WHEP)**: <1 s. Mejor experiencia "en vivo"; requiere el módulo
  WebRTC del gateway.
