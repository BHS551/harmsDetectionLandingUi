"use client";

import React, { useState } from 'react';

interface Detection {
    id: string;
    raw: string;
}

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

    const fetchDetections = async () => {
        try {
            const response = await fetch('https://zs8vnk4zv0.execute-api.us-east-1.amazonaws.com/default/listDetections?limit=5000', {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            });
            const data = await response.json();
            const items = data.items ? data.items.sort((a:any, b:any) => b.id.localeCompare(a.id)) : [];
            setDetections(items);
        } catch (error) {
            console.error('Failed to fetch detections:', error);
        } finally {
            setloadingDetectionInfo(false);
        }
    };
    
    async function fetchScreenshots() {
        try {
            const res = await fetch("/api/screenshots");
            console.log(res)
            if (!res.ok) throw new Error("Failed to load screenshots");
            const data = await res.json();
            setItems(data.items);
        } catch (err) {
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
            <h1 className="text-3xl font-bold text-white mb-8">Detections Dashboard</h1>
            
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
                            </tr>
                        </thead>
                        <tbody>
                            {detections.map((detection) => (
                                <tr key={detection.id} className="border-t border-slate-700 hover:bg-slate-700/50 transition">
                                    <td className="px-6 py-4">
                                        <img 
                                            src={items.find(item => item.key.includes(JSON.parse(detection.raw).detection_id))?.url || ""} 
                                            alt="Detection" 
                                            className="h-12 rounded cursor-pointer hover:opacity-80 transition"
                                            onClick={() => setSelectedImage(items.find(item => item.key.includes(JSON.parse(detection.raw).detection_id))?.url || null)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{JSON.parse(detection.raw).cammera}</td>
                                    <td className="px-6 py-4 text-gray-300">{detection.id.split('.')[0]}</td>
                                </tr>
                            ))}
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