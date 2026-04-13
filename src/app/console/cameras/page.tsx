"use client";

import { useState } from "react";
import Head from "next/head";
import Dashboard from "./dashboard";
import CameraForm from "./form";
import { ConsoleProtectedPage } from "../login";

export default function Console() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <>
      <Head>
        <title>SkyEye - Monitoreo de Seguridad Impulsado por IA</title>
        <meta name="description" content="Revolucionando la vigilancia con detección inteligente de amenazas." />
      </Head>
      <ConsoleProtectedPage
        title="Cameras"
        subtitle="Gestiona el inventario de cámaras y sus configuraciones."
      >
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "dashboard"
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("form")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "form"
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Add Camera
          </button>
        </div>
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "form" && <CameraForm />}
      </ConsoleProtectedPage>
    </>
  )
}
