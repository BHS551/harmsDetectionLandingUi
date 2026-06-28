// app/screenshots/page.tsx
"use client";

import { useEffect, useState } from "react";

type ScreenshotItem = {
  key: string;
  size: number;
  lastModified: string;
  url: string;
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function ScreenshotsPage() {
  const [items, setItems] = useState<ScreenshotItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScreenshots() {
      try {
        const res = await fetch("/api/screenshots");
        if (!res.ok) throw new Error("Failed to load screenshots");
        const data = await res.json();
        setItems(data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchScreenshots();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Capturas de detecciones</h1>
        <p className="mt-1 text-sm text-gray-400">
          Imágenes capturadas por el sistema de detección.
        </p>

        {loading ? (
          <div className="py-12 text-center text-gray-400">
            Cargando capturas...
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-gray-400">
            No hay capturas disponibles.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.key}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <img
                  src={item.url}
                  alt={item.key}
                  className="aspect-video w-full object-cover"
                />
                <div className="p-4">
                  <p className="break-all text-xs text-gray-400">{item.key}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatBytes(item.size)}</span>
                    <span>
                      {item.lastModified
                        ? new Date(item.lastModified).toLocaleString("es-CO")
                        : "Desconocido"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
