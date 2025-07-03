import React from 'react';

const customers = [
  {
    icon: '🏢',
    title: 'Corporations',
    description: 'Help employees and visitors navigate large office complexes, campuses, and facilities with ease.'
  },
  {
    icon: '🎓',
    title: 'Universities',
    description: 'Guide students, faculty, and visitors through campus buildings, dormitories, and facilities.'
  },
  {
    icon: '🏥',
    title: 'Healthcare Institutions',
    description: 'Reduce patient stress with clear navigation through medical facilities and hospital complexes.'
  },
  {
    icon: '🏖️',
    title: 'Resorts & Hotels',
    description: 'Enhance guest experience with interactive maps of amenities, restaurants, and activities.'
  }
];

const cardBase = {
  background: '#fff',
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

const TargetCustomersSection = () => {
  const [getCardStyle, cardEvents] = useCardHover();
  return (
    <section style={{ padding: '80px 0', background: '#f1f5f9' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>
            Perfect for Your Organization
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
            Trusted by leading organizations worldwide to provide seamless navigation experiences
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {customers.map((customer, idx) => (
            <div key={idx} style={getCardStyle(idx)} {...cardEvents(idx)}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>{customer.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '1.3rem', marginBottom: 8 }}>{customer.title}</div>
              <div style={{ color: '#64748b', fontSize: '1rem' }}>{customer.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TargetCustomersSection; 