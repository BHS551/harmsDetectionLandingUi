"use client";

import React from 'react';

interface Detection {
    id: string;
    raw: string;
}



const Dashboard: React.FC = () => {
    const [detections, setDetections] = React.useState<Detection[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchDetections = async () => {
            try {
                const response = await fetch('https://zs8vnk4zv0.execute-api.us-east-1.amazonaws.com/default/listDetections?limit=50', {
                    method: "GET",
                    // keep headers minimal while testing
                    headers: {
                        Accept: "application/json",
                    },
                    // no credentials unless you really need cookies
                    // credentials: "include",
                });
                const data = await response.json();
                setDetections(data.items || []);
            } catch (error) {
                console.error('Failed to fetch detections:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetections();
    }, []);

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Detections Dashboard</h1>
            
            {loading ? (
                <div className="text-center text-gray-400">Loading...</div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                    <table className="w-full">
                        <thead className="bg-slate-700 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Device ID</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Camera Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold">Screenshot</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detections.map((detection) => (
                                <tr key={detection.id} className="border-t border-slate-700 hover:bg-slate-700/50 transition">
                                    <td className="px-6 py-4 text-gray-300">{detection.id}</td>
                                    <td className="px-6 py-4 text-gray-300">{JSON.stringify(detection.raw)}</td>
                                    <td className="px-6 py-4">
                                        {/* <img src={detection.screenshot} alt="Detection" className="h-12 rounded" /> */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Dashboard;