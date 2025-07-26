import React from 'react';

const navLinks = [
  { name: 'Home', href: '#' },
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Contact', href: '#contact' },
];

const Navbar = () => (
  <nav className="w-full bg-white shadow-sm border-b border-gray-100 fixed top-0 left-0 z-50">
    <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
      <div className="font-serif text-2xl font-extrabold text-accent-gold tracking-tight select-none">Pathix</div>
      <div className="flex items-center gap-2 sm:gap-6">
        {navLinks.map(link => (
          <a
            key={link.name}
            href={link.href}
            className="font-sans text-base font-semibold text-gray-700 px-2 py-1 rounded transition hover:text-accent-gold hover:underline underline-offset-4"
          >
            {link.name}
          </a>
        ))}
        <a
          href="#get-started"
          className="ml-2 px-5 py-2 rounded-full font-bold font-sans bg-gradient-to-r from-accent-gold to-accent-gold2 text-white shadow-gold border-0 transition hover:from-accent-gold2 hover:to-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold"
        >
          Get Started
        </a>
      </div>
    </div>
  </nav>
);

export default Navbar; 