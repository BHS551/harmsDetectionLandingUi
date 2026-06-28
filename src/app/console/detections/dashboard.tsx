"use client";

import React, { useState } from 'react';
import { auth } from "@/lib/firebase";

interface Detection {
    id: string;
    raw: string;
    image_url?: string;
}

type DetectionRaw = {
  detection_id?: string;
  cammera?: string;
  cosine_sim?: string | number;
};

const Dashboard: React.FC = () => {
    const [detections, setDetections] = React.useState<Detection[]>([]);
    const [loadingDetectionInfo, setloadingDetectionInfo] = React.useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [detectionsError, setDetectionsError] = useState<string | null>(null);

    const fetchDetections = async () => {
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error("No authenticated user");

            const token = await user.getIdToken();
            const response = await fetch('https://xs7uvyebj5.execute-api.us-east-1.amazonaws.com/default/listDetections', {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) throw new Error("Unauthorized");
            if (!response.ok) throw new Error("Failed to fetch detections");

            const data = await response.json();
            const items = data.items ? data.items.sort((a:any, b:any) => b.id.localeCompare(a.id)) : [];
            setDetections(items);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudieron cargar las detecciones';
            setDetectionsError(message);
            console.error('Failed to fetch detections:', error);
        } finally {
            setloadingDetectionInfo(false);
        }
    };

    React.useEffect(() => {
        fetchDetections();
    }, []);

    return (
        <div className="max-w-7xl mx-auto">
            {detectionsError && (
                <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    No se pudieron cargar las detecciones: {detectionsError}
                </div>
            )}

            {loadingDetectionInfo ? (
                <div className="text-center text-gray-400 py-8">Cargando...</div>
            ) : detections.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-gray-400">
                    Aún no hay detecciones registradas.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-white/10">
                    <table className="w-full">
                        <thead className="bg-white/5 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Detección</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Cámara</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Fecha</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Similitud</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detections.map((detection) => {
                                const detectionData = JSON.parse(detection.raw) as DetectionRaw;
                                const detectionImage = detection.image_url ?? null;

                                return (
                                    <tr key={detection.id} className="border-t border-white/10 hover:bg-white/5 transition">
                                        <td className="px-6 py-4">
                                            {detectionImage ? (
                                                <img
                                                    src={detectionImage}
                                                    alt="Detección"
                                                    className="h-12 rounded cursor-pointer hover:opacity-80 transition"
                                                    onClick={() => setSelectedImage(detectionImage)}
                                                />
                                            ) : (
                                                <div className="flex h-12 w-20 items-center justify-center rounded bg-white/5 text-xs text-gray-400">
                                                    Sin imagen
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{detectionData.cammera || "-"}</td>
                                        <td className="px-6 py-4 text-gray-300">{detection.id.split('.')[0]}</td>
                                        <td className="px-6 py-4 text-gray-300">{detectionData.cosine_sim ?? "-"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-screen" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={selectedImage}
                            alt="Detección ampliada"
                            className="max-w-full max-h-screen object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;