"use client";

import Head from "next/head";
import { useRef } from "react";

export default function Console() {

  // Función para desplazarse suavemente a una sección
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' })
    }
  }
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
    </>
  )
}