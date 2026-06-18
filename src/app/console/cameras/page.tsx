"use client";

import Head from "next/head";
import { useState } from "react";
import Dashboard from "./dashboard";
import CameraForm from "./form";
import { ConsoleProtectedPage } from "../login";

export default function CamerasPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <Head>
        <title>SkyEye - Cameras</title>
        <meta name="description" content="Manage and monitor your camera devices." />
      </Head>
      <ConsoleProtectedPage
        title="Cameras"
        subtitle="Administra y monitorea tus dispositivos de cámara."
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Lista de cámaras</h2>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-full border border-blue-500 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/20 transition"
            >
              {showForm ? "Cancelar" : "+ Add Camera"}
            </button>
          </div>


          {showForm && <CameraForm onSuccess={() => setShowForm(false)} />}

          <Dashboard />
        </div>
      </ConsoleProtectedPage>
    </>
  );
}
