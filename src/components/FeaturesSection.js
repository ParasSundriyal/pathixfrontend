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
    description: 'Match your organization\'s branding with custom colors, logos, and styling options.'
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

const cardBase = {
  background: '#f8fafc',
  borderRadius: 16,
  boxShadow: '0 2px 8px #e0e7ff',
  padding: 32,
  textAlign: 'center',
  transition: 'box-shadow 0.3s, transform 0.18s',
  border: '1px solid #e0e7ff',
  color: '#1e293b',
  cursor: 'pointer',
};
const cardHover = {
  boxShadow: '0 8px 32px #a3bffa33',
  transform: 'translateY(-4px) scale(1.03)',
};

function useCardHover() {
  const [hover, setHover] = React.useState(null);
  const getStyle = idx => (hover === idx ? { ...cardBase, ...cardHover } : cardBase);
  return [
    getStyle,
    idx => ({
      onMouseEnter: () => setHover(idx),
      onMouseLeave: () => setHover(null),
      tabIndex: 0,
      onFocus: () => setHover(idx),
      onBlur: () => setHover(null),
    }),
  ];
}

const FeaturesSection = () => {
  const [getCardStyle, cardEvents] = useCardHover();
  return (
    <section style={{ padding: '80px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>
            Why Choose Pathix?
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
            Powerful features designed specifically for organizations that need professional mapping solutions
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
          {features.map((feature, idx) => (
            <div key={idx} style={getCardStyle(idx)} {...cardEvents(idx)}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{feature.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: 8 }}>{feature.title}</div>
              <div style={{ color: '#64748b', fontSize: '1rem' }}>{feature.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 