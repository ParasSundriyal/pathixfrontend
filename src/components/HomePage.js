import React from 'react';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import TargetCustomersSection from './TargetCustomersSection';
import CTASection from './CTASection';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181c2a] via-[#232946] to-[#232946] flex flex-col items-center justify-center">
      <HeroSection />
      <FeaturesSection />
      <TargetCustomersSection />
      <CTASection />
    </div>
  );
};

export default HomePage; 