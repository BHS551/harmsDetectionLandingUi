"use client";

import Head from "next/head";
import { ConsoleProtectedPage } from "../login";

export default function Console() {
  return (
    <>
      <Head>
        <title>SkyEye - Monitoreo de Seguridad Impulsado por IA</title>
        <meta name="description" content="Revolucionando la vigilancia con detección inteligente de amenazas." />
      </Head>
      <ConsoleProtectedPage
        title="Rovers"
        subtitle="Módulo reservado para operaciones y automatizaciones terrestres."
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-gray-300">
          El panel de rovers todavía está en construcción, pero ahora queda
          protegido por el mismo acceso de la consola.
        </div>
      </ConsoleProtectedPage>
    </>
  )
}
