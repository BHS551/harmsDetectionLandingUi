"use client";
import Head from 'next/head'
import { useRef } from 'react'

export default function Home() {
  const homeRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  // Función para desplazarse suavemente a una sección
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Manejar el envío del formulario de contacto
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    alert('Gracias por contactarnos. Nos pondremos en contacto con usted en breve.')
    e.currentTarget.reset()
  }

  return (
    <>
      <Head>
        <title>SkyEye - Monitoreo de Seguridad Impulsado por IA</title>
        <meta name="description" content="Revolucionando la vigilancia con detección inteligente de amenazas." />
      </Head>

      {/* Encabezado - Sticky y con fondo gris claro */}
      <header className="sticky top-0 z-50 bg-black opacity-90">
        <div className="container mx-auto flex items-center justify-between px-4 py-6">
          <div className="text-2xl font-bold">SkyEye</div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <button onClick={() => scrollToSection(homeRef)} className="hover:text-orange-500">
                  Inicio
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection(aboutRef)} className="hover:text-orange-500">
                  Acerca de
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection(featuresRef)} className="hover:text-orange-500">
                  Características
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection(contactRef)} className="hover:text-orange-500">
                  Contáctenos
                </button>
              </li>
              <li>
                <a href="/console" className="hover:text-orange-500">
                  Console
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Contenido Principal */}
      <main>
        {/* Sección de Inicio con Video de Fondo (50vh) */}
        <section
          id="home"
          ref={homeRef}
          className="relative h-[50vh] flex items-center justify-center text-center bg-cover bg-center"
        >
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="/securityVid1.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative z-10 container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl text-white font-bold mb-4">
              Monitoreo de Seguridad Impulsado por IA
            </h1>
            <p className="text-xl text-white mb-8">
              Revolucionando la vigilancia con detección inteligente de amenazas.
            </p>
            <button
              onClick={() => scrollToSection(aboutRef)}
              className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
            >
              Conocer Más
            </button>
          </div>
        </section>

        {/* Sección Acerca de - Ocupa la otra mitad de la pantalla (50vh) y fondo blanco */}
        <section
          id="about"
          ref={aboutRef}
          className="h-[50vh] bg-white text-black flex items-center justify-center"
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Acerca de SkyEye</h2>
            <p className="max-w-2xl mx-auto text-lg">
              SkyEye ofrece soluciones de software como servicio de última generación para el monitoreo de cámaras de seguridad. Nuestros avanzados algoritmos de IA detectan amenazas potenciales, comportamientos sospechosos y armas, garantizando un entorno más seguro para su negocio.
            </p>
          </div>
        </section>

        {/* Sección de Características */}
        <section id="features" ref={featuresRef} className="py-16 bg-white text-black">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Nuestras Características</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-gray-200 p-6 rounded shadow text-black">
                <h3 className="text-xl font-semibold mb-2">Alertas en Tiempo Real</h3>
                <p>Notificaciones instantáneas cuando se detecta actividad inusual.</p>
              </div>
              <div className="bg-gray-200 p-6 rounded shadow text-black">
                <h3 className="text-xl font-semibold mb-2">Detección Avanzada con IA</h3>
                <p>Identificación precisa de amenazas potenciales y armas.</p>
              </div>
              <div className="bg-gray-200 p-6 rounded shadow text-black">
                <h3 className="text-xl font-semibold mb-2">Integración en la Nube</h3>
                <p>Almacenamiento seguro en la nube para grabaciones con soluciones escalables.</p>
              </div>
              <div className="bg-gray-200 p-6 rounded shadow text-black">
                <h3 className="text-xl font-semibold mb-2">Integración Perfecta</h3>
                <p>Integre fácilmente con sus sistemas de seguridad existentes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Contacto */}
        <section id="contact" ref={contactRef} className="py-16 bg-white text-black">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Contáctenos</h2>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
              <div className="mb-4">
                <label htmlFor="name" className="block font-bold mb-2">Nombre:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block font-bold mb-2">Correo Electrónico:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="message" className="block font-bold mb-2">Mensaje:</label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                ></textarea>
              </div>
              <button type="submit" className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800">
                Enviar Mensaje
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Pie de Página - Fondo gris claro */}
      <footer className="bg-black py-4 text-center">
        <p>&copy; 2025 SkyEye. Todos los derechos reservados.</p>
      </footer>
    </>
  )
}
