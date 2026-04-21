"use client";

import React, { useState } from 'react';
import { auth } from "@/lib/firebase";

interface Detection {
    id: string;
    raw: string;
}

type DetectionRaw = {
  detection_id?: string;
  cammera?: string;
  cosine_sim?: string | number;
};

type ScreenshotItem = {
  key: string;
  size: number;
  lastModified: string;
  url: string;
};

const Dashboard: React.FC = () => {
    const [detections, setDetections] = React.useState<Detection[]>([]);
    const [loadingDetectionInfo, setloadingDetectionInfo] = React.useState(true);
    const [loadingDetectionScreenshots, setloadingDetectionScreenshots] = React.useState(true);
    const [items, setItems] = useState<ScreenshotItem[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [screenshotsError, setScreenshotsError] = useState<string | null>(null);
    const [detectionsError, setDetectionsError] = useState<string | null>(null);

    const fetchDetections = async () => {
        try {
            const user = auth?.currentUser;

            if (!user) {
                throw new Error("No authenticated user");
            }

            const token = await user.getIdToken();
            const response = await fetch(' https://xs7uvyebj5.execute-api.us-east-1.amazonaws.com/default/listDetections', {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                throw new Error("Unauthorized");
            }

            if (!response.ok) {
                throw new Error("Failed to fetch detections");
            }

            const data = await response.json();
            const items = data.items ? data.items.sort((a:any, b:any) => b.id.localeCompare(a.id)) : [];
            setDetections(items);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch detections';
            setDetectionsError(message);
            console.error('Failed to fetch detections:', error);
        } finally {
            setloadingDetectionInfo(false);
        }
    };
    
    async function fetchScreenshots() {
        try {
            const res = await fetch("/api/screenshots");
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to load screenshots");
            }
            setItems(data.items);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load screenshots";
            setScreenshotsError(message);
            console.error(err);
        } finally {
            setloadingDetectionScreenshots(false);
        }
    }

    React.useEffect(() => {
        fetchDetections();
        fetchScreenshots();
    }, []);

    return (
        <div className="max-w-7xl mx-auto">
            {detectionsError ? (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Detections unavailable: {detectionsError}
                </div>
            ) : null}

            {screenshotsError ? (
                <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    Screenshots unavailable: {screenshotsError}
                </div>
            ) : null}
            
            {loadingDetectionInfo || loadingDetectionScreenshots ? (
                <div className="text-center text-gray-400">Loading...</div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                    <table className="w-full">
                        <thead className="bg-slate-700 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Detection</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Camera Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">accuracy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detections.map((detection) => {
                                const detectionData = JSON.parse(detection.raw) as DetectionRaw;
                                const detectionImage =
                                  items.find((item) =>
                                    detectionData.detection_id
                                      ? item.key.includes(detectionData.detection_id)
                                      : false
                                  )?.url ?? null;

                                return (
                                  <tr key={detection.id} className="border-t border-slate-700 hover:bg-slate-700/50 transition">
                                      <td className="px-6 py-4">
                                          {detectionImage ? (
                                            <img
                                              src={detectionImage}
                                              alt="Detection"
                                              className="h-12 rounded cursor-pointer hover:opacity-80 transition"
                                              onClick={() => setSelectedImage(detectionImage)}
                                            />
                                          ) : (
                                            <div className="flex h-12 w-20 items-center justify-center rounded bg-slate-800 text-xs text-gray-400">
                                              No image
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

            {/* Modal for maximized image */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-screen" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={selectedImage} 
                            alt="Maximized Detection" 
                            className="max-w-full max-h-screen object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
