import React from 'react';
import { FaMapMarkedAlt, FaRobot, FaQrcode, FaChartBar, FaMobileAlt, FaUserShield, FaUniversity, FaHotel, FaBuilding, FaRupeeSign, FaCheckCircle, FaVideo, FaSignInAlt, FaRegLightbulb } from 'react-icons/fa';
import { MdEdit, MdOutlineDashboard, MdOutlineAnalytics, MdOutlineHelpCenter } from 'react-icons/md';
import './LandingPage.css'; // Add this import at the top for custom styles

const features = [
  {
    icon: <MdEdit className="text-yellow-400 text-3xl mb-2" />, title: 'Custom Map Editor', desc: 'Drag-and-drop tools for drawing roads, adding buildings, markers & zones',
  },
  {
    icon: <FaRobot className="text-yellow-400 text-3xl mb-2" />, title: 'AI Guide Engine', desc: 'Smart assistants guide visitors based on roles (student, guest, admin, etc.)',
  },
  {
    icon: <FaChartBar className="text-yellow-400 text-3xl mb-2" />, title: 'Analytics', desc: 'Track most visited points, peak traffic zones, and QR scans',
  },
  {
    icon: <FaQrcode className="text-yellow-400 text-3xl mb-2" />, title: 'QR Code Generator', desc: 'One click to generate shareable QR for any custom map',
  },
  {
    icon: <FaMobileAlt className="text-yellow-400 text-3xl mb-2" />, title: 'Mobile Optimized', desc: 'Seamlessly viewable across devices without an app',
  },
];

const useCases = [
  { icon: <FaUniversity className="text-yellow-400 text-2xl mr-2" />, label: 'University Navigation', desc: 'Department routes, canteens, event halls' },
  { icon: <FaHotel className="text-yellow-400 text-2xl mr-2" />, label: 'Resorts & Hotels', desc: 'Room maps, spa zones, dining areas' },
  { icon: <FaBuilding className="text-yellow-400 text-2xl mr-2" />, label: 'Expos & Campuses', desc: 'Interactive guide for large campuses' },
];

const plans = [
  { name: 'Starter', price: '₹0', features: '50 free scans/month, 1 map' },
  { name: 'Pro', price: '₹499', features: '1000 scans/month, analytics, unlimited maps' },
  { name: 'Enterprise', price: 'Custom', features: 'API access, AR, white-labeling' },
];

const devTools = [
  'Firebase Auth Integration',
  'API access for integration',
  'Data export for usage analytics',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181A20] via-[#101117] to-[#23243a] text-gray-100 font-sans relative overflow-x-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-[800px] h-[800px] bg-gradient-radial from-yellow-900/30 via-transparent to-transparent rounded-full absolute left-1/2 top-0 -translate-x-1/2 blur-2xl opacity-60"></div>
        <div className="w-[600px] h-[600px] bg-gradient-radial from-yellow-700/20 via-transparent to-transparent rounded-full absolute right-0 bottom-0 blur-2xl opacity-40"></div>
      </div>
      <div className="relative z-10 font-sans">
        {/* Header */}
        <header className="flex flex-col items-center pt-16 pb-8">
          <FaMapMarkedAlt className="text-5xl text-yellow-400 mb-4 drop-shadow-lg" />
          <h1 className="text-5xl font-bold text-yellow-300 mb-2 tracking-wide font-serif">Pathix</h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-yellow-200 mb-4 text-center font-serif">Your Smart Mapping Dashboard</h2>
          <p className="max-w-xl text-center text-gray-300 mb-6 font-sans">Create, Customize & Launch Digital Maps for Your Campus or Property<br/>A self-service platform that lets you design branded maps, add navigation points, and deploy interactive guides with one QR code.</p>
          <div className="flex gap-4 mb-2">
            <button className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-6 py-2 rounded shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500 font-sans">Get Started</button>
            <button className="border border-yellow-400 text-yellow-300 font-semibold px-6 py-2 rounded hover:bg-yellow-400 hover:text-gray-900 transition-all font-sans">Login</button>
            <button className="border border-yellow-400 text-yellow-300 font-semibold px-6 py-2 rounded hover:bg-yellow-400 hover:text-gray-900 transition-all font-sans">Book a Demo</button>
          </div>
        </header>

        {/* What is Pathix */}
        <section className="max-w-3xl mx-auto py-8">
          <h3 className="flex items-center text-2xl font-bold text-yellow-300 mb-4"><span className="mr-2">🗺</span> What is Pathix?</h3>
          <ul className="space-y-2 text-lg text-gray-200">
            <li className="flex items-start"><span className="mr-2">📍</span>Design their own location-specific maps</li>
            <li className="flex items-start"><span className="mr-2">🤖</span>Add AI-powered visitor guides</li>
            <li className="flex items-start"><span className="mr-2">📲</span>Generate unique QR codes for live access</li>
            <li className="flex items-start"><span className="mr-2">🧩</span>Integrate analytics and alerts</li>
            <li className="flex items-start"><span className="mr-2">🌐</span>Manage from a unified dashboard</li>
          </ul>
        </section>

        {/* Key Features */}
        <section className="max-w-6xl mx-auto py-8">
          <h3 className="flex items-center text-2xl font-bold text-yellow-300 mb-6"><span className="mr-2">✨</span> Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-gray-900/70 border border-yellow-900 rounded-lg p-6 flex flex-col items-center shadow-lg hover:shadow-yellow-900/30 transition-all">
                {f.icon}
                <h4 className="text-xl font-semibold text-yellow-200 mb-2 text-center">{f.title}</h4>
                <p className="text-gray-300 text-center">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Get Started Steps */}
        <section className="max-w-4xl mx-auto py-8">
          <h3 className="flex items-center text-2xl font-bold text-yellow-300 mb-6"><span className="mr-2">👣</span> Get Started in 3 Simple Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-lg text-gray-200">
            <li>
              <span className="font-semibold text-yellow-200">Register Your Organization:</span> Sign up using your org email and basic details.
            </li>
            <li>
              <span className="font-semibold text-yellow-200">Design Your Map:</span> Use our intuitive editor or request a custom design.
            </li>
            <li>
              <span className="font-semibold text-yellow-200">Publish & Share:</span> Instantly deploy using QR codes or link embeds.
            </li>
          </ol>
        </section>

        {/* Use Cases */}
        <section className="max-w-4xl mx-auto py-8">
          <h3 className="flex items-center text-2xl font-bold text-yellow-300 mb-6"><span className="mr-2">💡</span> Use Cases</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((u, i) => (
              <div key={i} className="bg-gray-900/70 border border-yellow-900 rounded-lg p-4 flex flex-col items-start shadow-md">
                <div className="flex items-center mb-2">{u.icon}<span className="text-lg font-semibold text-yellow-200">{u.label}</span></div>
                <p className="text-gray-300 ml-8">{u.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-4xl mx-auto py-8">
          <h3 className="flex items-center text-2xl font-bold text-yellow-300 mb-6"><span className="mr-2">💰</span> Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <div key={i} className="bg-gray-900/80 border border-yellow-900 rounded-lg p-6 flex flex-col items-center shadow-md">
                <div className="flex items-center mb-2">
                  <FaRupeeSign className="text-yellow-400 text-2xl mr-1" />
                  <span className="text-2xl font-bold text-yellow-200">{p.price}</span>
                </div>
                <h4 className="text-lg font-semibold text-yellow-100 mb-1">{p.name}</h4>
                <p className="text-gray-300 text-center">{p.features}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6">
            <button className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-6 py-2 rounded shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500">Compare Plans</button>
          </div>
        </section>

        {/* Already Registered / Help */}
        <section className="max-w-3xl mx-auto py-8 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-4">
            <FaSignInAlt className="text-yellow-400 text-2xl" />
            <span className="text-lg text-yellow-200 font-semibold">Already Registered?</span>
            <button className="border border-yellow-400 text-yellow-300 font-semibold px-4 py-1 rounded hover:bg-yellow-400 hover:text-gray-900 transition-all">Login to Dashboard</button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <FaVideo className="text-yellow-400 text-2xl" />
            <span className="text-lg text-yellow-200 font-semibold">Need help?</span>
            <button className="border border-yellow-400 text-yellow-300 font-semibold px-4 py-1 rounded hover:bg-yellow-400 hover:text-gray-900 transition-all">Watch Intro Video</button>
          </div>
        </section>

        {/* Developer & Admin Tools */}
        <section className="max-w-3xl mx-auto py-8">
          <h3 className="flex items-center text-2xl font-bold text-yellow-300 mb-4"><span className="mr-2">🧑‍💻</span> Developer & Admin Tools</h3>
          <ul className="space-y-2 text-lg text-gray-200">
            {devTools.map((tool, i) => (
              <li key={i} className="flex items-center"><FaCheckCircle className="text-yellow-400 mr-2" />{tool}</li>
            ))}
          </ul>
        </section>

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto py-12 flex flex-col items-center">
          <h3 className="flex items-center text-2xl font-bold text-yellow-300 mb-4"><span className="mr-2">🚀</span> Try Pathix Today</h3>
          <p className="text-lg text-gray-200 mb-6 text-center max-w-2xl">Start building interactive, intelligent maps — without writing a single line of code.</p>
          <div className="flex gap-4 flex-wrap justify-center">
            <button className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-6 py-2 rounded shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500">Register Now</button>
            <button className="border border-yellow-400 text-yellow-300 font-semibold px-6 py-2 rounded hover:bg-yellow-400 hover:text-gray-900 transition-all">Book a Demo</button>
            <button className="border border-yellow-400 text-yellow-300 font-semibold px-6 py-2 rounded hover:bg-yellow-400 hover:text-gray-900 transition-all">Access Help Center</button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-gray-500 text-sm">
          <div className="flex flex-wrap justify-center gap-8 mb-2">
            <span className="flex items-center gap-1"><FaUniversity className="text-yellow-400" /> Universities</span>
            <span className="flex items-center gap-1"><FaHotel className="text-yellow-400" /> Resorts & Hotels</span>
            <span className="flex items-center gap-1"><FaBuilding className="text-yellow-400" /> Expos & Campuses</span>
          </div>
          <div>© {new Date().getFullYear()} Pathix. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
} 