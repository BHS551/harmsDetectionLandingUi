"use client";

import { useState } from "react";
import Head from "next/head";
import Dashboard from "./dashboard";
import CameraForm from "./form";

export default function Console() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <>
      <Head>
        <title>SkyEye - Monitoreo de Seguridad Impulsado por IA</title>
        <meta name="description" content="Revolucionando la vigilancia con detección inteligente de amenazas." />
      </Head>
      <header className="sticky top-0 z-50 bg-black opacity-90">
        <div className="container mx-auto flex items-center justify-between px-4 py-6">
          <div className="text-2xl font-bold">SkyEye - Console / Cameras</div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <a href="/console/detections" className="hover:text-orange-500">
                  Detections
                </a>
              </li>
              <li>
                <a href="/console/cameras" className="hover:text-orange-500">
                  Camera
                </a>
              </li>
              <li>
                <a href="/console/rovers" className="hover:text-orange-500">
                  Rovers
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
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
            ? "text-orange-500 border-b-2 border-white-500"
            : "text-gray-400 hover:text-white"
        }`}
          >
        Add Camera
          </button>
        </div>
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "form" && <CameraForm />}
      </div>
    </>
  )
}