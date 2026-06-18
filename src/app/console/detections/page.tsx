"use client";

import Head from "next/head";
import Dashboard from "./dashboard";
import { ConsoleProtectedPage } from "../login";

export default function Console() {
  return (
    <>
      <Head>
        <title>SkyEye - Monitoreo de Seguridad Impulsado por IA</title>
        <meta name="description" content="Revolucionando la vigilancia con detección inteligente de amenazas." />
      </Head>
      <ConsoleProtectedPage
        title="Detections"
        subtitle="Monitorea los eventos detectados por la plataforma."
      >
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white">Lista de detecciones</h2>
          <Dashboard />
        </div>
      </ConsoleProtectedPage>
    </>
  )
}
