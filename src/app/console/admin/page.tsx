"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useIsAdmin } from "@/lib/useAdmin";
import { PLANS, getPlan } from "@/lib/plans";
import { SUBSCRIPTIONS_URL, Subscription } from "@/lib/usePlan";
import { ConsoleProtectedPage } from "../login";

export default function AdminPage() {
    const { isAdmin, checking } = useIsAdmin();
    const [identifier, setIdentifier] = useState("");
    const [planId, setPlanId] = useState(PLANS[0]?.id ?? "cam5");
    const [working, setWorking] = useState(false);
    const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [subsLoading, setSubsLoading] = useState(true);

    const loadSubscriptions = useCallback(async () => {
        const user = auth?.currentUser;
        if (!user) return;
        setSubsLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${SUBSCRIPTIONS_URL}?all=1`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok) setSubs(data.subscriptions ?? []);
        } catch {
            // La tabla puede mostrarse vacía; el error real aparece al operar.
        } finally {
            setSubsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) loadSubscriptions();
    }, [isAdmin, loadSubscriptions]);

    const runAction = async (
        action: "activate" | "deactivate",
        target?: string,
        planOverride?: string,
    ) => {
        setFeedback(null);
        const ident = (target ?? identifier).trim();
        if (!ident) {
            setFeedback({ kind: "error", text: "Escribe el correo o uid del usuario." });
            return;
        }

        setWorking(true);
        try {
            const user = auth?.currentUser;
            if (!user) throw new Error("Sesión expirada.");

            const token = await user.getIdToken();
            const response = await fetch(SUBSCRIPTIONS_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action, identifier: ident, planId: planOverride ?? planId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "La operación falló.");

            setFeedback({
                kind: "ok",
                text:
                    action === "activate"
                        ? `Plan ${data.subscription?.plan} activado para ${data.subscription?.email || ident}.`
                        : `Suscripción de ${data.subscription?.email || ident} desactivada.`,
            });
            if (!target) setIdentifier("");
            await loadSubscriptions();
        } catch (err) {
            setFeedback({
                kind: "error",
                text: err instanceof Error ? err.message : "La operación falló.",
            });
        } finally {
            setWorking(false);
        }
    };

    return (
        <ConsoleProtectedPage
            title="Administración"
            subtitle="Activa y gestiona los planes de los usuarios."
        >
            {checking ? (
                <div className="text-gray-400">Verificando permisos...</div>
            ) : !isAdmin ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Esta sección es solo para administradores.
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Activar plan */}
                    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                        <h2 className="text-lg font-semibold text-white">Activar un plan</h2>
                        <p className="mt-1 text-sm text-gray-400">
                            Usa el correo que llega en la solicitud de plan. La activación es
                            inmediata; el usuario solo tiene que recargar la consola.
                        </p>
                        <div className="mt-5 flex flex-col gap-3 md:flex-row">
                            <input
                                type="text"
                                value={identifier}
                                onChange={(event) => setIdentifier(event.target.value)}
                                placeholder="correo@usuario.com o uid"
                                className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-blue-500"
                            />
                            <select
                                value={planId}
                                onChange={(event) => setPlanId(event.target.value)}
                                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                            >
                                {PLANS.map((plan) => (
                                    <option key={plan.id} value={plan.id} className="bg-black">
                                        {plan.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => runAction("activate")}
                                disabled={working}
                                className="rounded-2xl bg-blue-500 px-6 py-3 font-semibold text-black transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {working ? "Aplicando..." : "Activar plan"}
                            </button>
                        </div>
                        {feedback && (
                            <p
                                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                                    feedback.kind === "ok"
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                        : "border-red-500/30 bg-red-500/10 text-red-200"
                                }`}
                            >
                                {feedback.text}
                            </p>
                        )}
                    </section>

                    {/* Suscripciones existentes */}
                    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Suscripciones</h2>
                            <button
                                type="button"
                                onClick={loadSubscriptions}
                                className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-blue-500/60 hover:text-blue-300"
                            >
                                Actualizar
                            </button>
                        </div>

                        {subsLoading ? (
                            <p className="mt-4 text-gray-400">Cargando...</p>
                        ) : subs.length === 0 ? (
                            <p className="mt-4 text-gray-400">Aún no hay suscripciones.</p>
                        ) : (
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400">
                                            <th className="py-3 pr-4 font-medium">Usuario</th>
                                            <th className="py-3 pr-4 font-medium">Plan</th>
                                            <th className="py-3 pr-4 font-medium">Estado</th>
                                            <th className="py-3 pr-4 font-medium">Actualizado</th>
                                            <th className="py-3 font-medium">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subs.map((sub) => (
                                            <tr key={sub.uid} className="border-b border-white/5 text-gray-200">
                                                <td className="py-3 pr-4">
                                                    <span className="block">{sub.email || "(sin correo)"}</span>
                                                    <span className="block max-w-[220px] truncate font-mono text-xs text-gray-500">
                                                        {sub.uid}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4">{getPlan(sub.plan)?.name ?? sub.plan}</td>
                                                <td className="py-3 pr-4">
                                                    <span
                                                        className={`rounded-full border px-2.5 py-0.5 text-xs ${
                                                            sub.status === "active"
                                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                                                : "border-white/10 bg-white/5 text-gray-400"
                                                        }`}
                                                    >
                                                        {sub.status === "active" ? "Activo" : "Inactivo"}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 text-gray-400">
                                                    {sub.updatedAt
                                                        ? new Date(sub.updatedAt).toLocaleString("es-CO", {
                                                              dateStyle: "short",
                                                              timeStyle: "short",
                                                          })
                                                        : "—"}
                                                </td>
                                                <td className="py-3">
                                                    {sub.status === "active" ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => runAction("deactivate", sub.uid)}
                                                            disabled={working}
                                                            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition hover:border-red-500/60 hover:text-red-300 disabled:opacity-50"
                                                        >
                                                            Desactivar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => runAction("activate", sub.uid, sub.plan)}
                                                            disabled={working}
                                                            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition hover:border-emerald-500/60 hover:text-emerald-300 disabled:opacity-50"
                                                        >
                                                            Reactivar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </ConsoleProtectedPage>
    );
}
