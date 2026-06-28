"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useIsAdmin } from "@/lib/useAdmin";
import { usePlan } from "@/lib/usePlan";
import { getMonitoredCameraIds } from "@/lib/monitoring";
import { ConsoleProtectedPage } from "../../login";

type DeviceRaw = {
    name?: string;
    client_id?: string;
    rtsp_path?: string;
};

type Device = {
    id: string;
    raw: string;
    created_at: string;
};

export default function DeviceDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { isAdmin, checking: checkingAdmin } = useIsAdmin();
    const { hasActivePlan, maxCameras, loading: planLoading } = usePlan();
    const [device, setDevice] = useState<Device | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [monitoring, setMonitoring] = useState(false);
    const [switchLoading, setSwitchLoading] = useState(false);
    const [switchMessage, setSwitchMessage] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const saved = localStorage.getItem(`monitoring_${id}`);
            if (saved === "true") setMonitoring(true);
        }
    }, [id]);

    useEffect(() => {
        const fetchDevice = async () => {
            try {
                const user = auth?.currentUser;
                if (!user) throw new Error("No authenticated user");

                const token = await user.getIdToken();
                const response = await fetch('https://wex0c6038j.execute-api.us-east-1.amazonaws.com/default/listDevices', {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("No se pudieron cargar las cámaras");

                const data = await response.json();
                const found = data.items?.find((d: Device) => d.id === id);
                if (!found) throw new Error("Cámara no encontrada");
                setDevice(found);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al cargar la cámara");
            } finally {
                setLoading(false);
            }
        };

        fetchDevice();
    }, [id]);

    const handleToggleMonitoring = async () => {
        if (!device) return;
        setSwitchLoading(true);
        setSwitchMessage(null);

        try {
            const user = auth?.currentUser;
            if (!user) throw new Error("No authenticated user");

            const token = await user.getIdToken();
            const deviceData = JSON.parse(device.raw) as DeviceRaw;

            if (!monitoring) {
                // Los administradores pueden encender Heimdall sin plan activo (override).
                // Los demás usuarios necesitan un plan activo y cupo disponible.
                if (!isAdmin) {
                    if (!hasActivePlan) {
                        throw new Error("Necesitas un plan activo para encender el monitoreo. Ve a 'Planes y suscripción'.");
                    }
                    const activeOthers = getMonitoredCameraIds().filter((cid) => cid !== device.id).length;
                    if (activeOthers >= maxCameras) {
                        throw new Error(`Alcanzaste el límite de tu plan (${maxCameras} cámaras monitoreadas). Apaga otra cámara o mejora tu plan.`);
                    }
                }

                const response = await fetch('/api/heimdal-manager', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        taskId: device.id,
                        context: {
                            instance_id: device.id,
                            client_id: deviceData.client_id,
                            camera_name: deviceData.name,
                            detection_blacklist: ["knife"],
                            rtsp_path: deviceData.rtsp_path,
                            owner_uid: user.uid,
                        }
                    }),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    let detail = errorBody;
                    try { detail = JSON.parse(errorBody)?.message ?? JSON.parse(errorBody)?.error ?? errorBody; } catch {}
                    throw new Error(`Error ${response.status}: ${detail}`);
                }
                setMonitoring(true);
                localStorage.setItem(`monitoring_${device.id}`, "true");
                setSwitchMessage("Monitoreo iniciado correctamente");
            } else {
                setMonitoring(false);
                localStorage.removeItem(`monitoring_${device.id}`);
                setSwitchMessage("Monitoreo detenido");
            }
        } catch (err) {
            setSwitchMessage(err instanceof Error ? err.message : "No se pudo cambiar el monitoreo");
        } finally {
            setSwitchLoading(false);
        }
    };

    return (
        <ConsoleProtectedPage
            title="Detalle de la cámara"
            subtitle="Gestiona el monitoreo de esta cámara."
        >
            <button
                onClick={() => router.back()}
                className="mb-6 text-sm text-gray-400 hover:text-white transition"
            >
                ← Volver a cámaras
            </button>

            {loading && <div className="text-center text-gray-400">Cargando...</div>}

            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            {device && (() => {
                const deviceData = JSON.parse(device.raw) as DeviceRaw;
                return (
                    <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
                        <div className="space-y-3">
                            <div>
                                <span className="text-gray-400 text-sm">Nombre</span>
                                <p className="text-white font-semibold">{deviceData.name || "-"}</p>
                            </div>
                            <div>
                                <span className="text-gray-400 text-sm">ID del cliente</span>
                                <p className="text-white font-semibold">{deviceData.client_id || "-"}</p>
                            </div>
                            <div>
                                <span className="text-gray-400 text-sm">Ruta RTSP</span>
                                <p className="text-white font-semibold break-all">{deviceData.rtsp_path || "-"}</p>
                            </div>
                            <div>
                                <span className="text-gray-400 text-sm">Fecha de registro</span>
                                <p className="text-white font-semibold">{device.created_at}</p>
                            </div>
                        </div>

                        {!checkingAdmin && !isAdmin && !planLoading && !hasActivePlan && (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                Necesitas un plan activo para encender el monitoreo.{" "}
                                <Link href="/console/billing" className="font-semibold underline hover:text-amber-100">
                                    Ver planes
                                </Link>
                            </div>
                        )}

                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                            <div>
                                <p className="text-white font-semibold">Monitoreo</p>
                                <p className="text-gray-400 text-sm">
                                    {monitoring ? "Activo — la cámara está siendo monitoreada" : "Inactivo — haz clic para iniciar el monitoreo"}
                                </p>
                            </div>
                            <button
                                onClick={handleToggleMonitoring}
                                disabled={switchLoading || checkingAdmin || planLoading || (!isAdmin && !monitoring && !hasActivePlan)}
                                title={
                                    !isAdmin && !monitoring && !hasActivePlan
                                        ? "Necesitas un plan activo"
                                        : undefined
                                }
                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                    monitoring ? "bg-blue-500" : "bg-white/15"
                                } ${switchLoading || checkingAdmin || planLoading || (!isAdmin && !monitoring && !hasActivePlan) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                                        monitoring ? "translate-x-8" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>

                        {switchMessage && (
                            <p className={`text-sm font-medium ${
                                switchMessage.includes("correctamente") || switchMessage.includes("detenido")
                                    ? "text-green-400"
                                    : "text-red-400"
                            }`}>
                                {switchMessage}
                            </p>
                        )}
                    </div>
                );
            })()}
        </ConsoleProtectedPage>
    );
}
