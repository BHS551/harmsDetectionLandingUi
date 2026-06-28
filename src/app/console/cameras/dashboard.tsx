"use client";

import React, { useState } from 'react';
import { auth } from "@/lib/firebase";
import { useRouter } from 'next/navigation';

interface Device {
    id: string;
    raw: string;
    created_at: string;
}

type DeviceRaw = {
    name?: string;
    client_id?: string;
};

const Dashboard: React.FC = () => {
    const [devices, setDevices] = React.useState<Device[]>([]);
    const [loadingDeviceInfo, setloadingDeviceInfo] = React.useState(true);
    const [devicesError, setDevicesError] = useState<string | null>(null);
    const router = useRouter();

    const fetchDevices = async () => {
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

            if (response.status === 401) throw new Error("Unauthorized");
            if (!response.ok) throw new Error("Failed to fetch devices");

            const data = await response.json();
            const items = data.items ? data.items.sort((a:any, b:any) => b.id.localeCompare(a.id)) : [];
            setDevices(items);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch devices';
            setDevicesError(message);
        } finally {
            setloadingDeviceInfo(false);
        }
    };

    React.useEffect(() => {
        fetchDevices();
    }, []);

    return (
        <div className="max-w-7xl mx-auto">
            {devicesError && (
                <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    No se pudieron cargar las cámaras: {devicesError}
                </div>
            )}

            {loadingDeviceInfo ? (
                <div className="text-center text-gray-400 py-8">Cargando...</div>
            ) : devices.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-gray-400">
                    Aún no tienes cámaras registradas. Agrega tu primera cámara para comenzar.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-white/10">
                    <table className="w-full">
                        <thead className="bg-white/5 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">ID del cliente</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Fecha de registro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.map((device) => {
                                const deviceData = JSON.parse(device.raw) as DeviceRaw;
                                return (
                                    <tr
                                        key={device.id}
                                        className="border-t border-white/10 hover:bg-white/5 transition cursor-pointer"
                                        onClick={() => router.push(`/console/cameras/${device.id}`)}
                                    >
                                        <td className="px-6 py-4 text-gray-300">{device.id}</td>
                                        <td className="px-6 py-4 text-gray-300">{deviceData.name || "-"}</td>
                                        <td className="px-6 py-4 text-gray-300">{deviceData.client_id || "-"}</td>
                                        <td className="px-6 py-4 text-gray-300">{device.created_at}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
