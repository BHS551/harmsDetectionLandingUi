'use client';

import { useState } from 'react';


interface FormData {
    rtsp_path: string;
    name: string;
    client_id: string;
}

export default function CameraForm() {
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
            console.log('Submitting form data:', formData);
            const response = await fetch('https://dakl314nma.execute-api.us-east-1.amazonaws.com/default/storeDevice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setMessage('Device added successfully!');
                setFormData({ rtsp_path: '', name: '', client_id: '' });
            } else {
                setMessage('Failed to add device. Please try again.');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8 space-y-6"
            >
                <h1 className="text-3xl font-bold text-slate-800 text-center">
                    Add Camera Device
                </h1>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Device Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter device name"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        RTSP Path
                    </label>
                    <input
                        type="text"
                        name="rtsp_path"
                        value={formData.rtsp_path}
                        onChange={handleChange}
                        placeholder="rtsp://..."
                        required
                        className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Client ID
                    </label>
                    <input
                        type="text"
                        name="client_id"
                        value={formData.client_id}
                        onChange={handleChange}
                        placeholder="Enter client ID"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-2 rounded-lg transition duration-200"
                >
                    {loading ? 'Adding Device...' : 'Add Device'}
                </button>

                {message && (
                    <p
                        className={`text-center text-sm font-medium ${
                            message.includes('successfully')
                                ? 'text-green-600'
                                : 'text-red-600'
                        }`}
                    >
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}