import React from 'react';
import { Buildings, GraduationCap, FirstAid, UmbrellaBeach } from 'phosphor-react';

const customers = [
  {
    icon: <Buildings size={56} weight="duotone" className="text-accent-blue" />,
    title: 'Corporations',
    description: 'Help employees and visitors navigate large office complexes, campuses, and facilities with ease.'
  },
  {
    icon: <GraduationCap size={56} weight="duotone" className="text-accent-gold" />,
    title: 'Universities',
    description: 'Guide students, faculty, and visitors through campus buildings, dormitories, and facilities.'
  },
  {
    icon: <FirstAid size={56} weight="duotone" className="text-accent-blue" />,
    title: 'Healthcare Institutions',
    description: 'Reduce patient stress with clear navigation through medical facilities and hospital complexes.'
  },
  {
    icon: <UmbrellaBeach size={56} weight="duotone" className="text-accent-gold" />,
    title: 'Resorts & Hotels',
    description: 'Enhance guest experience with interactive maps of amenities, restaurants, and activities.'
  }
];

const TargetCustomersSection = () => {
  return (
    <section className="w-full py-20 bg-gradient-to-br from-[#181c2a] to-[#232946] flex flex-col items-center justify-center font-sans">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 drop-shadow-lg font-sans">Perfect for Your Organization</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto font-sans">Trusted by leading organizations worldwide to provide seamless navigation experiences</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
          {customers.map((customer, idx) => (
            <div key={idx} className="rounded-2xl bg-white/10 border border-white/10 shadow-xl p-8 flex flex-col items-center text-center backdrop-blur-xl hover:scale-105 hover:shadow-2xl transition-all duration-200">
              <div className="mb-4 drop-shadow-lg">{customer.icon}</div>
              <div className="font-bold text-xl text-white mb-2 font-sans">{customer.title}</div>
              <div className="text-gray-300 text-base font-sans">{customer.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TargetCustomersSection; 