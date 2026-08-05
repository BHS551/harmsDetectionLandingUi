import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

// firebase-admin requiere Node, no Edge.
export const runtime = "nodejs";

/**
 * Devuelve la URL del stream en vivo de una cámara, lista para el navegador.
 *
 * El navegador NO puede reproducir RTSP; un gateway de medios (p. ej.
 * MediaMTX/go2rtc) convierte el RTSP a HLS o WebRTC. Este endpoint NO expone la
 * URL RTSP: el gateway resuelve internamente la cámara por su id (igual que
 * HeimdalManager lee el RTSP desde Secrets Manager).
 *
 * Configuración:
 *   MEDIA_GATEWAY_URL       base pública del gateway (según el protocolo elegido)
 *   MEDIA_STREAM_PROTOCOL   "hls" (por defecto) | "webrtc"
 *
 * Respuesta: { protocol, url } o 501 si el servicio no está configurado.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authorization = req.headers.get("Authorization");
  const idToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!idToken) {
    return NextResponse.json({ error: "Falta autorización." }, { status: 401 });
  }

  try {
    await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
  }

  const gateway = process.env.MEDIA_GATEWAY_URL;
  if (!gateway) {
    return NextResponse.json(
      { error: "La transmisión en vivo no está configurada en el servidor." },
      { status: 501 }
    );
  }

  const { id } = await params;
  const protocol = process.env.MEDIA_STREAM_PROTOCOL === "webrtc" ? "webrtc" : "hls";
  const base = gateway.replace(/\/$/, "");
  const encodedId = encodeURIComponent(id);
  const url =
    protocol === "webrtc"
      ? `${base}/${encodedId}/whep`
      : `${base}/${encodedId}/index.m3u8`;

  return NextResponse.json({ protocol, url });
}
