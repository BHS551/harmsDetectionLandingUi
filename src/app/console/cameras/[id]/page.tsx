"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useIsAdmin } from "@/lib/useAdmin";
import { usePlan } from "@/lib/usePlan";
import { getMonitoredCameraIds } from "@/lib/monitoring";
import { ConsoleProtectedPage } from "../../login";
import LiveView from "../live-view";

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

// Palabras de detección iniciales disponibles para toda cámara.
const DEFAULT_DETECTION_WORDS = ["caidas", "robos", "violencia", "persona"];

// Endpoint de estado del worker (heartbeat): muestra si la cámara está siendo
// procesada de verdad, en vez de confiar solo en el switch/localStorage.
const WORKER_EVENTS_URL = "https://p4nojr0ec5.execute-api.us-east-1.amazonaws.com/";

// Minúsculas y sin acentos, para que "Caídas" no cree un duplicado de "caidas".
const normalizeWord = (word: string) =>
    word.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Sanea listas venidas de localStorage: solo strings, normalizadas, sin duplicados.
const sanitizeWords = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return [...new Set(
        value
            .filter((w): w is string => typeof w === "string")
            .map(normalizeWord)
            .filter(Boolean),
    )];
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
    const [availableWords, setAvailableWords] = useState<string[]>(DEFAULT_DETECTION_WORDS);
    const [selectedWords, setSelectedWords] = useState<string[]>(DEFAULT_DETECTION_WORDS);
    const [newWord, setNewWord] = useState("");
    // null = desconocido/aún sin consultar; true/false = worker en línea o sin señal.
    const [workerOnline, setWorkerOnline] = useState<boolean | null>(null);

    useEffect(() => {
        if (id) {
            const saved = localStorage.getItem(`monitoring_${id}`);
            if (saved === "true") setMonitoring(true);

            const savedWords = localStorage.getItem(`detection_words_${id}`);
            if (savedWords) {
                try {
                    const parsed = JSON.parse(savedWords) as { available?: unknown; selected?: unknown };
                    const available = sanitizeWords(parsed.available);
                    // Solo palabras visibles pueden estar seleccionadas.
                    const selected = sanitizeWords(parsed.selected).filter((w) => available.includes(w));
                    if (available.length > 0) {
                        setAvailableWords(available);
                        setSelectedWords(selected);
                    }
                } catch {
                    // Valor corrupto en localStorage: se mantienen los defaults.
                }
            }
        }
    }, [id]);

    const persistWords = (available: string[], selected: string[]) => {
        setAvailableWords(available);
        setSelectedWords(selected);
        if (id) {
            localStorage.setItem(`detection_words_${id}`, JSON.stringify({ available, selected }));
        }
    };

    const toggleWord = (word: string) => {
        const selected = selectedWords.includes(word)
            ? selectedWords.filter((w) => w !== word)
            : [...selectedWords, word];
        persistWords(availableWords, selected);
    };

    const addWord = () => {
        const word = normalizeWord(newWord);
        if (!word) return;
        setNewWord("");
        if (availableWords.includes(word)) {
            if (!selectedWords.includes(word)) {
                persistWords(availableWords, [...selectedWords, word]);
            }
            return;
        }
        persistWords([...availableWords, word], [...selectedWords, word]);
    };

    const removeWord = (word: string) => {
        persistWords(
            availableWords.filter((w) => w !== word),
            selectedWords.filter((w) => w !== word),
        );
    };

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

    // Estado real del worker: consulta el heartbeat mientras el monitoreo esté
    // encendido. Si deja de latir >90s, workerEvents lo reporta como offline.
    useEffect(() => {
        if (!monitoring || !id) {
            setWorkerOnline(null);
            return;
        }
        let cancelled = false;
        const check = async () => {
            try {
                const user = auth?.currentUser;
                if (!user) return;
                const token = await user.getIdToken();
                const res = await fetch(`${WORKER_EVENTS_URL}?device_id=${encodeURIComponent(String(id))}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!cancelled) setWorkerOnline(res.ok ? Boolean(data.status?.online) : false);
            } catch {
                if (!cancelled) setWorkerOnline(false);
            }
        };
        check();
        const timer = setInterval(check, 30000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [monitoring, id]);

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

                if (selectedWords.length === 0) {
                    throw new Error("Selecciona al menos una palabra de detección antes de encender el monitoreo.");
                }

                if (!deviceData.rtsp_path) {
                    throw new Error("Esta cámara no tiene ruta RTSP configurada; el monitoreo no puede iniciarse sin ella.");
                }

                const response = await fetch('/api/heimdal-manager', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        action: "start",
                        taskId: device.id,
                        context: {
                            instance_id: device.id,
                            client_id: deviceData.client_id,
                            camera_name: deviceData.name,
                            detection_blacklist: selectedWords,
                            // rtsp_path ya NO viaja por el navegador: heimdalManager
                            // lee la URL real desde Secrets Manager por dispositivo.
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
                // Apagar pasa por el mismo endpoint que encender: HeimdalManager
                // termina las instancias EC2 etiquetadas con este taskId.
                const response = await fetch('/api/heimdal-manager', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        action: "stop",
                        taskId: device.id,
                    }),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    let detail = errorBody;
                    try { detail = JSON.parse(errorBody)?.message ?? JSON.parse(errorBody)?.error ?? errorBody; } catch {}
                    throw new Error(`Error ${response.status}: ${detail}`);
                }
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
                // El switch queda bloqueado mientras hay una petición pendiente
                // (cambiar el monitoreo, verificar el rol o cargar el plan).
                const switchPending = switchLoading || checkingAdmin || planLoading;
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

                        <LiveView cameraId={device.id} />

                        {!checkingAdmin && !isAdmin && !planLoading && !hasActivePlan && (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                Necesitas un plan activo para encender el monitoreo.{" "}
                                <Link href="/console/billing" className="font-semibold underline hover:text-amber-100">
                                    Ver planes
                                </Link>
                            </div>
                        )}

                        <div className="border-t border-white/10 pt-4 space-y-3">
                            <div>
                                <p className="text-white font-semibold">Palabras de detección</p>
                                <p className="text-gray-400 text-sm">
                                    Selecciona qué debe detectar Heimdall en esta cámara. Los cambios se aplican al (re)iniciar el monitoreo.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {availableWords.map((word) => {
                                    const selected = selectedWords.includes(word);
                                    const isCustom = !DEFAULT_DETECTION_WORDS.includes(word);
                                    return (
                                        <span
                                            key={word}
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                                                selected
                                                    ? "border-blue-400/60 bg-blue-500/20 text-blue-100"
                                                    : "border-white/15 bg-white/5 text-gray-400"
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleWord(word)}
                                                aria-pressed={selected}
                                                className="cursor-pointer"
                                            >
                                                {word}
                                            </button>
                                            {isCustom && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeWord(word)}
                                                    aria-label={`Eliminar ${word}`}
                                                    className="cursor-pointer text-gray-400 hover:text-red-300"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={newWord}
                                    onChange={(e) => setNewWord(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addWord();
                                        }
                                    }}
                                    placeholder="Agregar palabra..."
                                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={addWord}
                                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                            <div>
                                <p className="text-white font-semibold flex items-center gap-2">
                                    Monitoreo
                                    {monitoring && workerOnline !== null && (
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ${
                                            workerOnline
                                                ? "bg-emerald-500/15 text-emerald-300"
                                                : "bg-amber-500/15 text-amber-300"
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${workerOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
                                            {workerOnline ? "worker en línea" : "sin señal del worker"}
                                        </span>
                                    )}
                                </p>
                                <p className="text-gray-400 text-sm">
                                    {monitoring ? "Activo — la cámara está siendo monitoreada" : "Inactivo — haz clic para iniciar el monitoreo"}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {switchPending && (
                                    <span
                                        role="status"
                                        aria-label="Procesando..."
                                        className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-blue-400"
                                    />
                                )}
                                <button
                                    onClick={handleToggleMonitoring}
                                    disabled={switchPending || (!isAdmin && !monitoring && !hasActivePlan)}
                                    title={
                                        !isAdmin && !monitoring && !hasActivePlan
                                            ? "Necesitas un plan activo"
                                            : undefined
                                    }
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                        monitoring ? "bg-blue-500" : "bg-white/15"
                                    } ${switchPending || (!isAdmin && !monitoring && !hasActivePlan) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                                            monitoring ? "translate-x-8" : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>
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
