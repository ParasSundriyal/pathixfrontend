import React from 'react';

const features = [
  {
    icon: '🗺️',
    title: 'Interactive Maps',
    description: 'Create detailed, interactive maps with custom markers, routes, and points of interest tailored to your space.'
  },
  {
    icon: '📱',
    title: 'Mobile Optimized',
    description: 'Your maps work perfectly on all devices - desktop, tablet, and mobile for seamless navigation.'
  },
  {
    icon: '🎨',
    title: 'Custom Branding',
    description: "Match your organization's branding with custom colors, logos, and styling options."
  },
  {
    icon: '📊',
    title: 'Analytics Dashboard',
    description: 'Track usage patterns and popular destinations to optimize your space and services.'
  },
  {
    icon: '🛡️',
    title: 'Enterprise Security',
    description: 'Bank-level security with data encryption and compliance standards for institutional use.'
  },
  {
    icon: '🎧',
    title: '24/7 Support',
    description: 'Dedicated support team to help you set up and maintain your mapping solution.'
  }
];

const FeaturesSection = () => {
  return (
    <section className="w-full py-20 bg-gradient-to-br from-[#232946] to-[#181c2a] flex flex-col items-center justify-center">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 drop-shadow-lg">Why Choose Pathix?</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">Powerful features designed specifically for organizations that need professional mapping solutions</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="rounded-2xl bg-white/10 border border-white/10 shadow-xl p-8 flex flex-col items-center text-center backdrop-blur-xl hover:scale-105 hover:shadow-2xl transition-all duration-200">
              <div className="text-5xl mb-4 drop-shadow-lg">{feature.icon}</div>
              <div className="font-bold text-xl text-white mb-2">{feature.title}</div>
              <div className="text-gray-300 text-base">{feature.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 