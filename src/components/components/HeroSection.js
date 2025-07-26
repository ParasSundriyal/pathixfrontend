import React from 'react';

const HeroSection = () => {
  return (
    <section className="w-full flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="font-serif text-4xl md:text-5xl font-extrabold text-accent-gold mb-2 tracking-tight">Pathix: Professional Mapping Platform</h1>
        <div className="text-lg md:text-xl text-gray-500 font-sans mb-8">Premium mapping solutions for universities, luxury hotels, and corporate clients</div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-8 mx-auto max-w-xl flex flex-col items-center">
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">About Pathix</h2>
          <p className="text-gray-700 font-sans text-base md:text-lg mb-4">Pathix is a next-generation mapping SaaS platform designed for professional environments. Deliver interactive maps, analytics, and secure navigation for your organization with a touch of luxury and ease.</p>
          <a href="#get-started" className="mt-2 px-8 py-3 rounded-full font-bold font-sans bg-gradient-to-r from-accent-gold to-accent-gold2 text-white shadow-gold border-0 transition hover:from-accent-gold2 hover:to-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold text-lg">Get Started</a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 