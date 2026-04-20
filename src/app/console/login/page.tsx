"use client";

import Head from "next/head";
import { Suspense } from "react";
import { ConsoleLogin } from "../login";

export default function ConsoleLoginPage() {
  return (
    <>
      <Head>
        <title>SkyEye - Login</title>
        <meta
          name="description"
          content="Acceso al panel de monitoreo de SkyEye."
        />
      </Head>
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center bg-[#050505] text-gray-300">
            Cargando acceso...
          </main>
        }
      >
        <ConsoleLogin />
      </Suspense>
    </>
  );
}
