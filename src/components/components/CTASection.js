import React from 'react';
import { Phone, EnvelopeSimple } from 'phosphor-react';

const CTASection = () => {
  return (
    <section className="w-full py-20 bg-gradient-to-br from-[#232946] to-[#181c2a] flex flex-col items-center justify-center font-sans">
      <div className="max-w-2xl mx-auto text-center px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 drop-shadow-lg font-sans">Ready to Transform Your Space?</h2>
        <p className="text-lg text-[#f6d365] mb-10 max-w-xl mx-auto font-sans">Join hundreds of organizations that trust Pathix for their mapping needs. Get started with a free consultation today.</p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-12">
          <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#f6d365] to-[#fda085] text-gray-900 font-bold text-lg shadow-xl hover:from-[#fda085] hover:to-[#f6d365] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#f6d365] focus:ring-offset-2">
            Start Free Trial <span className="ml-2">→</span>
          </button>
          <button className="px-8 py-4 rounded-xl border-2 border-[#f6d365] text-[#f6d365] font-bold text-lg shadow-xl bg-white/5 hover:bg-[#f6d365] hover:text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#f6d365] focus:ring-offset-2">
            Schedule Demo
          </button>
        </div>
        <div className="bg-white/10 border border-white/10 rounded-2xl p-8 flex flex-col items-center backdrop-blur-xl max-w-md mx-auto">
          <div className="font-bold text-white text-lg mb-4">Get in Touch</div>
          <div className="flex flex-col gap-4 items-center text-white text-base">
            <div className="flex items-center gap-2">
              <Phone size={22} weight="duotone" className="text-accent-gold" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <EnvelopeSimple size={22} weight="duotone" className="text-accent-gold" />
              <span>hello@pathix.com</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection; 