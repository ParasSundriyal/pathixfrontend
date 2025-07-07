import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="w-full py-20 bg-gradient-to-br from-[#181c2a] via-[#232946] to-[#232946] flex flex-col items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-4">
        <div className="flex items-center justify-center mb-6">
          <svg width="48" height="48" fill="none" stroke="#f6d365" strokeWidth="2" viewBox="0 0 24 24" className="mr-3"><path d="M12 21c-4.418 0-8-5.373-8-10a8 8 0 1 1 16 0c0 4.627-3.582 10-8 10z"/><circle cx="12" cy="11" r="3"/></svg>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">Pathix</h1>
        </div>
        <h2 className="text-2xl md:text-3xl text-[#f6d365] font-semibold mb-8 max-w-2xl mx-auto">Premium Mapping Solutions for Organizations, Universities, Institutions & Resorts</h2>
        <p className="text-lg text-gray-300 mb-10 max-w-xl mx-auto">Create customized interactive maps that help your clients navigate your space with ease. Professional mapping solutions tailored to your unique needs.</p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link to="/signup">
            <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#f6d365] to-[#fda085] text-gray-900 font-bold text-lg shadow-xl hover:from-[#fda085] hover:to-[#f6d365] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#f6d365] focus:ring-offset-2">
              Get Started
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="inline ml-2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </Link>
          <Link to="/signin">
            <button className="px-8 py-4 rounded-xl border-2 border-[#f6d365] text-[#f6d365] font-bold text-lg shadow-xl bg-white/5 hover:bg-[#f6d365] hover:text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#f6d365] focus:ring-offset-2">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 