"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { usePlan } from "@/lib/usePlan";
import { useIsAdmin } from "@/lib/useAdmin";
import { PLANS, formatPrice, getPlan } from "@/lib/plans";
import { ConsoleProtectedPage } from "../login";

function BillingContent() {
  const searchParams = useSearchParams();
  const { subscription, loading, hasActivePlan } = usePlan();
  const { isAdmin } = useIsAdmin();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Los planes exclusivos para administradores solo se muestran a admins.
  const visiblePlans = PLANS.filter((plan) => !plan.adminOnly || isAdmin);

  const justSucceeded = searchParams.get("success") === "1";
  const canceled = searchParams.get("canceled") === "1";
  const payuReturn = searchParams.get("provider") === "payu";

  const currentPlan = getPlan(subscription?.plan);

  // PayU WebCheckout requiere enviar un formulario por POST a la pasarela.
  const submitPayuForm = (action: string, fields: Record<string, string>) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const handleSubscribe = async (planId: string) => {
    setError(null);
    setCheckoutLoading(planId);

    try {
      const user = auth?.currentUser;
      if (!user) throw new Error("Inicia sesión para suscribirte.");

      const token = await user.getIdToken();
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo iniciar el pago.");
      }

      if (data.provider === "payu" && data.action && data.fields) {
        submitPayuForm(data.action, data.fields);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("No se pudo iniciar el pago.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {justSucceeded && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          ¡Pago completado! Tu plan se activará en unos segundos.
        </div>
      )}
      {payuReturn && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          Estamos confirmando tu pago con PayU. Tu plan se activará en cuanto se
          apruebe la transacción.
        </div>
      )}
      {canceled && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          El proceso de pago se canceló. Puedes intentarlo de nuevo cuando quieras.
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Estado actual */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-gray-400">Tu plan actual</p>
        {loading ? (
          <p className="mt-2 text-gray-400">Cargando...</p>
        ) : hasActivePlan && currentPlan ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-xl font-semibold text-white">{currentPlan.name}</span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              Activo
            </span>
            <span className="text-sm text-gray-400">
              Hasta {currentPlan.maxCameras} cámaras monitoreadas
            </span>
          </div>
        ) : (
          <p className="mt-2 text-gray-300">
            No tienes un plan activo. Suscríbete para empezar a monitorear tus cámaras.
          </p>
        )}
      </div>

      {/* Planes */}
      <div>
        <h2 className="text-lg font-semibold text-white">Planes disponibles</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePlans.map((plan) => {
            const isCurrent = hasActivePlan && subscription?.plan === plan.id;
            return (
              <div
                key={plan.id}
                className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  {plan.adminOnly && (
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-300">
                      Solo administradores
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {formatPrice(plan)}
                </p>
                <ul className="mt-6 space-y-3 text-sm text-gray-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-blue-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrent || checkoutLoading !== null}
                  className="mt-8 w-full rounded-2xl bg-blue-500 px-4 py-3 font-semibold text-black transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCurrent
                    ? "Plan actual"
                    : checkoutLoading === plan.id
                      ? "Redirigiendo..."
                      : "Suscribirme"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <ConsoleProtectedPage
      title="Planes y suscripción"
      subtitle="Gestiona tu plan y la cantidad de cámaras que puedes monitorear."
    >
      <Suspense fallback={<div className="text-gray-400">Cargando...</div>}>
        <BillingContent />
      </Suspense>
    </ConsoleProtectedPage>
  );
}
