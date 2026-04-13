"use client";

import Head from "next/head";
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
      <ConsoleLogin />
    </>
  );
}
