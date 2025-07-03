import React from 'react';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import TargetCustomersSection from './TargetCustomersSection';
import CTASection from './CTASection';

const HomePage = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f0f4ff, #e0e7ff 80%)' }}>
      <HeroSection />
      <FeaturesSection />
      <TargetCustomersSection />
      <CTASection />
    </div>
  );
};

export default HomePage; 