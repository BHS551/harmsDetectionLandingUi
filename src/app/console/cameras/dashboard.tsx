"use client";

import React, { useState } from 'react';

interface Device {
    id: string;
    raw: string;
    created_at: string;
}

const Dashboard: React.FC = () => {
    const [devices, setDevices] = React.useState<Device[]>([]);
    const [loadingDeviceInfo, setloadingDeviceInfo] = React.useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchDevices = async () => {
        try {
            const response = await fetch('https://wex0c6038j.execute-api.us-east-1.amazonaws.com/default/listDevices?limit=5000', {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            });
            const data = await response.json();
            const items = data.items ? data.items.sort((a:any, b:any) => b.id.localeCompare(a.id)) : [];
            setDevices(items);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
        } finally {
            setloadingDeviceInfo(false);
        }
    };

    React.useEffect(() => {
        fetchDevices();
    }, []);

    return (
        <div className="max-w-7xl mx-auto">
            
            {loadingDeviceInfo ? (
                <div className="text-center text-black">Loading...</div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                    <table className="w-full">
                        <thead className="bg-slate-700 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Id</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Client Id</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.map((device) => (
                                <tr key={device.id} className="border-t border-slate-700 hover:bg-slate-700/50 transition">
                                    <td className="px-6 py-4 text-gray-300">{device.id}</td>
                                    <td className="px-6 py-4 text-gray-300">{JSON.parse(device.raw).name}</td>
                                    <td className="px-6 py-4 text-gray-300">{JSON.parse(device.raw).client_id}</td>
                                    <td className="px-6 py-4 text-gray-300">{device.created_at}</td>
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
                            alt="Maximized Device" 
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