"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";

type StreamInfo = { protocol: "hls" | "webrtc"; url: string };
type State = "idle" | "loading" | "playing" | "unavailable" | "error";

/**
 * Reproductor de la transmisión en vivo de una cámara.
 *
 * El navegador no reproduce RTSP: este componente pide a /api/stream/:id la URL
 * de un stream ya convertido (HLS o WebRTC) por el gateway de medios y lo
 * reproduce. El RTSP nunca llega al navegador.
 */
export default function LiveView({ cameraId }: { cameraId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Refs para poder limpiar el reproductor al detener o desmontar.
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const teardown = () => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.srcObject = null;
      video.load();
    }
  };

  // Limpieza al desmontar el componente.
  useEffect(() => teardown, []);

  const attachHls = async (video: HTMLVideoElement, url: string) => {
    // Safari reproduce HLS de forma nativa.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      await video.play().catch(() => {});
      return;
    }
    const Hls = (await import("hls.js")).default;
    if (!Hls.isSupported()) {
      throw new Error("Tu navegador no soporta esta transmisión.");
    }
    const hls = new Hls({ liveDurationInfinity: true });
    hls.loadSource(url);
    hls.attachMedia(video);
    hlsRef.current = hls;
    await video.play().catch(() => {});
  };

  const attachWebRTC = async (video: HTMLVideoElement, whepUrl: string) => {
    const pc = new RTCPeerConnection();
    pcRef.current = pc;
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });
    pc.ontrack = (event) => {
      video.srcObject = event.streams[0];
      video.play().catch(() => {});
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // WHEP: se envía el offer SDP y el gateway responde con el answer SDP.
    const response = await fetch(whepUrl, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offer.sdp ?? "",
    });
    if (!response.ok) {
      throw new Error("No se pudo conectar con la transmisión.");
    }
    const answer = await response.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answer });
  };

  const start = async () => {
    setState("loading");
    setMessage(null);
    try {
      const user = auth?.currentUser;
      if (!user) throw new Error("Sesión no válida.");

      const token = await user.getIdToken();
      const res = await fetch(`/api/stream/${encodeURIComponent(cameraId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 501) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "La transmisión en vivo no está disponible.");
        setState("unavailable");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo iniciar la transmisión.");
      }

      const info: StreamInfo = await res.json();
      const video = videoRef.current;
      if (!video) return;

      if (info.protocol === "webrtc") {
        await attachWebRTC(video, info.url);
      } else {
        await attachHls(video, info.url);
      }
      setState("playing");
    } catch (err) {
      teardown();
      setMessage(err instanceof Error ? err.message : "Error al iniciar la transmisión.");
      setState("error");
    }
  };

  const stop = () => {
    teardown();
    setState("idle");
    setMessage(null);
  };

  return (
    <div className="border-t border-white/10 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-semibold">Transmisión en vivo</p>
          <p className="text-gray-400 text-sm">
            Video en tiempo real de la cámara.
          </p>
        </div>
        {state === "playing" ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Detener
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={state === "loading"}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "loading" ? "Conectando..." : "Ver en vivo"}
          </button>
        )}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          ref={videoRef}
          controls
          muted
          playsInline
          className={`h-full w-full object-contain ${state === "playing" ? "" : "hidden"}`}
        />
        {state !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-gray-400">
            {state === "loading"
              ? "Conectando con la transmisión..."
              : state === "unavailable"
                ? message ?? "La transmisión en vivo no está disponible."
                : state === "error"
                  ? message ?? "No se pudo iniciar la transmisión."
                  : "Pulsa “Ver en vivo” para ver la cámara."}
          </div>
        )}
      </div>

      {(state === "error" || state === "unavailable") && message && (
        <p className={`text-sm ${state === "error" ? "text-red-400" : "text-amber-300"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
