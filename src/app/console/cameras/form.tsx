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
            const response = await fetch('https://dakl314nma.execute-api.us-east-1.amazonaws.com/default/storeDevice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.status === 401) {
                setMessage('Tu sesión expiró. Vuelve a iniciar sesión.');
                return;
            }

            if (response.ok) {
                setMessage('¡Cámara agregada correctamente!');
                setFormData({ rtsp_path: '', name: '', client_id: '' });
                onSuccess?.();
            } else {
                setMessage('No se pudo agregar la cámara. Inténtalo de nuevo.');
            }
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Ocurrió un error. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border-t border-white/10 pt-8">
            <h2 className="text-lg font-semibold text-white mb-4 text-center">Agregar cámara</h2>
            <form
                onSubmit={handleSubmit}
                className="max-w-xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4"
            >
                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        Nombre de la cámara
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ej: Entrada principal"
                        required
                        className="w-full px-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        Ruta RTSP
                    </label>
                    <input
                        type="text"
                        name="rtsp_path"
                        value={formData.rtsp_path}
                        onChange={handleChange}
                        placeholder="rtsp://..."
                        required
                        className="w-full px-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        ID del cliente
                    </label>
                    <input
                        type="text"
                        name="client_id"
                        value={formData.client_id}
                        onChange={handleChange}
                        placeholder="Ingresa el ID del cliente"
                        required
                        className="w-full px-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-2 rounded-2xl transition"
                >
                    {loading ? 'Agregando...' : 'Agregar cámara'}
                </button>

                {message && (
                    <p className={`text-sm font-medium ${
                        message.includes('correctamente') ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}
