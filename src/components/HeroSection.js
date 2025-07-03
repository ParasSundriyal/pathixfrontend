import React from 'react';
import { Link } from 'react-router-dom';

const buttonStyle = {
  background: '#2563eb',
  color: '#fff',
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
  background: '#1d4ed8',
  color: '#fff',
  boxShadow: '0 4px 16px #2563eb55',
  transform: 'translateY(-2px) scale(1.035)',
};
const buttonActive = {
  background: '#2563eb',
  color: '#fff',
  boxShadow: '0 1px 4px #2563eb33',
  transform: 'scale(0.97)',
};
const outlineButtonStyle = {
  background: 'transparent',
  color: '#2563eb',
  fontSize: '1.1rem',
  padding: '14px 36px',
  borderRadius: 8,
  border: '2px solid #2563eb',
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
  background: '#2563eb11',
  color: '#1d4ed8',
  border: '2px solid #1d4ed8',
  transform: 'translateY(-2px) scale(1.035)',
};
const outlineButtonActive = {
  background: '#2563eb22',
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

const HeroSection = () => {
  const [getPrimaryStyle, primaryEvents] = useButtonAnimation();
  const [getOutlineStyle, outlineEvents] = useButtonAnimation();
  return (
    <section style={{ background: 'linear-gradient(to bottom right, #e0e7ff, #c7d2fe 80%)', padding: '80px 0 60px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          {/* MapPin icon replacement */}
          <svg width="48" height="48" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 12 }}><path d="M12 21c-4.418 0-8-5.373-8-10a8 8 0 1 1 16 0c0 4.627-3.582 10-8 10z"/><circle cx="12" cy="11" r="3"/></svg>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1e293b' }}>Pathix</h1>
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#64748b', marginBottom: 32, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
          Premium Mapping Solutions for Organizations, Universities, Institutions & Resorts
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#334155', marginBottom: 40, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Create customized interactive maps that help your clients navigate your space with ease. Professional mapping solutions tailored to your unique needs.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/signup">
              <button style={getPrimaryStyle(buttonStyle, buttonHover, buttonActive)} {...primaryEvents}>
                Get Started
                {/* ArrowRight icon replacement */}
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: 8 }}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            </Link>
            <Link to="/signin">
              <button style={getOutlineStyle(outlineButtonStyle, outlineButtonHover, outlineButtonActive)} {...outlineEvents}>
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 