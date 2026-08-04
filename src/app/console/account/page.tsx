"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePlan } from "@/lib/usePlan";
import { getPlan } from "@/lib/plans";
import { ConsoleProtectedPage } from "../login";

// Lambda userSettings (DynamoDB): guarda los canales de notificación por uid.
const USER_SETTINGS_URL = "https://c79g0ndri3.execute-api.us-east-1.amazonaws.com/";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9()\-\s]{7,20}$/;

type SavedSettings = {
    notificationEmail?: string;
    notificationPhone?: string;
    updatedAt?: string;
} | null;

export default function AccountPage() {
    const { subscription, hasActivePlan } = usePlan();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    // Marca los campos que se prellenaron desde la cuenta (Google) y aún no se guardan.
    const [emailFromAccount, setEmailFromAccount] = useState(false);
    const [phoneFromAccount, setPhoneFromAccount] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                const token = await currentUser.getIdToken();
                const response = await fetch(USER_SETTINGS_URL, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                const saved: SavedSettings = response.ok ? data.settings : null;

                if (saved && (saved.notificationEmail || saved.notificationPhone)) {
                    setEmail(saved.notificationEmail || "");
                    setPhone(saved.notificationPhone || "");
                    setUpdatedAt(saved.updatedAt || null);
                } else {
                    // Sin configuración guardada: se cargan los datos que el usuario
                    // ya compartió al iniciar sesión (p. ej. con su cuenta de Google).
                    if (currentUser.email) {
                        setEmail(currentUser.email);
                        setEmailFromAccount(true);
                    }
                    if (currentUser.phoneNumber) {
                        setPhone(currentUser.phoneNumber);
                        setPhoneFromAccount(true);
                    }
                }
            } catch {
                setFeedback({
                    kind: "error",
                    text: "No se pudo cargar tu configuración. Recarga la página para intentarlo de nuevo.",
                });
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        setFeedback(null);

        const trimmedEmail = email.trim();
        const trimmedPhone = phone.trim();

        if (!trimmedEmail && !trimmedPhone) {
            setFeedback({ kind: "error", text: "Configura al menos un canal: correo o teléfono." });
            return;
        }
        if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
            setFeedback({ kind: "error", text: "El correo de notificaciones no parece válido." });
            return;
        }
        if (trimmedPhone && !PHONE_PATTERN.test(trimmedPhone)) {
            setFeedback({ kind: "error", text: "El teléfono no parece válido. Usa el formato +57 300 123 4567." });
            return;
        }

        setSaving(true);
        try {
            const currentUser = auth?.currentUser;
            if (!currentUser) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");

            const token = await currentUser.getIdToken();
            const response = await fetch(USER_SETTINGS_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    notificationEmail: trimmedEmail,
                    notificationPhone: trimmedPhone,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "No se pudo guardar la configuración.");
            }

            setUpdatedAt(data.settings?.updatedAt || new Date().toISOString());
            setEmailFromAccount(false);
            setPhoneFromAccount(false);
            setFeedback({ kind: "ok", text: "Configuración guardada. Ahí te llegarán las alertas de tus cámaras." });
        } catch (err) {
            setFeedback({
                kind: "error",
                text: err instanceof Error ? err.message : "No se pudo guardar la configuración.",
            });
        } finally {
            setSaving(false);
        }
    };

    const displayName = user?.displayName || user?.email?.split("@")[0] || "Usuario";
    const initial = displayName.charAt(0).toUpperCase();
    const isGoogleAccount = user?.providerData.some((p) => p.providerId === "google.com") ?? false;
    const currentPlan = getPlan(subscription?.plan);

    return (
        <ConsoleProtectedPage
            title="Mi cuenta"
            subtitle="Tu perfil y los canales donde quieres recibir las alertas."
        >
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                {/* Identidad */}
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8">
                    {/* Acento decorativo */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl"
                    />

                    <div className="flex items-center gap-5">
                        <div className="rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 p-[3px]">
                            <div className="grid h-20 w-20 place-items-center rounded-full bg-[#0b0b0b] text-3xl font-bold text-white">
                                {initial}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h2 className="truncate text-2xl font-semibold text-white">{displayName}</h2>
                            <p className="truncate text-sm text-gray-400">{user?.email || "—"}</p>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300">
                            {isGoogleAccount ? (
                                <>
                                    <span className="font-bold text-blue-300">G</span>
                                    Cuenta de Google
                                </>
                            ) : (
                                <>✉ Correo y contraseña</>
                            )}
                        </span>
                        <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                                hasActivePlan
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                    : "border-white/10 bg-white/5 text-gray-400"
                            }`}
                        >
                            {hasActivePlan && currentPlan ? `Plan ${currentPlan.name}` : "Sin plan activo"}
                        </span>
                    </div>

                    <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-400">
                        <p>
                            Estos datos identifican tu sesión. Los canales de notificación se
                            configuran a la derecha y solo se usan para avisarte de las
                            detecciones de tus cámaras.
                        </p>
                    </div>
                </section>

                {/* Canales de notificación */}
                <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-300">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-5 w-5"
                                aria-hidden="true"
                            >
                                <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z" />
                                <path
                                    fillRule="evenodd"
                                    d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </span>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Canales de notificación</h2>
                            <p className="text-sm text-gray-400">
                                Aquí te avisaremos cuando tus cámaras detecten algo.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="mt-8 space-y-4">
                            <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
                            <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
                            <div className="h-12 w-40 animate-pulse rounded-2xl bg-white/5" />
                        </div>
                    ) : (
                        <div className="mt-8 space-y-5">
                            <label className="block">
                                <span className="mb-2 block text-sm text-gray-300">
                                    Correo para notificaciones
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setEmailFromAccount(false);
                                    }}
                                    placeholder="tucorreo@ejemplo.com"
                                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-blue-500"
                                />
                                {emailFromAccount && (
                                    <span className="mt-2 block text-xs text-blue-300">
                                        Cargado desde tu cuenta de Google — puedes cambiarlo y guardar.
                                    </span>
                                )}
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm text-gray-300">
                                    Teléfono para notificaciones
                                </span>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(event) => {
                                        setPhone(event.target.value);
                                        setPhoneFromAccount(false);
                                    }}
                                    placeholder="+57 300 123 4567"
                                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-blue-500"
                                />
                                {phoneFromAccount && (
                                    <span className="mt-2 block text-xs text-blue-300">
                                        Cargado desde tu cuenta — puedes cambiarlo y guardar.
                                    </span>
                                )}
                            </label>

                            {feedback && (
                                <p
                                    className={`rounded-2xl border px-4 py-3 text-sm ${
                                        feedback.kind === "ok"
                                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                            : "border-red-500/30 bg-red-500/10 text-red-200"
                                    }`}
                                >
                                    {feedback.text}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? "Guardando..." : "Guardar configuración"}
                                </button>
                                {updatedAt && (
                                    <span className="text-xs text-gray-500">
                                        Última actualización:{" "}
                                        {new Date(updatedAt).toLocaleString("es-CO", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </ConsoleProtectedPage>
    );
}
