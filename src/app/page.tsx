"use client";

import { useRef } from "react";

export default function Home() {
  const homeRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert("¡Gracias por contactarnos! Nos pondremos en contacto contigo muy pronto.");
    e.currentTarget.reset();
  };

  const steps = [
    {
      number: "01",
      title: "Conecta tus cámaras",
      description:
        "Registra tus cámaras IP o RTSP existentes en el panel. No necesitas comprar equipos nuevos.",
    },
    {
      number: "02",
      title: "Activa el monitoreo",
      description:
        "Con un clic, SkyEye empieza a analizar el video en busca de eventos importantes.",
    },
    {
      number: "03",
      title: "Recibe alertas",
      description:
        "Cuando se detecta algo relevante, te avisamos al instante con la evidencia, directo a tu celular.",
    },
  ];

  const features = [
    {
      title: "Alertas en tiempo real",
      description:
        "Notificaciones instantáneas cuando se detecta actividad inusual en tus cámaras.",
    },
    {
      title: "Detección con IA",
      description:
        "Modelos de visión por computadora que identifican eventos y comportamientos sospechosos.",
    },
    {
      title: "Usa tus cámaras actuales",
      description:
        "Se integra con tus cámaras IP/RTSP existentes, sin instalar hardware adicional.",
    },
    {
      title: "Evidencia visual",
      description:
        "Cada alerta guarda una imagen del evento para que puedas revisarla cuando quieras.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <button
            onClick={() => scrollToSection(homeRef)}
            className="flex items-center gap-2 text-xl font-bold tracking-tight"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500 text-black">
              S
            </span>
            SkyEye
          </button>
          <nav className="hidden md:block">
            <ul className="flex items-center gap-8 text-sm text-gray-300">
              <li>
                <button onClick={() => scrollToSection(homeRef)} className="transition hover:text-blue-400">
                  Inicio
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection(aboutRef)} className="transition hover:text-blue-400">
                  Cómo funciona
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection(featuresRef)} className="transition hover:text-blue-400">
                  Características
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection(contactRef)} className="transition hover:text-blue-400">
                  Contacto
                </button>
              </li>
            </ul>
          </nav>
          <a
            href="/console"
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold transition hover:border-blue-500/60 hover:text-blue-300"
          >
            Acceder
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section
          id="home"
          ref={homeRef}
          className="relative flex min-h-[88vh] items-center justify-center overflow-hidden text-center"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/securityVid1.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/75 to-[#050505]" />
          <div className="relative z-10 mx-auto max-w-3xl px-4">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Detección inteligente sobre tus cámaras existentes
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Tus cámaras no deberían estar dormidas
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 md:text-xl">
              SkyEye convierte las cámaras que ya tienes en un sistema inteligente
              que detecta eventos importantes y te avisa al instante, sin que
              tengas que mirarlas todo el día.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => scrollToSection(contactRef)}
                className="w-full rounded-full bg-blue-500 px-8 py-3 font-semibold text-black transition hover:bg-blue-400 sm:w-auto"
              >
                Solicitar una demo
              </button>
              <button
                onClick={() => scrollToSection(aboutRef)}
                className="w-full rounded-full border border-white/15 px-8 py-3 font-semibold transition hover:border-blue-500/60 hover:text-blue-300 sm:w-auto"
              >
                Cómo funciona
              </button>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="about" ref={aboutRef} className="border-t border-white/10 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
                Cómo funciona
              </p>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                Un ojo extra para tu negocio, en tres pasos
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                SkyEye es una capa de detección que se suma a tu seguridad
                actual. No reemplaza tu vigilancia, la hace más inteligente.
              </p>
            </div>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:border-blue-500/40"
                >
                  <span className="text-sm font-semibold text-blue-400">
                    {step.number}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-gray-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Características */}
        <section
          id="features"
          ref={featuresRef}
          className="border-t border-white/10 bg-white/[0.02] py-24"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
                Características
              </p>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                Diseñado para darte tranquilidad
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                Todo lo que necesitas para enterarte más rápido cuando algo
                importante ocurre.
              </p>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-blue-500/40"
                >
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm text-gray-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section
          id="contact"
          ref={contactRef}
          className="border-t border-white/10 py-24"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
                Contacto
              </p>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                Hablemos sobre tu negocio
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                Cuéntanos sobre tus cámaras y lo que te gustaría detectar.
                Te mostramos cómo SkyEye puede ayudarte, sin compromiso.
              </p>
              <div className="mt-8 space-y-4 text-gray-300">
                <p className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-blue-400">
                    ✓
                  </span>
                  Usa las cámaras que ya tienes
                </p>
                <p className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-blue-400">
                    ✓
                  </span>
                  Alertas directo a tu celular
                </p>
                <p className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-blue-400">
                    ✓
                  </span>
                  Atención local y cercana
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-white/10 bg-white/5 p-8"
            >
              <div className="mb-5">
                <label htmlFor="name" className="mb-2 block text-sm text-gray-300">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Tu nombre"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-blue-500"
                />
              </div>
              <div className="mb-5">
                <label htmlFor="email" className="mb-2 block text-sm text-gray-300">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-blue-500"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="message" className="mb-2 block text-sm text-gray-300">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Cuéntanos sobre tu negocio y tus cámaras"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-2xl bg-blue-500 px-4 py-3 font-semibold text-black transition hover:bg-blue-400"
              >
                Enviar mensaje
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-gray-400 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-white">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500 text-black">
              S
            </span>
            SkyEye
          </div>
          <p>© 2025 SkyEye. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
