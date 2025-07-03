import React from 'react';

const buttonStyle = {
  background: '#fff',
  color: '#2563eb',
  fontSize: '1.1rem',
  padding: '14px 36px',
  borderRadius: 8,
  border: 'none',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  boxShadow: '0 2px 8px #2563eb33',
  transition: 'background 0.25s, color 0.2s, box-shadow 0.2s, transform 0.12s',
  outline: 'none',
  position: 'relative',
  overflow: 'hidden',
};
const buttonHover = {
  background: '#dbeafe',
  color: '#1d4ed8',
  boxShadow: '0 4px 16px #2563eb55',
  transform: 'translateY(-2px) scale(1.035)',
};
const buttonActive = {
  background: '#a3bffa',
  color: '#2563eb',
  boxShadow: '0 1px 4px #2563eb33',
  transform: 'scale(0.97)',
};
const outlineButtonStyle = {
  background: 'transparent',
  color: '#fff',
  fontSize: '1.1rem',
  padding: '14px 36px',
  borderRadius: 8,
  border: '2px solid #fff',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  boxShadow: '0 2px 8px #2563eb33',
  transition: 'background 0.25s, color 0.2s, box-shadow 0.2s, transform 0.12s',
  outline: 'none',
  position: 'relative',
  overflow: 'hidden',
};
const outlineButtonHover = {
  background: '#fff',
  color: '#2563eb',
  border: '2px solid #a3bffa',
  transform: 'translateY(-2px) scale(1.035)',
};
const outlineButtonActive = {
  background: '#dbeafe',
  color: '#2563eb',
  border: '2px solid #2563eb',
  transform: 'scale(0.97)',
};

function useButtonAnimation() {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const getStyle = (base, hoverStyle, activeStyle) => {
    if (active) return { ...base, ...activeStyle };
    if (hover) return { ...base, ...hoverStyle };
    return base;
  };
  return [
    getStyle,
    {
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => { setHover(false); setActive(false); },
      onMouseDown: () => setActive(true),
      onMouseUp: () => setActive(false),
      onFocus: () => setHover(true),
      onBlur: () => { setHover(false); setActive(false); },
    },
  ];
}

const CTASection = () => {
  const [getPrimaryStyle, primaryEvents] = useButtonAnimation();
  const [getOutlineStyle, outlineEvents] = useButtonAnimation();
  return (
    <section style={{ padding: '80px 0', background: '#2563eb' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: 24 }}>
          Ready to Transform Your Space?
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#dbeafe', marginBottom: 40, maxWidth: 600, margin: '0 auto' }}>
          Join hundreds of organizations that trust Pathix for their mapping needs. Get started with a free consultation today.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 48 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <button style={getPrimaryStyle(buttonStyle, buttonHover, buttonActive)} {...primaryEvents}>
              Start Free Trial
              <span style={{ marginLeft: 8 }}>→</span>
            </button>
            <button style={getOutlineStyle(outlineButtonStyle, outlineButtonHover, outlineButtonActive)} {...outlineEvents}>
              Schedule Demo
            </button>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #fff', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.2rem', marginBottom: 16 }}>Get in Touch</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', color: '#fff', fontSize: '1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span role="img" aria-label="phone">📞</span>
              <span>+1 (555) 123-4567</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span role="img" aria-label="mail">✉️</span>
              <span>hello@pathix.com</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection; 