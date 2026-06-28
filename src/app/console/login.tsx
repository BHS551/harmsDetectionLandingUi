"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

const navigationItems = [
  { href: "/console", label: "Inicio" },
  { href: "/console/detections", label: "Detecciones" },
  { href: "/console/cameras", label: "Cámaras" },
  { href: "/console/rovers", label: "Rovers" },
];

function getFirebaseMessage(code?: string) {
  switch (code) {
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta otra vez en unos minutos.";
    case "auth/email-already-in-use":
      return "Ese correo ya está registrado.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/popup-closed-by-user":
      return "Cerraste la ventana de Google antes de completar el acceso.";
    case "auth/popup-blocked":
      return "El navegador bloqueó la ventana emergente de Google.";
    case "auth/unauthorized-domain":
      return "Este dominio no está autorizado.";
    default:
      return "No se pudo iniciar sesión. Inténtalo de nuevo.";
  }
}

function getUserLabel(user: User | null) {
  if (!user) {
    return "";
  }

  return user.displayName || user.email || "Usuario autenticado";
}

export function isConsoleSessionActive() {
  return Boolean(auth?.currentUser);
}

export function ConsoleHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userLabel, setUserLabel] = useState("");

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserLabel(getUserLabel(user));
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }

    router.replace("/console/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
            SkyEye Console
          </p>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-300">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <nav>
            <ul className="flex flex-wrap gap-3 text-sm text-gray-300">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`rounded-full border px-4 py-2 transition ${
                        isActive
                          ? "border-blue-500 bg-blue-500/10 text-blue-300"
                          : "border-white/10 hover:border-blue-500/60 hover:text-blue-300"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {userLabel ? (
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <span>Sesión: {userLabel}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/10 px-4 py-2 text-white transition hover:border-red-500/60 hover:text-red-300"
              >
                Cerrar sesión
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function ConsoleProtectedPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!auth) {
      setIsReady(true);
      setIsAuthenticated(false);
      router.replace(`/console/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const hasSession = Boolean(user);

      setIsAuthenticated(hasSession);
      setIsReady(true);

      if (!hasSession) {
        router.replace(`/console/login?next=${encodeURIComponent(pathname)}`);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-gray-300">
        Validando sesión...
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <ConsoleHeader title={title} subtitle={subtitle} />
      <section className="mx-auto max-w-6xl px-4 py-8">{children}</section>
    </main>
  );
}

export function ConsoleLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => {
    const nextPath = searchParams.get("next");

    if (nextPath && nextPath.startsWith("/console")) {
      return nextPath;
    }

    return "/console/detections";
  }, [searchParams]);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth) {
      setCheckingSession(false);
      setError("El acceso no está disponible en este momento. Inténtalo más tarde.");
      setMessage("");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setMessage(`Bienvenido, ${user.email || user.displayName || "usuario"}`);
        router.replace(redirectTo);
        return;
      }

      setCheckingSession(false);
    });

    return () => unsubscribe();
  }, [redirectTo, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      setMessage("");
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      setError("El acceso no está disponible en este momento. Inténtalo más tarde.");
      setMessage("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage(`Bienvenido, ${email}`);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage(`Cuenta creada para ${email}`);
      }
      router.replace(redirectTo);
    } catch (firebaseError: unknown) {
      const errorCode =
        typeof firebaseError === "object" &&
        firebaseError !== null &&
        "code" in firebaseError
          ? String(firebaseError.code)
          : undefined;

      setError(getFirebaseMessage(errorCode));
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured || !auth) {
      setError("El acceso no está disponible en este momento. Inténtalo más tarde.");
      setMessage("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credentials = await signInWithPopup(auth, provider);
      setMessage(
        `Bienvenido, ${credentials.user.email || credentials.user.displayName || "usuario"}`
      );
      router.replace(redirectTo);
    } catch (firebaseError: unknown) {
      const errorCode =
        typeof firebaseError === "object" &&
        firebaseError !== null &&
        "code" in firebaseError
          ? String(firebaseError.code)
          : undefined;

      setError(getFirebaseMessage(errorCode));
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-gray-300">
        Cargando acceso...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1f1f1f_0%,#050505_55%)] px-4 py-12 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            Acceso al panel operativo
          </div>
          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
              Inicia sesión para entrar al centro de monitoreo de SkyEye
            </h1>
            <p className="max-w-2xl text-lg text-gray-300">
              Desde aquí gestionas tus cámaras, revisas las detecciones y
              controlas el monitoreo en tiempo real.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-gray-400">Detecciones</p>
              <p className="mt-2 text-xl font-semibold">En tiempo real</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-gray-400">Cámaras</p>
              <p className="mt-2 text-xl font-semibold">Todas tus fuentes</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-gray-400">Acceso</p>
              <p className="mt-2 text-xl font-semibold">Seguro</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
              Login
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {mode === "login" ? "Iniciar sesión" : "Registrarse"}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {mode === "login"
                ? "Ingresa con tu correo y contraseña o continúa con Google."
                : "Crea tu cuenta con correo y contraseña o usa Google."}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/20 p-2">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-blue-500 text-black"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
                setMessage("");
              }}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-blue-500 text-black"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              Registrarse
            </button>
          </div>

          {(error || message) ? (
            <p
              className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
                error
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {error || message}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-gray-300">Correo</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                placeholder="admin@correo.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-gray-300">
                Contraseña
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                placeholder="Tu contraseña"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-500 px-4 py-3 font-semibold text-black transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? mode === "login"
                  ? "Entrando..."
                  : "Creando cuenta..."
                : mode === "login"
                  ? "Entrar"
                  : "Crear cuenta"}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:border-blue-500/60 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Procesando..." : "Continuar con Google"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-300">
            <p>
              ¿Aún no tienes cuenta? Regístrate con tu correo y contraseña, o
              continúa con Google para acceder al panel.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
