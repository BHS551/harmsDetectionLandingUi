"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
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

                if (!response.ok) throw new Error("Failed to fetch devices");

                const data = await response.json();
                const found = data.items?.find((d: Device) => d.id === id);
                if (!found) throw new Error("Device not found");
                setDevice(found);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error loading device");
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
                setSwitchMessage("Monitoring started successfully");
            } else {
                setMonitoring(false);
                localStorage.removeItem(`monitoring_${device.id}`);
                setSwitchMessage("Monitoring stopped");
            }
        } catch (err) {
            setSwitchMessage(err instanceof Error ? err.message : "Error toggling monitoring");
        } finally {
            setSwitchLoading(false);
        }
    };

    return (
        <ConsoleProtectedPage
            title="Device Detail"
            subtitle="Manage monitoring for this camera."
        >
            <button
                onClick={() => router.back()}
                className="mb-6 text-sm text-gray-400 hover:text-white transition"
            >
                ← Back to cameras
            </button>

            {loading && <div className="text-center text-gray-400">Loading...</div>}

            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            {device && (() => {
                const deviceData = JSON.parse(device.raw) as DeviceRaw;
                return (
                    <div className="max-w-xl bg-slate-800 rounded-lg p-6 space-y-6">
                        <div className="space-y-3">
                            <div>
                                <span className="text-gray-400 text-sm">Name</span>
                                <p className="text-white font-semibold">{deviceData.name || "-"}</p>
                            </div>
                            <div>
                                <span className="text-gray-400 text-sm">Client ID</span>
                                <p className="text-white font-semibold">{deviceData.client_id || "-"}</p>
                            </div>
                            <div>
                                <span className="text-gray-400 text-sm">RTSP Path</span>
                                <p className="text-white font-semibold break-all">{deviceData.rtsp_path || "-"}</p>
                            </div>
                            <div>
                                <span className="text-gray-400 text-sm">Created At</span>
                                <p className="text-white font-semibold">{device.created_at}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                            <div>
                                <p className="text-white font-semibold">Monitoring</p>
                                <p className="text-gray-400 text-sm">
                                    {monitoring ? "Active — camera is being monitored" : "Inactive — click to start monitoring"}
                                </p>
                            </div>
                            <button
                                onClick={handleToggleMonitoring}
                                disabled={switchLoading}
                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                    monitoring ? "bg-blue-500" : "bg-slate-600"
                                } ${switchLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
                                switchMessage.includes("successfully") || switchMessage.includes("stopped")
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
