import { NextPage } from 'next'
import Head from 'next/head'
import { useRef } from 'react'

const Home: NextPage = () => {


  // Function to scroll smoothly to a section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Handle contact form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    alert('Thank you for contacting us. We will get back to you shortly.')
    e.currentTarget.reset()
  }

  return (
    <>
      <Head>
        <title>SkyEye - AI Powered Security Monitoring</title>
        <meta
          name="description"
          content="Revolutionizing surveillance with intelligent threat detection."
        />
      </Head>

      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-6">
          <div className="text-2xl font-bold">SkyEye</div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <button
                  onClick={() => scrollToSection(homeRef)}
                  className="hover:text-orange-500"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection(aboutRef)}
                  className="hover:text-orange-500"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection(featuresRef)}
                  className="hover:text-orange-500"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection(contactRef)}
                  className="hover:text-orange-500"
                >
                  Contact
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section
          id="home"
          ref={homeRef}
          className="relative h-screen flex items-center justify-center text-center bg-cover bg-center"
          style={{ backgroundImage: "url('/security-bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative z-10 container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl text-white font-bold mb-4">
              AI Powered Security Monitoring
            </h1>
            <p className="text-xl text-white mb-8">
              Revolutionizing surveillance with intelligent threat detection.
            </p>
            <button
              onClick={() => scrollToSection(aboutRef)}
              className="bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600"
            >
              Learn More
            </button>
          </div>
        </section>

        {/* About Section */}
        <section id="about" ref={aboutRef} className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">About SkyEye</h2>
            <p className="max-w-2xl mx-auto text-lg">
              SkyEye offers state-of-the-art software-as-a-service solutions for security camera
              monitoring. Our advanced AI algorithms detect potential threats, suspicious behaviors,
              and weapons, ensuring a safer environment for your business.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" ref={featuresRef} className="py-16 bg-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Our Features</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white p-6 rounded shadow">
                <h3 className="text-xl font-semibold mb-2">Real-Time Alerts</h3>
                <p>Instant notifications when unusual activity is detected.</p>
              </div>
              <div className="bg-white p-6 rounded shadow">
                <h3 className="text-xl font-semibold mb-2">Advanced AI Detection</h3>
                <p>Accurate identification of potential threats and weapons.</p>
              </div>
              <div className="bg-white p-6 rounded shadow">
                <h3 className="text-xl font-semibold mb-2">Cloud Integration</h3>
                <p>Secure cloud storage for footage with scalable solutions.</p>
              </div>
              <div className="bg-white p-6 rounded shadow">
                <h3 className="text-xl font-semibold mb-2">Seamless Integration</h3>
                <p>Easily integrate with your existing security systems.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" ref={contactRef} className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Contact Us</h2>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
              <div className="mb-4">
                <label htmlFor="name" className="block font-bold mb-2">
                  Name:
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block font-bold mb-2">
                  Email:
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="message" className="block font-bold mb-2">
                  Message:
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600"
              >
                Send Message
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4 text-center">
        <p>&copy; 2025 SkyEye. All Rights Reserved.</p>
      </footer>
    </>
  )
}

export default Home
