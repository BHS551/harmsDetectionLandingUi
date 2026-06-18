'use client';

import { useState } from 'react';
import { auth } from "@/lib/firebase";


interface FormData {
    rtsp_path: string;
    name: string;
    client_id: string;
}

export default function CameraForm({ onSuccess }: { onSuccess?: () => void }) {
    const [formData, setFormData] = useState<FormData>({
        rtsp_path: '',
        name: '',
        client_id: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const user = auth?.currentUser;

            if (!user) {
                throw new Error("No authenticated user");
            }

            const token = await user.getIdToken();
            console.log('Submitting form data:', formData);
            const response = await fetch('https://dakl314nma.execute-api.us-east-1.amazonaws.com/default/storeDevice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.status === 401) {
                setMessage('Unauthorized. Please sign in again.');
                return;
            }

            if (response.ok) {
                setMessage('Device added successfully!');
                setFormData({ rtsp_path: '', name: '', client_id: '' });
                onSuccess?.();
            } else {
                setMessage('Failed to add device. Please try again.');
            }
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border-t border-slate-700 pt-8">
            <h2 className="text-lg font-semibold text-white mb-4 text-center">Add Camera Device</h2>
            <form
                onSubmit={handleSubmit}
                className="max-w-xl mx-auto bg-slate-800 rounded-lg p-6 space-y-4"
            >
                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        Device Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter device name"
                        required
                        className="w-full px-4 py-2 rounded-lg bg-black/40 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        RTSP Path
                    </label>
                    <input
                        type="text"
                        name="rtsp_path"
                        value={formData.rtsp_path}
                        onChange={handleChange}
                        placeholder="rtsp://..."
                        required
                        className="w-full px-4 py-2 rounded-lg bg-black/40 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        Client ID
                    </label>
                    <input
                        type="text"
                        name="client_id"
                        value={formData.client_id}
                        onChange={handleChange}
                        placeholder="Enter client ID"
                        required
                        className="w-full px-4 py-2 rounded-lg bg-black/40 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-2 rounded-lg transition"
                >
                    {loading ? 'Adding Device...' : 'Add Device'}
                </button>

                {message && (
                    <p className={`text-sm font-medium ${
                        message.includes('successfully') ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}
