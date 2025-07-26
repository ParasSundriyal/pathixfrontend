import React from 'react';
import { MapTrifold, Devices, PaintBrush, ChartBar, ShieldCheck, Headphones } from 'phosphor-react';

const features = [
  {
    icon: <MapTrifold size={40} weight="duotone" className="text-accent-gold" />,
    title: 'Interactive Maps',
    description: 'Create detailed, interactive maps with custom markers, routes, and points of interest tailored to your space.'
  },
  {
    icon: <Devices size={40} weight="duotone" className="text-accent-gold" />,
    title: 'Mobile Optimized',
    description: 'Your maps work perfectly on all devices - desktop, tablet, and mobile for seamless navigation.'
  },
  {
    icon: <PaintBrush size={40} weight="duotone" className="text-accent-gold" />,
    title: 'Custom Branding',
    description: "Match your organization's branding with custom colors, logos, and styling options."
  },
  {
    icon: <ChartBar size={40} weight="duotone" className="text-accent-gold" />,
    title: 'Analytics Dashboard',
    description: 'Track usage patterns and popular destinations to optimize your space and services.'
  },
  {
    icon: <ShieldCheck size={40} weight="duotone" className="text-accent-gold" />,
    title: 'Enterprise Security',
    description: 'Bank-level security with data encryption and compliance standards for institutional use.'
  },
  {
    icon: <Headphones size={40} weight="duotone" className="text-accent-gold" />,
    title: '24/7 Support',
    description: 'Dedicated support team to help you set up and maintain your mapping solution.'
  }
];

const FeaturesSection = () => {
  return (
    <section className="w-full py-16 flex flex-col items-center justify-center font-sans bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-accent-gold mb-4 tracking-tight">Why Choose Pathix?</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-sans">Powerful features designed specifically for organizations that need professional mapping solutions</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {features.map((feature, idx) => (
            <div key={idx} className="rounded-2xl bg-white border border-gray-100 shadow-lg p-8 flex flex-col items-center text-center hover:shadow-xl transition-all duration-200">
              <div className="mb-4">{feature.icon}</div>
              <div className="font-bold text-lg text-gray-900 mb-2 font-serif">{feature.title}</div>
              <div className="text-gray-600 text-base font-sans">{feature.description}</div>
            </div>
          ))}
        </div>
        <a href="#explore" className="inline-block px-8 py-3 rounded-full font-bold font-sans bg-gradient-to-r from-accent-gold to-accent-gold2 text-white shadow-gold border-0 transition hover:from-accent-gold2 hover:to-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold text-lg">Explore More</a>
      </div>
    </section>
  );
};

export default FeaturesSection; 