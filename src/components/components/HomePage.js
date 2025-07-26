import React from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import TargetCustomersSection from './TargetCustomersSection';
import CTASection from './CTASection';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      <Navbar />
      <div className="pt-24 w-full flex flex-col items-center">
        <HeroSection />
        <FeaturesSection />
        <TargetCustomersSection />
        <CTASection />
      </div>
    </div>
  );
};

export default HomePage; 