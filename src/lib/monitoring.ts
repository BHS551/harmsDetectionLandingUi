"use client";

/**
 * Utilidades para el estado de monitoreo (Heimdall encendido) por cámara.
 *
 * Hoy el estado vive en localStorage (`monitoring_<id> = "true"`). Estas
 * funciones permiten contar cuántas cámaras tienen el monitoreo activo para
 * validar el límite del plan antes de encender una más.
 *
 * Limitación conocida: al ser localStorage, el conteo es por navegador. La
 * validación definitiva del cupo debe vivir también en el backend.
 */

const PREFIX = "monitoring_";

export function isMonitoring(cameraId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${PREFIX}${cameraId}`) === "true";
}

/** Devuelve los IDs de cámara que están actualmente monitoreadas. */
export function getMonitoredCameraIds(): string[] {
  if (typeof window === "undefined") return [];
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX) && localStorage.getItem(key) === "true") {
      ids.push(key.slice(PREFIX.length));
    }
  }
  return ids;
}

export function countMonitoredCameras(): number {
  return getMonitoredCameraIds().length;
}
