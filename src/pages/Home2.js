// NOTE: Requires the following custom CSS in your global styles or Tailwind config:
// .shadow-glow { box-shadow: 0 0 24px 0 #f6d36588, 0 2px 8px #232946cc; }
// .shadow-glass { box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18); }
// .bg-gradient-to-b.from-accent-gold.to-yellow-600 { background: linear-gradient(to bottom, #f6d365, #facc15); }
// .bg-gradient-to-r.from-accent-gold.to-yellow-500 { background: linear-gradient(to right, #f6d365, #f59e42); }
// .text-accent-gold { color: #f6d365; }
// .border-accent-gold { border-color: #f6d365; }
// .bg-accent-gold { background-color: #f6d365; }
// .font-serif { font-family: 'Playfair Display', serif; }
import React from 'react';
import { FaMapMarkedAlt, FaQrcode, FaRobot, FaChartBar, FaMobileAlt, FaCheckCircle } from 'react-icons/fa';
import { MdOutlineDashboard } from 'react-icons/md';
import logo from '../logo.svg';
import "../App.css";
import { Link } from 'react-router-dom';

export default function Home2() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#15192b] via-[#101117] to-[#23243a] flex flex-col items-center font-sans">
      {/* Top Navbar with Logo */}
      <nav className="w-full flex items-center px-48 py-6 fixed top-0 left-0 z-30 bg-gradient-to-b from-[#181c2aee] to-transparent backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Pathix Logo" className="h-12 w-12 drop-shadow-[0_0_16px_#f6d365]" />
          <span className="text-3xl font-extrabold font-sans bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_16px_#f6d365] tracking-wide">Pathix</span>
        </div>
      </nav>
      <div className="h-20" />
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-stretch justify-between pt-36 pb-24 px-4 md:px-12">
        <div className="flex-1 flex flex-col items-start md:items-start mb-10 md:mb-0">
          <h1 className="text-3xl md:text-6xl font-extrabold leading-normal md:leading-tight bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_24px_#f6d36588] mb-10 font-serif">Create Your Own <br /> Smart Digital Map</h1>
          <h2 className="text-base md:text-2xl text-yellow-100 font-medium max-w-2xl font-serif">Register, design, and share interactive maps of your property instantly.</h2>
          <div className="flex gap-6 mt-6 mb-10">
            <Link to="/signup" className="px-8 py-3 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 font-bold text-lg shadow-[0_0_16px_#f6d36588] hover:scale-105 transition-all">Register Now</Link>
            <Link to="/signin" className="px-8 py-3 rounded-2xl border-2 border-yellow-300 text-yellow-200 font-bold text-lg shadow-[0_0_8px_#f6d36544] hover:bg-yellow-300 hover:text-gray-900 transition-all">Login to Dashboard</Link>
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="w-[380px] h-[300px] md:w-[480px] md:h-[360px] rounded-3xl bg-[#23243a]/60 border border-yellow-400/30 shadow-[0_0_32px_0_#f6d36533] flex items-center justify-center relative overflow-hidden backdrop-blur-xl">
            <img src="/Pathix.png" alt="Dashboard" className="w-full h-full object-contain" />
            <span className="absolute bottom-0 right-4 text-xs text-yellow-200/70">Demo Preview</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl mx-auto py-16 px-6">
        <h3 className="text-3xl md:text-4xl font-extrabold text-yellow-100 mb-16 text-center tracking-wide font-sans drop-shadow-[0_0_12px_#f6d36544]">Features</h3>
        <div className="flex flex-col gap-14 items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-14 w-full">
            <FeatureCard icon={<FaMapMarkedAlt className='text-4xl text-yellow-300 drop-shadow-[0_0_4px_#f6d365]' />} title="Custom Map Editor" desc="Draw, edit, and brand your own digital maps." />
            <FeatureCard icon={<FaQrcode className='text-4xl text-yellow-300 drop-shadow-[0_0_4px_#f6d365]' />} title="QR Code Generator" desc="Instantly create QR codes for map access." />
            <FeatureCard icon={<FaRobot className='text-4xl text-yellow-300 drop-shadow-[0_0_4px_#f6d365]' />} title="AI Guide Engine" desc="Smart, role-based visitor guidance." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-14 w-full">
            <div className="hidden md:block" />
            <FeatureCard icon={<FaChartBar className='text-4xl text-yellow-300 drop-shadow-[0_0_4px_#f6d365]' />} title="Analytics Dashboard" desc="Track visits, scans, and engagement." />
            <FeatureCard icon={<FaMobileAlt className='text-4xl text-yellow-300 drop-shadow-[0_0_4px_#f6d365]' />} title="Mobile Optimization" desc="Seamless experience on any device." />
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="w-full max-w-5xl mx-auto py-16 px-6">
        <h3 className="text-2xl md:text-3xl font-bold text-accent-gold mb-8 text-center tracking-wide">Get Started in 3 Steps</h3>
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <StepCard step={1} title="Register your organization" desc="Sign up with your org email and details." />
          <div className="hidden md:block w-16 h-1 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 rounded-full shadow-[0_0_8px_#f6d36588]" />
          <StepCard step={2} title="Design your map" desc="Use our editor or request a custom design." />
          <div className="hidden md:block w-16 h-1 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 rounded-full shadow-[0_0_8px_#f6d36588]" />
          <StepCard step={3} title="Deploy via QR or link" desc="Share instantly with QR codes or links." />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full max-w-6xl mx-auto py-16 px-6" id="pricing">
        <h3 className="text-2xl md:text-3xl font-bold text-accent-gold mb-8 text-center tracking-wide">Pricing</h3>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
          <PricingCard plan="Starter" price="₹0" features={["50 free scans/month", "1 map", "Basic support"]} cta="Get Started" highlight={false} />
          <PricingCard plan="Pro" price="₹499" features={["1000 scans/month", "Unlimited maps", "Analytics dashboard", "Priority support"]} cta="Go Pro" highlight={true} />
          <PricingCard plan="Enterprise" price="Custom" features={["API access", "AR & white-labeling", "Dedicated manager"]} cta="Contact Sales" highlight={false} />
        </div>
      </section>

      {/* FAQ & Support Section */}
      <section className="w-full max-w-5xl mx-auto py-16 px-6">
        <h3 className="text-2xl md:text-3xl font-bold text-accent-gold mb-8 text-center tracking-wide">FAQ & Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <FaqItem q="Who can use Pathix?" a="Any organization—colleges, resorts, campuses, and more—can create interactive maps." />
          <FaqItem q="Is coding required?" a="No, Pathix is fully no-code and intuitive for all users." />
          <FaqItem q="Can I try before buying?" a="Yes, the Starter plan is free with no credit card required." />
          <FaqItem q="How do I get support?" a="Contact us at support@pathix.in or use the Help Center in your dashboard." />
        </div>
        <div className="text-center">
          <a href="mailto:support@pathix.in" className="text-accent-gold underline hover:text-yellow-400 transition-all">Contact Support</a>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="w-full py-12 bg-gradient-to-t from-[#181c2a] to-transparent flex flex-col items-center mt-12">
        <h4 className="text-2xl font-bold text-accent-gold mb-4">Join Pathix Today</h4>
        <Link to="/signup" className="px-8 py-3 rounded-lg bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-bold shadow-glow text-lg hover:scale-105 transition-all">Get Started Free</Link>
        <div className="mt-6 text-gray-400 text-sm">© {new Date().getFullYear()} Pathix. All rights reserved.</div>
      </footer>
    </div>
  );
}

// --- Feature Card ---
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="rounded-3xl bg-[#181c2a]/60 border border-accent-gold shadow-[0_0_32px_0_#f6d36533] backdrop-blur-xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_0_48px_0_#f6d36588] hover:border-yellow-400/40 min-h-[200px] group cursor-pointer">
      <div className="mb-4 text-4xl text-yellow-300 drop-shadow-[0_0_8px_#f6d365] group-hover:animate-pulse-slow">{icon}</div>
      <div className="font-bold text-lg text-yellow-100 mb-2 font-sans">{title}</div>
      <div className="text-gray-300 text-sm font-sans">{desc}</div>
    </div>
  );
}

// --- Step Card ---
function StepCard({ step, title, desc }) {
  return (
    <div className="flex flex-col items-center bg-gradient-to-br from-[#23243a99] to-[#181c2a99] rounded-2xl shadow-glass border border-accent-gold px-8 py-7 min-w-[220px] max-w-xs backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-4 hover:scale-110 hover:rotate-x-[-7deg] hover:rotate-y-2 hover:shadow-glow-animate group cursor-pointer" style={{perspective: '1600px', transformStyle: 'preserve-3d'}}>
      <div className="w-12 h-12 rounded-full bg-gradient-to-b from-accent-gold to-yellow-400 flex items-center justify-center text-2xl font-bold text-gray-900 mb-3 shadow-glow group-hover:animate-pulse-slow">{step}</div>
      <div className="font-bold text-accent-gold text-lg mb-1 text-center">{title}</div>
      <div className="text-gray-200 text-sm text-center">{desc}</div>
    </div>
  );
}

// --- Pricing Card ---
function PricingCard({ plan, price, features, cta, highlight }) {
  return (
    <div className={`relative flex flex-col items-center rounded-2xl shadow-glass border border-accent-gold px-8 py-10 min-w-[260px] max-w-xs backdrop-blur-md bg-gradient-to-br from-[#23243aee] to-[#181c2aee] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-4 hover:scale-110 hover:rotate-x-8 hover:rotate-y-[-4deg] hover:shadow-glow-animate group cursor-pointer ${highlight ? 'scale-105 border-2 border-accent-gold shadow-glow' : ''}`} style={{perspective: '1600px', transformStyle: 'preserve-3d'}}>
      {highlight && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 font-bold px-4 py-1 rounded-full shadow-glow text-sm z-10">
          Most Popular
        </div>
      )}
      <div className="font-bold text-accent-gold text-xl mb-2">{plan}</div>
      <div className="text-3xl font-extrabold text-yellow-200 mb-4">{price}</div>
      <ul className="mb-6 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-center text-gray-200 text-sm"><FaCheckCircle className="text-accent-gold mr-2 group-hover:animate-pulse-slow" />{f}</li>
        ))}
      </ul>
      <Link to="/signup" className={`px-6 py-2 rounded-lg font-bold text-lg shadow-glow transition-all ${highlight ? 'bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900' : 'border border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-gray-900'}`}>{cta}</Link>
    </div>
  );
}

// --- FAQ Item ---
function FaqItem({ q, a }) {
  return (
    <div className="bg-gradient-to-br from-[#23243a99] to-[#181c2a99] rounded-2xl shadow-glass border border-accent-gold p-6 backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-4 hover:scale-110 hover:rotate-x-[-5deg] hover:rotate-y-4 hover:shadow-glow-animate cursor-pointer" style={{perspective: '1600px', transformStyle: 'preserve-3d'}}>
      <div className="font-bold text-accent-gold mb-2">{q}</div>
      <div className="text-gray-200 text-sm">{a}</div>
    </div>
  );
}
// Custom Tailwind classes required in global styles or tailwind.config.js:
// .shadow-glow { box-shadow: 0 0 24px 0 #f6d36588, 0 2px 8px #232946cc; }
// .shadow-glass { box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18); }
// .bg-gradient-to-b.from-accent-gold.to-yellow-600 { background: linear-gradient(to bottom, #f6d365, #facc15); }
// .bg-gradient-to-r.from-accent-gold.to-yellow-400 { background: linear-gradient(to right, #f6d365, #facc15); }
// .text-accent-gold { color: #f6d365; }
// .border-accent-gold { border-color: #f6d365; }
// .bg-accent-gold { background-color: #f6d365; } 