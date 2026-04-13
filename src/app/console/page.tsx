"use client";

import Head from "next/head";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConsoleHeader, isConsoleSessionActive } from "./login";

export default function Console() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const hasSession = isConsoleSessionActive();

    setIsAuthenticated(hasSession);
    setIsReady(true);

    if (!hasSession) {
      router.replace("/console/login");
    }
  }, [router]);

  if (!isReady) {
    return (
      <>
        <Head>
          <title>SkyEye - Monitoreo de Seguridad Impulsado por IA</title>
          <meta name="description" content="Revolucionando la vigilancia con detección inteligente de amenazas." />
        </Head>
        <main className="flex min-h-screen items-center justify-center bg-[#050505] text-gray-300">
          Cargando acceso...
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>SkyEye - Monitoreo de Seguridad Impulsado por IA</title>
        <meta name="description" content="Revolucionando la vigilancia con detección inteligente de amenazas." />
      </Head>
      {isAuthenticated ? (
        <main className="min-h-screen bg-[#050505] text-white">
          <ConsoleHeader
            title="Centro de control"
            subtitle="Acceso interno a detecciones, cámaras y rovers."
          />
          <section className="mx-auto max-w-6xl px-4 py-8">
            <div className="grid gap-4 md:grid-cols-3">
              <a
                href="/console/detections"
                className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-orange-500/50 hover:bg-white/8"
              >
                <p className="text-sm text-orange-300">01</p>
                <h2 className="mt-3 text-xl font-semibold">Detections</h2>
                <p className="mt-2 text-sm text-gray-300">
                  Revisa eventos detectados y el comportamiento del sistema.
                </p>
              </a>

              <a
                href="/console/cameras"
                className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-orange-500/50 hover:bg-white/8"
              >
                <p className="text-sm text-orange-300">02</p>
                <h2 className="mt-3 text-xl font-semibold">Cameras</h2>
                <p className="mt-2 text-sm text-gray-300">
                  Administra fuentes de video y registra nuevas cámaras.
                </p>
              </a>

              <a
                href="/console/rovers"
                className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-orange-500/50 hover:bg-white/8"
              >
                <p className="text-sm text-orange-300">03</p>
                <h2 className="mt-3 text-xl font-semibold">Rovers</h2>
                <p className="mt-2 text-sm text-gray-300">
                  Consulta el módulo reservado para operación remota.
                </p>
              </a>
            </div>
          </section>
        </main>
      ) : null}
    </>
  )
}
